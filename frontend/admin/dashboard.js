// frontend/admin/dashboard.js
const API_BASE = "http://localhost:5002";

let riskAgeChart = null;
let causeChart = null;
let factorChart = null;

let allConsultations = [];
let currentConsultPage = 1;
let rowsPerPage = 10;

function getToken() {
    return localStorage.getItem('glisia_token');
}

async function fetchAdminAPI(url) {
    const token = getToken();
    if (!token) return null;
    try {
        const res = await fetch(`${API_BASE}${url}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 401) {
            localStorage.removeItem('glisia_token');
            window.location.href = '../login.html';
            return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    } catch (err) {
        console.error("API Error:", err);
        return null;
    }
}

function destroyCharts() {
    if (riskAgeChart) { riskAgeChart.destroy(); riskAgeChart = null; }
    if (causeChart) { causeChart.destroy(); causeChart = null; }
    if (factorChart) { factorChart.destroy(); factorChart = null; }
}

function showChartPlaceholder(canvasId, message) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const container = canvas.parentElement;
    const oldPlaceholder = container.querySelector('.chart-placeholder');
    if (oldPlaceholder) oldPlaceholder.remove();
    canvas.style.display = 'none';
    const placeholder = document.createElement('div');
    placeholder.className = 'chart-placeholder';
    placeholder.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:250px; background:#F9FAFB; border-radius:16px; color:#94A3B8;">
            <i class="fas fa-chart-line" style="font-size:2rem; margin-bottom:12px;"></i>
            <p style="margin:0; font-size:0.85rem;">${message}</p>
        </div>
    `;
    container.appendChild(placeholder);
}

function hideChartPlaceholder(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const container = canvas.parentElement;
    const placeholder = container.querySelector('.chart-placeholder');
    if (placeholder) placeholder.remove();
    canvas.style.display = 'block';
}

async function loadStats() {
    const data = await fetchAdminAPI('/api/admin/stats');
    if (!data || data.status !== 'success') {
        console.warn('Failed to load stats');
        document.getElementById('totalUsers').innerText = '0';
        document.getElementById('highRiskPercent').innerText = '0%';
        document.getElementById('highRiskCount').innerHTML = '<i class="fas fa-info-circle"></i> Belum ada data';
        document.getElementById('avgCalories').innerHTML = '0 <span style="font-size:0.7rem;">kkal/hari</span>';
        document.getElementById('totalConsultations').innerText = '0';
        document.getElementById('userGrowth').innerHTML = '<i class="fas fa-database"></i> <span>Data tidak tersedia</span>';
        destroyCharts();
        showChartPlaceholder('riskAgeChart', 'Belum ada data distribusi risiko');
        showChartPlaceholder('causeChart', 'Belum ada data penyebab risiko tinggi');
        showChartPlaceholder('factorChart', 'Belum ada data faktor paling sering');
        return;
    }
    const d = data.data;
    
    document.getElementById('totalUsers').innerText = d.total_users?.toLocaleString() || '0';
    document.getElementById('highRiskPercent').innerText = (d.high_risk_percentage || 0) + '%';
    const uniqueHigh = d.unique_high_risk_users || 0;
    document.getElementById('highRiskCount').innerHTML = `<i class="fas fa-users"></i> ${uniqueHigh} pengguna terdeteksi`;
    document.getElementById('avgCalories').innerHTML = (d.avg_calories || 0).toLocaleString() + ' <span style="font-size:0.7rem;">kkal/hari</span>';
    document.getElementById('totalConsultations').innerText = d.total_consultations?.toLocaleString() || '0';
    
    const userGrowthEl = document.getElementById('userGrowth');
    if (userGrowthEl && d.user_growth !== undefined) {
        const growth = d.user_growth;
        userGrowthEl.innerHTML = `<i class="fas ${growth >= 0 ? 'fa-arrow-up trend-up' : 'fa-arrow-down trend-down'}"></i> <span>${Math.abs(growth)}% bulan ini</span>`;
    } else if (userGrowthEl) {
        userGrowthEl.innerHTML = `<i class="fas fa-users"></i> <span>Total terdaftar</span>`;
    }

    destroyCharts();

    const ageGroups = d.risk_by_age?.map(item => item.age_group) || [];
    const rendah = d.risk_by_age?.map(item => item.rendah) || [];
    const sedang = d.risk_by_age?.map(item => item.sedang) || [];
    const tinggi = d.risk_by_age?.map(item => item.tinggi) || [];
    
    if (ageGroups.length === 0) {
        showChartPlaceholder('riskAgeChart', 'Belum ada data distribusi risiko');
    } else {
        hideChartPlaceholder('riskAgeChart');
        const ctx1 = document.getElementById('riskAgeChart').getContext('2d');
        riskAgeChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ageGroups,
                datasets: [
                    { label: 'Rendah', data: rendah, backgroundColor: '#34d399', borderRadius: 8 },
                    { label: 'Sedang', data: sedang, backgroundColor: '#fbbf24', borderRadius: 8 },
                    { label: 'Tinggi', data: tinggi, backgroundColor: '#f87171', borderRadius: 8 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Jumlah Pengguna' } } }
            }
        });
    }

    const causeLabels = d.top_factors?.map(f => f.name) || [];
    const causeValues = d.top_factors?.map(f => f.percent) || [];
    
    if (causeLabels.length === 0) {
        showChartPlaceholder('causeChart', 'Belum ada data risiko tinggi');
        showChartPlaceholder('factorChart', 'Belum ada data faktor dominan');
    } else {
        hideChartPlaceholder('causeChart');
        const ctx2 = document.getElementById('causeChart').getContext('2d');
        causeChart = new Chart(ctx2, {
            type: 'pie',
            data: {
                labels: causeLabels,
                datasets: [{ data: causeValues, backgroundColor: ['#f97316','#eab308','#3b82f6','#8b5cf6'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
        
        hideChartPlaceholder('factorChart');
        const ctx3 = document.getElementById('factorChart').getContext('2d');
        factorChart = new Chart(ctx3, {
            type: 'doughnut',
            data: {
                labels: causeLabels,
                datasets: [{ data: causeValues, backgroundColor: ['#10b981','#f59e0b','#ef4444','#6366f1'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });
    }
}

async function fetchAllConsultations() {
    const data = await fetchAdminAPI('/api/admin/consultations?limit=1000');
    if (!data || data.status !== 'success') {
        document.getElementById('recentTableBody').innerHTML = '<tr><td colspan="6" class="error-text">Gagal memuat data konsultasi</td</tr>';
        document.getElementById('totalCons').innerText = '0';
        return [];
    }
    return data.data || [];
}

function renderConsultationTable() {
    const tbody = document.getElementById('recentTableBody');
    const total = allConsultations.length;
    const start = (currentConsultPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = allConsultations.slice(start, end);
    
    if (!pageData.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text"><i class="fas fa-inbox"></i> Belum ada riwayat konsultasi</td</tr>';
        document.getElementById('totalCons').innerText = total;
        return;
    }
    
    tbody.innerHTML = '';
    pageData.forEach(row => {
        const tr = document.createElement('tr');
        const riskClass = (row.risk_level || '').toLowerCase();
        tr.innerHTML = `
            <td>SUB-${row.id}</td>
            <td>${escapeHtml(row.user_name)}</td>
            <td>${row.bmi}</td>
            <td><span class="risk-badge risk-${riskClass}">${row.risk_level}</span></td>
            <td>${escapeHtml(row.faktor_utama)}</td>
            <td><button class="btn-detail" data-id="${row.id}">Lihat Detail</button></td>
        `;
        tbody.appendChild(tr);
    });
    
    // 🔥 Perubahan: arahkan ke halaman detail konsultasi
    document.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            window.location.href = `detail-konsultasi.html?id=${id}`;
        });
    });
    
    document.getElementById('totalCons').innerText = total;
    renderPaginationButtons(total);
}

function renderPaginationButtons(totalItems) {
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    const container = document.getElementById('consultationPagination');
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    let html = '';
    html += `<button class="page-btn" data-page="prev" ${currentConsultPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    let startPage = Math.max(1, currentConsultPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentConsultPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    html += `<button class="page-btn" data-page="next" ${currentConsultPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = btn.dataset.page;
            if (page === 'prev' && currentConsultPage > 1) currentConsultPage--;
            else if (page === 'next' && currentConsultPage < totalPages) currentConsultPage++;
            else if (!isNaN(parseInt(page))) currentConsultPage = parseInt(page);
            renderConsultationTable();
        });
    });
}

async function loadRecentConsultations() {
    document.getElementById('recentTableBody').innerHTML = '<td><td colspan="6" class="loading-text"><div class="skeleton-loader"></div> Memuat data terbaru...</td</tr>';
    allConsultations = await fetchAllConsultations();
    currentConsultPage = 1;
    renderConsultationTable();
}

function initPaginationControls() {
    const rowsSelect = document.getElementById('rowsPerPageSelect');
    if (rowsSelect) {
        rowsSelect.value = rowsPerPage;
        rowsSelect.addEventListener('change', (e) => {
            rowsPerPage = parseInt(e.target.value);
            currentConsultPage = 1;
            renderConsultationTable();
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

async function refreshDashboard() {
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Memuat...';
    }
    try {
        await Promise.all([loadStats(), loadRecentConsultations()]);
    } catch (err) {
        console.error(err);
    } finally {
        if (refreshBtn) {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
            refreshBtn.disabled = false;
        }
    }
}

async function initAdmin() {
    const token = getToken();
    if (!token) {
        window.location.href = '../login.html';
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status === 'success' && data.user.role === 'admin') {
            const adminNameSpan = document.getElementById('adminName');
            if (adminNameSpan) adminNameSpan.innerText = data.user.email.split('@')[0];
            const userNameSpan = document.getElementById('userName');
            if (userNameSpan) userNameSpan.innerText = data.user.email.split('@')[0];
        } else {
            throw new Error('Not admin');
        }
    } catch(e) {
        localStorage.removeItem('glisia_token');
        window.location.href = '../login.html';
        return;
    }
    
    const logoutBtns = document.querySelectorAll('#logoutBtn, #logoutBtnSidebar');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('glisia_token');
            window.location.href = '../index.html';
        });
    });
    
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', refreshDashboard);
    initPaginationControls();
    
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (toggleBtn) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) document.body.classList.add('sidebar-collapsed');
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
        });
    }
    
    await refreshDashboard();
}

document.addEventListener('DOMContentLoaded', initAdmin);