// frontend/admin/edukasi.js
const API_BASE = 'http://localhost:5002';

// State
let allEdukasi = [];
let currentPage = 1;
const rowsPerPage = 10;
let currentSearch = '';
let currentFilter = '';

// Helper ambil token
function getToken() {
    return localStorage.getItem('glisia_token');
}

// Fetch dengan autentikasi
async function authFetch(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (response.status === 401) {
        alert('Sesi habis. Silakan login kembali.');
        localStorage.removeItem('glisia_token');
        window.location.href = '../login.html';
        return null;
    }
    return response.json();
}

// Cek role admin
async function checkAdmin() {
    const token = getToken();
    if (!token) {
        window.location.href = '../login.html';
        return false;
    }
    try {
        const res = await authFetch('/api/auth/me');
        if (res?.status === 'success' && res.user.role === 'admin') return true;
        window.location.href = '../login.html';
        return false;
    } catch {
        window.location.href = '../login.html';
        return false;
    }
}

// Update statistik (total materi, kategori, views)
function updateStats() {
    const total = allEdukasi.length;
    const uniqueKategori = new Set(allEdukasi.map(item => item.kategori)).size;
    const totalViews = allEdukasi.reduce((sum, item) => sum + (item.views || 0), 0);
    const totalMateriEl = document.getElementById('totalMateri');
    const totalKategoriEl = document.getElementById('totalKategori');
    const totalViewsEl = document.getElementById('totalViews');
    if (totalMateriEl) totalMateriEl.innerText = total;
    if (totalKategoriEl) totalKategoriEl.innerText = uniqueKategori;
    if (totalViewsEl) totalViewsEl.innerText = totalViews;
}

// Filter data berdasarkan search & kategori
function getFilteredData() {
    let filtered = [...allEdukasi];
    if (currentFilter) filtered = filtered.filter(item => item.kategori === currentFilter);
    if (currentSearch) {
        const lower = currentSearch.toLowerCase();
        filtered = filtered.filter(item =>
            item.judul.toLowerCase().includes(lower) ||
            (item.konten && item.konten.toLowerCase().includes(lower))
        );
    }
    return filtered;
}

// Render tabel dan pagination
function renderTable() {
    const filtered = getFilteredData();
    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    const start = (currentPage - 1) * rowsPerPage;
    const pageData = filtered.slice(start, start + rowsPerPage);
    const tbody = document.getElementById('edukasiList');

    if (!pageData.length) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="error-text">Tidak ada materi edukasi</td></tr>';
        const paginationContainer = document.getElementById('pagination');
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    if (tbody) {
        tbody.innerHTML = '';
        pageData.forEach(item => {
            const row = tbody.insertRow();
            row.insertCell(0).innerText = item.id;
            row.insertCell(1).innerHTML = `<span class="kategori-badge">${escapeHtml(item.kategori)}</span>`;
            row.insertCell(2).innerHTML = `<strong>${escapeHtml(item.judul)}</strong><br><small>${escapeHtml(item.subtitle || '')}</small>`;
            row.insertCell(3).innerText = item.sumber || '-';
            row.insertCell(4).innerText = item.views || 0;
            const actionCell = row.insertCell(5);
            actionCell.className = 'action-buttons';
            actionCell.innerHTML = `
                <button class="btn-edit" data-id="${item.id}"><i class="fas fa-edit"></i> Edit</button>
                <button class="btn-delete" data-id="${item.id}"><i class="fas fa-trash"></i> Hapus</button>
            `;
        });
    }

    // Attach event listeners setelah render
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.removeEventListener('click', editHandler);
        btn.addEventListener('click', editHandler);
    });
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.removeEventListener('click', deleteHandler);
        btn.addEventListener('click', deleteHandler);
    });

    renderPagination(totalPages);
}

async function editHandler(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    await openEditModal(id);
}

async function deleteHandler(e) {
    const btn = e.currentTarget;
    const id = parseInt(btn.dataset.id);
    if (confirm('Yakin ingin menghapus materi ini?')) {
        await deleteEdukasi(id);
    }
}

function renderPagination(totalPages) {
    const container = document.getElementById('pagination');
    if (!container) return;
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    let html = `<button class="page-btn" data-page="prev" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    html += `<button class="page-btn" data-page="next" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;

    container.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.dataset.page;
            if (page === 'prev' && currentPage > 1) currentPage--;
            else if (page === 'next' && currentPage < totalPages) currentPage++;
            else if (!isNaN(parseInt(page))) currentPage = parseInt(page);
            renderTable();
        });
    });
}

