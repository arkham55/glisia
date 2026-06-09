// frontend/admin/detail-konsultasi.js
const API_BASE = "http://localhost:5002";

function getToken() {
    return localStorage.getItem('glisia_token');
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

async function fetchDetail() {
    const id = getUrlParameter('id');
    if (!id) {
        document.getElementById('detailContent').innerHTML = '<div class="error-text">ID konsultasi tidak ditemukan.</div>';
        return;
    }

    const token = getToken();
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/admin/consultations/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401) {
            localStorage.removeItem('glisia_token');
            window.location.href = '../login.html';
            return;
        }

        const data = await res.json();
        if (data.status === 'success') {
            renderDetail(data.data);
        } else {
            document.getElementById('detailContent').innerHTML = `<div class="error-text">${data.message || 'Gagal memuat data'}</div>`;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('detailContent').innerHTML = '<div class="error-text">Terjadi kesalahan saat memuat data.</div>';
    }
}

function renderDetail(d) {
    const riskClass = (d.risk_level || '').toLowerCase();
    
    const fmtNumber = (num, unit = '') => (num !== null && num !== undefined) ? `${num.toLocaleString()} ${unit}` : '-';
    
    const html = `
        <div class="detail-card">
            <h2><i class="fas fa-user"></i> Informasi Pengguna</h2>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Nama / Email</span><span class="detail-value">${escapeHtml(d.nama || '-')} (${escapeHtml(d.email)})</span></div>
                <div class="detail-item"><span class="detail-label">Tanggal Analisis</span><span class="detail-value">${new Date(d.tanggal).toLocaleString('id-ID')}</span></div>
                <div class="detail-item"><span class="detail-label">Usia</span><span class="detail-value">${d.usia} tahun</span></div>
                <div class="detail-item"><span class="detail-label">Jenis Kelamin</span><span class="detail-value">${d.jenis_kelamin === 'pria' ? 'Pria' : 'Wanita'}</span></div>
                <div class="detail-item"><span class="detail-label">Berat Badan / Tinggi</span><span class="detail-value">${d.weight_kg} kg / ${d.height_cm} cm</span></div>
                <div class="detail-item"><span class="detail-label">BMI</span><span class="detail-value">${d.bmi}</span></div>
            </div>
        </div>
        <div class="detail-card">
            <h2><i class="fas fa-utensils"></i> Asupan & Aktivitas</h2>
            <div class="detail-grid">
                <div class="detail-item"><span class="detail-label">Kalori Harian</span><span class="detail-value">${fmtNumber(d.total_kalori_harian, 'kkal')}</span></div>
                <div class="detail-item"><span class="detail-label">Lemak Harian</span><span class="detail-value">${fmtNumber(d.total_lemak_harian, 'g')}</span></div>
                <div class="detail-item"><span class="detail-label">Karbohidrat Harian</span><span class="detail-value">${fmtNumber(d.total_karbohidrat_harian, 'g')}</span></div>
                <div class="detail-item"><span class="detail-label">TDEE (Kebutuhan Kalori)</span><span class="detail-value">${fmtNumber(d.tdee, 'kkal')}</span></div>
                <div class="detail-item"><span class="detail-label">Surplus/Defisit</span><span class="detail-value">${d.surplus_kalori > 0 ? '+' : ''}${fmtNumber(d.surplus_kalori, 'kkal')}</span></div>
                <div class="detail-item"><span class="detail-label">Aktivitas / Minggu</span><span class="detail-value">${d.aktivitas_menit_per_minggu} menit (${d.intensitas_aktivitas})</span></div>
            </div>
        </div>
        <div class="detail-card">
            <h2><i class="fas fa-chart-line"></i> Hasil Analisis Risiko</h2>
            <div style="margin-bottom: 20px;">
                <span class="risk-badge-large risk-${riskClass}">Tingkat Risiko: ${d.risk_level?.toUpperCase()}</span>
            </div>
            <div class="detail-item"><span class="detail-label">Penjelasan</span><span class="detail-value">${escapeHtml(d.explanation)}</span></div>
        </div>
        <div class="detail-card">
            <h2><i class="fas fa-clipboard-list"></i> Rekomendasi</h2>
            ${d.recommendations && d.recommendations.length ? `
                <ul class="recommendation-list">
                    ${d.recommendations.map(rec => `<li><i class="fas fa-check-circle"></i> ${escapeHtml(rec)}</li>`).join('')}
                </ul>
            ` : '<p>Tidak ada rekomendasi.</p>'}
        </div>
        <div class="detail-card">
            <h2><i class="fas fa-code-branch"></i> Trace Forward Chaining</h2>
            ${d.trace && d.trace.length ? `
                <ul class="trace-list">
                    ${d.trace.map((step, idx) => {
                        let text = '';
                        if (step.rule_id) text = `Aturan ${step.rule_id}: ${step.conclusion || ''}`;
                        else if (step.info) text = step.info;
                        else text = JSON.stringify(step);
                        return `<li><i class="fas fa-microchip"></i> ${escapeHtml(text)}</li>`;
                    }).join('')}
                </ul>
            ` : '<p>Tidak ada trace tersedia.</p>'}
        </div>
    `;
    document.getElementById('detailContent').innerHTML = html;
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function initSidebar() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (toggleBtn) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) document.body.classList.add('sidebar-collapsed');
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
        });
    }
}

document.getElementById('logoutBtnSidebar')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('glisia_token');
    window.location.href = '../login.html';
});

document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    fetchDetail();
});