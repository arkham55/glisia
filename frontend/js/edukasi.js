// js/edukasi.js - UPDATED v2.1 (tanpa durasi_menit, author, reviewer)
const API_BASE = "http://localhost:5002";

let semuaMateri = [];
let currentUser = null;

// ==================== AUTHENTICATION ====================
function getToken() {
    return localStorage.getItem('glisia_token');
}

async function checkLoginStatus() {
    const token = getToken();
    if (!token) {
        document.getElementById('guestMenu').style.display = 'flex';
        document.getElementById('userMenu').style.display = 'none';
        return null;
    }
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.status === 200) {
            const data = await res.json();
            if (data.status === 'success') {
                currentUser = data.user;
                document.getElementById('guestMenu').style.display = 'none';
                document.getElementById('userMenu').style.display = 'flex';
                document.getElementById('userName').innerText = currentUser.email.split('@')[0];
                const adminLink = document.getElementById('adminPanelLink');
                if (adminLink && currentUser.role === 'admin') {
                    adminLink.style.display = 'block';
                    adminLink.href = 'admin/edukasi.html';
                }
                return currentUser;
            }
        }
        localStorage.removeItem('glisia_token');
        document.getElementById('guestMenu').style.display = 'flex';
        document.getElementById('userMenu').style.display = 'none';
    } catch (err) {
        console.error('❌ Error checking login:', err);
        document.getElementById('guestMenu').style.display = 'flex';
        document.getElementById('userMenu').style.display = 'none';
    }
    return null;
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('glisia_token');
    window.location.href = 'index.html';
});

document.getElementById('btnLogin')?.addEventListener('click', () => {
    window.location.href = 'login.html';
});

// ==================== LOAD DATA EDUKASI ====================
async function loadEdukasi() {
    try {
        const res = await fetch(`${API_BASE}/api/edukasi`);
        const data = await res.json();
        
        if (data.status === 'success') {
            semuaMateri = data.data;
            console.log(`✅ Loaded ${semuaMateri.length} materials`);
            
            const featured = semuaMateri.length > 0 ? semuaMateri[0] : null;
            renderFeatured(featured);
            renderMateriList(semuaMateri);
            generateFilterButtons(semuaMateri);
        } else {
            console.error('❌ Failed to load:', data.message);
            document.getElementById('materiGrid').innerHTML = '<p class="error-msg">Gagal memuat materi.</p>';
        }
        
        loadTipsCallout();
    } catch (err) {
        console.error('❌ Network error:', err);
        document.getElementById('materiGrid').innerHTML = '<p class="error-msg">Terjadi kesalahan jaringan.</p>';
    }
}

// ========== GENERATE FILTER BUTTONS ==========
function generateFilterButtons(materi) {
    const categories = new Set(materi.map(m => m.kategori));
    const filterBar = document.getElementById('filterBar');
    
    if (!filterBar) {
        console.warn('⚠️ Filter bar not found');
        return;
    }

    filterBar.innerHTML = '';
    
    const btn = document.createElement('button');
    btn.className = 'filter-btn active';
    btn.setAttribute('data-kategori', 'semua');
    btn.innerText = 'Semua';
    filterBar.appendChild(btn);

    const priority = ['minuman', 'makanan', 'metabolisme', 'aktivitas', 'tips', 'karbohidrat'];
    
    priority.forEach(kat => {
        if (categories.has(kat)) {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-kategori', kat);
            btn.innerText = kat.charAt(0).toUpperCase() + kat.slice(1);
            filterBar.appendChild(btn);
        }
    });

    categories.forEach(kat => {
        if (!priority.includes(kat)) {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.setAttribute('data-kategori', kat);
            btn.innerText = kat.charAt(0).toUpperCase() + kat.slice(1);
            filterBar.appendChild(btn);
        }
    });

    initFilters();
}

// ========== FILTER MATERI ==========
function filterMateri(kategori, search) {
    let hasil = [...semuaMateri];
    
    if (kategori && kategori !== 'semua') {
        hasil = hasil.filter(m => m.kategori === kategori);
    }
    
    if (search && search.trim() !== '') {
        const keyword = search.toLowerCase();
        hasil = hasil.filter(m => 
            m.judul.toLowerCase().includes(keyword) ||
            (m.subtitle && m.subtitle.toLowerCase().includes(keyword)) ||
            (m.konten && m.konten.toLowerCase().includes(keyword))
        );
    }
    
    return hasil;
}