// Load data dari server
async function loadEdukasi() {
    const tbody = document.getElementById('edukasiList');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="loading-text">Memuat data...<\/td><\/tr>';
    const data = await authFetch('/api/admin/edukasi');
    if (data?.status === 'success') {
        allEdukasi = data.data;
        // URUTKAN BERDASARKAN ID DARI TERKECIL (ASCENDING)
        allEdukasi.sort((a, b) => a.id - b.id);
        updateStats();
        currentPage = 1;
        renderTable();
    } else {
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="error-text">Gagal memuat data<\/td><\/tr>';
    }
}

// Buka modal edit
async function openEditModal(id) {
    const data = await authFetch(`/api/admin/edukasi/${id}`);
    if (data?.status === 'success') {
        const d = data.data;
        const idField = document.getElementById('edukasiId');
        const kategori = document.getElementById('kategori');
        const judul = document.getElementById('judul');
        const subtitle = document.getElementById('subtitle');
        const konten = document.getElementById('konten');
        const sumber = document.getElementById('sumber');
        const gambarUrl = document.getElementById('gambar_url');
        const modalTitle = document.getElementById('modalTitle');
        if (idField) idField.value = d.id;
        if (kategori) kategori.value = d.kategori;
        if (judul) judul.value = d.judul;
        if (subtitle) subtitle.value = d.subtitle || '';
        if (konten) konten.value = d.konten;
        if (sumber) sumber.value = d.sumber || '';
        if (gambarUrl) gambarUrl.value = d.gambar_url || '';
        if (modalTitle) modalTitle.innerText = 'Edit Materi Edukasi';
        const modal = document.getElementById('modalEdukasi');
        if (modal) modal.style.display = 'block';
    } else {
        alert('Gagal mengambil data materi');
    }
}

// Hapus materi
async function deleteEdukasi(id) {
    const res = await authFetch(`/api/admin/edukasi/${id}`, { method: 'DELETE' });
    if (res?.status === 'success') {
        alert('Materi berhasil dihapus');
        loadEdukasi();
    } else {
        alert(res?.message || 'Gagal menghapus');
    }
}

// Submit form tambah/edit
const form = document.getElementById('formEdukasi');
if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('edukasiId').value;
        const payload = {
            kategori: document.getElementById('kategori').value,
            judul: document.getElementById('judul').value.trim(),
            subtitle: document.getElementById('subtitle').value,
            konten: document.getElementById('konten').value,
            sumber: document.getElementById('sumber').value,
            gambar_url: document.getElementById('gambar_url').value
        };
        if (!payload.judul || !payload.konten) return alert('Judul dan konten harus diisi');

        const url = id ? `/api/admin/edukasi/${id}` : '/api/admin/edukasi';
        const method = id ? 'PUT' : 'POST';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });
        if (res?.status === 'success') {
            alert(res.message || 'Materi berhasil disimpan');
            closeModal();
            loadEdukasi();
        } else {
            alert(res?.message || 'Gagal menyimpan materi');
        }
    });
}

// Modal helpers
function closeModal() {
    const modal = document.getElementById('modalEdukasi');
    if (modal) modal.style.display = 'none';
    const formEl = document.getElementById('formEdukasi');
    if (formEl) formEl.reset();
    const idField = document.getElementById('edukasiId');
    if (idField) idField.value = '';
}

const btnTambah = document.getElementById('btnTambah');
if (btnTambah) {
    btnTambah.onclick = () => {
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.innerText = 'Tambah Materi Edukasi';
        const formEl = document.getElementById('formEdukasi');
        if (formEl) formEl.reset();
        const idField = document.getElementById('edukasiId');
        if (idField) idField.value = '';
        const modal = document.getElementById('modalEdukasi');
        if (modal) modal.style.display = 'block';
    };
}

const closeModalBtn = document.querySelector('.close');
if (closeModalBtn) closeModalBtn.onclick = closeModal;
const cancelModalBtn = document.getElementById('cancelModal');
if (cancelModalBtn) cancelModalBtn.onclick = closeModal;

window.onclick = (e) => {
    const modal = document.getElementById('modalEdukasi');
    if (e.target === modal) closeModal();
    const importModal = document.getElementById('importModal');
    if (importModal && e.target === importModal) closeImportModal();
};

// Logout
const logoutBtn = document.getElementById('logoutBtnSidebar');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('glisia_token');
        window.location.href = '../login.html';
    });
}

// Search & filter
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        currentPage = 1;
        renderTable();
    });
}
const filterKategori = document.getElementById('filterKategori');
if (filterKategori) {
    filterKategori.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        currentPage = 1;
        renderTable();
    });
}

// Sidebar toggle
function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (toggleBtn) {
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        if (isCollapsed) document.body.classList.add('sidebar-collapsed');
        toggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('sidebar-collapsed');
            const collapsed = document.body.classList.contains('sidebar-collapsed');
            localStorage.setItem('sidebarCollapsed', collapsed);
        });
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

