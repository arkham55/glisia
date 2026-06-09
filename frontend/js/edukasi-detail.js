// js/edukasi-detail.js
const API_BASE = "http://localhost:5002";

// ==================== AUTHENTICATION ====================
let currentUser = null;

function getToken() {
    return localStorage.getItem('glisia_token');
}

function removeToken() {
    localStorage.removeItem('glisia_token');
}

function showGuestMenu() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    if (guestMenu) guestMenu.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
}

function showUserMenu() {
    const guestMenu = document.getElementById('guestMenu');
    const userMenu = document.getElementById('userMenu');
    if (guestMenu) guestMenu.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    const userNameSpan = document.getElementById('userName');
    if (userNameSpan && currentUser) userNameSpan.innerText = currentUser.email.split('@')[0];
    const adminLink = document.getElementById('adminPanelLink');
    if (adminLink && currentUser && currentUser.role === 'admin') {
        adminLink.style.display = 'block';
        adminLink.href = 'admin/edukasi.html';
    } else if (adminLink) {
        adminLink.style.display = 'none';
    }
}

async function checkLoginStatus() {
    const token = getToken();
    if (!token) {
        showGuestMenu();
        return null;
    }
    try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (res.status === 200) {
            const data = await res.json();
            if (data.status === 'success') {
                currentUser = data.user;
                showUserMenu();
                return currentUser;
            }
        }
        // Token invalid
        removeToken();
        showGuestMenu();
        return null;
    } catch (err) {
        console.error('[Auth] Error:', err);
        showGuestMenu();
        return null;
    }
}

async function logout() {
    removeToken();
    window.location.href = 'index.html';
}

// ==================== DETAIL ARTIKEL ====================
function getArticleId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function getCategoryBadgeClass(kategori) {
    const classes = {
        'minuman': 'badge-minuman',
        'makanan': 'badge-makanan',
        'metabolisme': 'badge-metabolisme',
        'tips': 'badge-tips',
        'aktivitas': 'badge-aktivitas',
        'karbohidrat': 'badge-karbohidrat'
    };
    return classes[kategori] || 'badge-default';
}

// Hitung estimasi menit baca (asumsi 200 kata per menit)
function estimasiMenitBaca(konten) {
    if (!konten) return 5;
    const plainText = konten.replace(/<[^>]*>/g, '');
    const kata = plainText.split(/\s+/).length;
    return Math.max(2, Math.ceil(kata / 200));
}

function renderMeta(article) {
    const metaContainer = document.getElementById('articleMeta');
    if (!metaContainer) return;

    // Hitung estimasi durasi baca dari konten
    const estimasi = estimasiMenitBaca(article.konten);
    // Format tanggal
    const tanggal = article.created_at ? new Date(article.created_at).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : '-';

    let metaHtml = `
        <span><i class="far fa-clock"></i> ${estimasi} menit baca</span>
        <span><i class="fas fa-calendar-alt"></i> ${tanggal}</span>
    `;

    // Tampilkan sumber jika ada
    if (article.sumber) {
        metaHtml += `<span><i class="fas fa-database"></i> Sumber: ${escapeHtml(article.sumber)}</span>`;
    }

    metaContainer.innerHTML = metaHtml;
}

function renderArticle(article) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const articleDiv = document.getElementById('articleContent');
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    if (articleDiv) articleDiv.style.display = 'block';

    const categoryElem = document.getElementById('articleCategory');
    if (categoryElem) {
        categoryElem.innerHTML = `<span class="badge ${getCategoryBadgeClass(article.kategori)}">${escapeHtml(article.kategori.toUpperCase())}</span>`;
    }
    const titleElem = document.getElementById('articleTitle');
    if (titleElem) titleElem.innerText = article.judul;
    renderMeta(article);
    
    const bodyContainer = document.getElementById('articleBody');
    if (bodyContainer) {
        if (article.gambar_url) {
            bodyContainer.innerHTML = `
                <div class="article-featured-image">
                    <img src="${article.gambar_url}" alt="${escapeHtml(article.judul)}">
                </div>
                ${article.konten}
            `;
        } else {
            bodyContainer.innerHTML = article.konten;
        }
    }
    
    document.title = `${article.judul} - GLISIA Edukasi`;
    initShareButtons(article.judul);
}

function showError() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'flex';
}

// ==================== INCREMENT VIEWS ====================
async function incrementView(id) {
    try {
        const response = await fetch(`${API_BASE}/api/edukasi/${id}/increment-view`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) {
            console.error('Failed to increment view');
        }
    } catch (err) {
        console.error('Error incrementing view:', err);
    }
}

async function loadArticleDetail() {
    const id = getArticleId();
    if (!id) {
        showError();
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/edukasi/${id}`);
        const data = await res.json();
        if (data.status === 'success' && data.data) {
            renderArticle(data.data);
            // Increment view counter setelah artikel ditampilkan
            await incrementView(id);
        } else {
            showError();
        }
    } catch (err) {
        console.error(err);
        showError();
    }
}

function initShareButtons(judul) {
    const currentUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`📚 ${judul} - GLISIA Edukasi`);
    
    const twitterBtn = document.getElementById('shareTwitter');
    const facebookBtn = document.getElementById('shareFacebook');
    const waBtn = document.getElementById('shareWhatsapp');
    
    if (twitterBtn) {
        twitterBtn.onclick = () => window.open(`https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`, '_blank', 'width=600,height=400');
    }
    if (facebookBtn) {
        facebookBtn.onclick = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`, '_blank', 'width=600,height=400');
    }
    if (waBtn) {
        waBtn.onclick = () => window.open(`https://api.whatsapp.com/send?text=${shareText}%20${currentUrl}`, '_blank');
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    await checkLoginStatus();
    
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) btnLogin.addEventListener('click', () => window.location.href = 'login.html');
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    
    loadArticleDetail();
});