function renderMateriByFilter(kategori, search) {
    const filtered = filterMateri(kategori, search);
    renderMateriList(filtered);
}

// Hitung estimasi menit baca (asumsi 200 kata per menit)
function estimasiMenitBaca(konten) {
    if (!konten) return 5;
    const plainText = konten.replace(/<[^>]*>/g, '');
    const kata = plainText.split(/\s+/).length;
    return Math.max(2, Math.ceil(kata / 200));
}

// ========== RENDER MATERI LIST ==========
function renderMateriList(materiList) {
    const grid = document.getElementById('materiGrid');
    
    if (!grid) {
        console.warn('⚠️ Material grid not found');
        return;
    }

    if (!materiList || materiList.length === 0) {
        grid.innerHTML = '<p class="empty-msg">Tidak ada materi dalam kategori ini.</p>';
        return;
    }

    grid.innerHTML = materiList.map(item => {
        const imageUrl = item.gambar_url || getConsistentImage(item.id, item.kategori);
        const estimasi = estimasiMenitBaca(item.konten);
        
        return `
            <div class="materi-card" data-id="${item.id}">
                <div class="card-image">
                    <img 
                        class="card-image-img"
                        data-src="${escapeHtml(imageUrl)}"
                        data-kategori="${escapeHtml(item.kategori)}"
                        alt="${escapeHtml(item.judul)}"
                        style="width:100%; height:100%; object-fit:cover;"
                    >
                </div>
                <div class="card-content">
                    <span class="card-category">${escapeHtml(item.kategori)}</span>
                    <div class="card-title">${escapeHtml(item.judul)}</div>
                    <div class="card-subtitle">${escapeHtml(item.subtitle || '')}</div>
                    <div class="card-meta">
                        <span><i class="far fa-clock"></i> ${estimasi} menit baca</span>
                        <button class="btn-read" data-id="${item.id}">Pelajari →</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const images = document.querySelectorAll('.card-image-img');
    images.forEach(img => {
        const src = img.getAttribute('data-src');
        const kategori = img.getAttribute('data-kategori');
        loadImageWithFallback(img, src, kategori, img.alt);
    });

    document.querySelectorAll('.btn-read').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            window.location.href = `edukasi-detail.html?id=${id}`;
        });
    });
}

// ========== FEATURED MODULE ==========
function getStatBasedOnArticle(article) {
    if (!article) {
        return {
            title: "📊 Fakta Metabolik",
            value: "Kelebihan 500 kkal/hari = +0,5 kg/minggu",
            note: "Defisit kalori yang terkontrol kunci penurunan berat badan"
        };
    }

    const judul = (article.judul || '').toLowerCase();
    const kategori = article.kategori || '';

    if (kategori === "metabolisme" || judul.includes("metabolisme") || judul.includes("tdee")) {
        return {
            title: "🔥 Total Pengeluaran Energi (TDEE)",
            value: "2000 - 2500 kkal/hari",
            note: "*Rata-rata dewasa dengan aktivitas sedang"
        };
    }
    
    if (kategori === "karbohidrat" || judul.includes("karbohidrat")) {
        return {
            title: "🍚 Rekomendasi Karbohidrat",
            value: "50-55% dari total kalori",
            note: "Pilih karbohidrat kompleks untuk metabolisme stabil"
        };
    }
    
    if (judul.includes("lemak") || kategori === "lemak") {
        return {
            title: "🥑 Asupan Lemak Harian",
            value: "44-78 gram/hari",
            note: "Prioritaskan lemak tak jenuh dari alpukat, kacang, ikan"
        };
    }
    
    if (kategori === "aktivitas") {
        return {
            title: "🏃 Rekomendasi WHO",
            value: "150 menit aktivitas sedang/minggu",
            note: "Atau 75 menit aktivitas berat + latihan kekuatan"
        };
    }
    
    if (kategori === "tips") {
        return {
            title: "💡 Tips Sehat Terbukti",
            value: "Jalan kaki 10 menit setelah makan",
            note: "Menurunkan lonjakan gula darah hingga 30%"
        };
    }
    
    if (kategori === "minuman") {
        return {
            title: "🥤 Gula Tersembunyi",
            value: "35-60 gram gula per botol",
            note: "Melebihi batas harian WHO (25 gram)"
        };
    }
    
    if (kategori === "makanan") {
        return {
            title: "🍽️ Fakta Metabolik",
            value: "Makanan olahan = +500 kkal/hari",
            note: "Studi Cell Metabolism (2019)"
        };
    }

    return {
        title: "📊 Fakta Metabolik",
        value: "Kelebihan 500 kkal/hari = +0,5 kg/minggu",
        note: "Defisit kalori yang terkontrol kunci penurunan berat badan"
    };
}

function renderFeatured(article) {
    const container = document.getElementById('featuredModule');
    
    if (!container) {
        console.warn('⚠️ Featured container not found');
        return;
    }

    if (!article) {
        container.innerHTML = '<div class="featured-content"><p>Belum ada materi unggulan.</p></div>';
        return;
    }

    let shortDesc = article.subtitle || 'Klik untuk membaca lebih lanjut.';
    if (shortDesc.length > 120) {
        shortDesc = shortDesc.substring(0, 120) + '...';
    }

    const stat = getStatBasedOnArticle(article);
    const imageUrl = article.gambar_url || getRandomImage(article.kategori);
    const estimasi = estimasiMenitBaca(article.konten);

    container.innerHTML = `
        <div class="featured-content">
            <h2>${escapeHtml(article.judul)}</h2>
            <p>${escapeHtml(shortDesc)}</p>
            <div class="featured-stats">
                <div class="stats-title">${stat.title}</div>
                <div class="stats-value">${stat.value}</div>
                <small>${stat.note}</small>
            </div>
            <div class="featured-meta">
                <span><i class="fas fa-clock"></i> ${estimasi} menit baca</span>
                <span><i class="fas fa-tag"></i> ${escapeHtml(article.kategori)}</span>
            </div>
            <button class="btn-featured" data-id="${article.id}">Pelajari Selengkapnya →</button>
        </div>
        <div class="featured-image">
            <img 
                class="featured-img"
                data-src="${escapeHtml(imageUrl)}"
                data-kategori="${escapeHtml(article.kategori)}"
                alt="${escapeHtml(article.judul)}"
                style="width:100%; height:100%; object-fit:cover; border-radius:20px;"
            >
        </div>
    `;

    const featuredImg = container.querySelector('.featured-img');
    if (featuredImg) {
        loadImageWithFallback(featuredImg, imageUrl, article.kategori, article.judul);
    }

    const btn = container.querySelector('.btn-featured');
    if (btn) {
        btn.addEventListener('click', () => {
            window.location.href = `edukasi-detail.html?id=${article.id}`;
        });
    }
}

// ========== FUNGSI GAMBAR (dari gambar-otomatis.js) ==========
// Fungsi getConsistentImage, getRandomImage, loadImageWithFallback
// (didefinisikan di file terpisah, tidak perlu diubah)

// ========== FILTER EVENTS & INIT ==========
function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const searchInput = document.getElementById('searchEdukasi');
    let currentKategori = 'semua';
    let currentSearch = '';

    const updateDisplay = () => {
        renderMateriByFilter(currentKategori, currentSearch);
    };

    filterBtns.forEach(btn => {
        btn.removeEventListener('click', () => {});
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentKategori = btn.getAttribute('data-kategori');
            updateDisplay();
        });
    });

    if (searchInput) {
        let timeout;
        searchInput.removeEventListener('input', () => {});
        searchInput.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                currentSearch = e.target.value;
                updateDisplay();
            }, 300);
        });
    }
}

// ========== TIPS CALLOUT (BAHASA INDONESIA) ==========
const tipsList = [
    "💧 Minum segelas air putih sebelum makan dapat membantu mengurangi asupan kalori hingga 75-90 kkal per makan.",
    "🍎 Konsumsi buah utuh daripada jus untuk mendapatkan serat yang memperlambat penyerapan gula.",
    "🚶‍♀️ Jalan kaki selama 10 menit setelah makan terbukti menurunkan lonjakan gula darah hingga 30%.",
    "😴 Tidur kurang dari 6 jam dapat meningkatkan risiko resistensi insulin hingga 30%.",
    "🍚 Ganti nasi putih dengan nasi merah atau oatmeal untuk karbohidrat kompleks yang lebih sehat.",
    "🧘‍♀️ Meditasi atau pernapasan dalam 5 menit dapat menurunkan hormon stres kortisol.",
    "🥤 Satu botol soda mengandung 35 gram gula, melebihi batas harian WHO (25 gram).",
    "🍗 Protein memiliki efek termogenik tinggi, membantu membakar 20-30% kalorinya sendiri.",
    "📱 Kurangi ngemil saat belajar online dengan menyiapkan camilan sehat di meja.",
    "🧂 Batasi konsumsi garam karena dapat meningkatkan tekanan darah dan risiko jantung.",
    "🍌 Pisang matang mengandung indeks glikemik sedang, lebih baik pilih pisang yang masih agak hijau.",
    "🥑 Lemak tak jenuh dari alpukat dan kacang-kacangan baik untuk kesehatan jantung.",
    "📊 Mencatat asupan makanan selama 3 hari dapat membantu mengetahui pola makan Anda."
];

let lastTipIndex = -1;

function getRandomTip() {
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * tipsList.length);
    } while (tipsList.length > 1 && newIndex === lastTipIndex);
    lastTipIndex = newIndex;
    return tipsList[newIndex];
}

function loadTipsCallout() {
    const tipsDiv = document.getElementById('tipsCallout');
    if (!tipsDiv) return;

    const randomTip = getRandomTip();
    tipsDiv.innerHTML = `
        <h3><i class="fas fa-seedling"></i> Ingin Mengurangi Keinginan Makan Manis?</h3>
        <p id="tipsMessage">${randomTip}</p>
        <button id="tipsMoreBtn" class="btn-tips">Tips Lainnya →</button>
    `;

    const tipsMoreBtn = document.getElementById('tipsMoreBtn');
    if (tipsMoreBtn) {
        tipsMoreBtn.addEventListener('click', () => {
            const newTip = getRandomTip();
            const tipsMessage = document.getElementById('tipsMessage');
            if (tipsMessage) tipsMessage.innerText = newTip;
        });
    }
}

// ========== SARAN FORM (BAHASA INDONESIA) ==========
function initSaranForm() {
    const form = document.getElementById('saranForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nama = document.getElementById('saranNama')?.value || '';
        const email = document.getElementById('saranEmail')?.value || '';
        const topik = (document.getElementById('saranTopik')?.value || '').trim();
        const deskripsi = document.getElementById('saranDeskripsi')?.value || '';

        if (!topik) {
            alert('Topik saran harus diisi');
            return;
        }

        const payload = { nama, email, topik, deskripsi };
        const statusDiv = document.getElementById('saranStatus');
        
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fas fa-spinner fa-pulse"></i> Mengirim...';
        }

        try {
            const res = await fetch(`${API_BASE}/api/edukasi/saran`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (statusDiv) {
                if (data.status === 'success') {
                    statusDiv.innerHTML = '<span class="success">✓ Saran terkirim! Terima kasih.</span>';
                    form.reset();
                    setTimeout(() => statusDiv.innerHTML = '', 3000);
                } else {
                    statusDiv.innerHTML = '<span class="error">Gagal mengirim saran: ' + (data.message || '') + '</span>';
                }
            }
        } catch (err) {
            console.error('❌ Error:', err);
            if (statusDiv) {
                statusDiv.innerHTML = '<span class="error">Gagal terhubung ke server.</span>';
            }
        }
    });
}

// ========== HELPER FUNCTIONS ==========
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing GLISIA Education Page...');
    
    await checkLoginStatus();
    await loadEdukasi();
    initSaranForm();

    const modal = document.getElementById('detailModal');
    if (modal) modal.style.display = 'none';

    console.log('✅ Page loaded successfully!');
});