// ==================== IMPORT JSON ====================
function closeImportModal() {
    const modal = document.getElementById('importModal');
    if (modal) modal.style.display = 'none';
    const progressDiv = document.getElementById('importProgress');
    if (progressDiv) progressDiv.style.display = 'none';
    const fileInput = document.getElementById('jsonFileInput');
    const textArea = document.getElementById('jsonTextInput');
    if (fileInput) fileInput.value = '';
    if (textArea) textArea.value = '';
}

async function processImport() {
    const fileInput = document.getElementById('jsonFileInput');
    const textArea = document.getElementById('jsonTextInput');
    let jsonData = null;
    let rawText = '';

    if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        try {
            rawText = await file.text();
        } catch (err) {
            alert('Gagal membaca file: ' + err.message);
            return;
        }
    } else if (textArea.value.trim()) {
        rawText = textArea.value.trim();
    } else {
        alert('Silakan pilih file JSON atau tempel teks JSON.');
        return;
    }

    try {
        jsonData = JSON.parse(rawText);
    } catch (e) {
        alert('Format JSON tidak valid: ' + e.message);
        return;
    }

    if (!Array.isArray(jsonData)) {
        alert('JSON harus berupa array of objects.');
        return;
    }

    if (jsonData.length === 0) {
        alert('Array kosong, tidak ada data untuk diimport.');
        return;
    }

    // Validasi setiap item
    const requiredFields = ['kategori', 'judul', 'konten'];
    const validKategori = ['minuman', 'makanan', 'metabolisme', 'aktivitas', 'tips', 'karbohidrat'];
    for (let i = 0; i < jsonData.length; i++) {
        const item = jsonData[i];
        for (let field of requiredFields) {
            if (!item[field] || typeof item[field] !== 'string' || item[field].trim() === '') {
                alert(`Item ke-${i+1} tidak memiliki field "${field}" yang valid.`);
                return;
            }
        }
        if (!validKategori.includes(item.kategori)) {
            alert(`Item ke-${i+1} kategori "${item.kategori}" tidak valid. Gunakan: ${validKategori.join(', ')}`);
            return;
        }
        // set default untuk field opsional
        if (!item.subtitle) item.subtitle = '';
        if (!item.sumber) item.sumber = '';
        if (!item.gambar_url) item.gambar_url = '';
    }

    if (!confirm(`Akan mengimport ${jsonData.length} materi edukasi. Lanjutkan?`)) return;

    const progressDiv = document.getElementById('importProgress');
    const progressFill = document.getElementById('importProgressFill');
    const statusMsg = document.getElementById('importStatusMsg');
    progressDiv.style.display = 'block';
    progressFill.style.width = '0%';
    statusMsg.innerText = `Memproses 0 dari ${jsonData.length}...`;

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < jsonData.length; i++) {
        const item = jsonData[i];
        try {
            const res = await authFetch('/api/admin/edukasi', {
                method: 'POST',
                body: JSON.stringify(item)
            });
            if (res && res.status === 'success') {
                successCount++;
            } else {
                failCount++;
                console.error(`Gagal import item ${i+1}:`, res?.message);
            }
        } catch (err) {
            failCount++;
            console.error(`Error import item ${i+1}:`, err);
        }
        const percent = ((i+1) / jsonData.length) * 100;
        progressFill.style.width = `${percent}%`;
        statusMsg.innerText = `Memproses ${i+1} dari ${jsonData.length}... (berhasil: ${successCount}, gagal: ${failCount})`;
    }

    statusMsg.innerText = `✅ Selesai. Berhasil: ${successCount}, Gagal: ${failCount}`;
    if (successCount > 0) {
        setTimeout(() => {
            closeImportModal();
            loadEdukasi();
        }, 1500);
    }
}

function initImportButton() {
    const btnImport = document.getElementById('btnImportJson');
    if (btnImport) {
        btnImport.addEventListener('click', () => {
            const modal = document.getElementById('importModal');
            if (modal) modal.style.display = 'block';
            // reset form
            const fileInput = document.getElementById('jsonFileInput');
            const textArea = document.getElementById('jsonTextInput');
            if (fileInput) fileInput.value = '';
            if (textArea) textArea.value = '';
            const progressDiv = document.getElementById('importProgress');
            if (progressDiv) progressDiv.style.display = 'none';
        });
    }
    const processBtn = document.getElementById('btnProcessImport');
    if (processBtn) processBtn.addEventListener('click', processImport);
    const cancelImportBtn = document.getElementById('btnCancelImport');
    if (cancelImportBtn) cancelImportBtn.addEventListener('click', closeImportModal);
    const closeImportX = document.querySelector('.close-import');
    if (closeImportX) closeImportX.addEventListener('click', closeImportModal);
}

// Init
(async function init() {
    await checkAdmin();
    initSidebarToggle();
    loadEdukasi();
    initImportButton();
})();