// ==================== KONFIGURASI ====================
const API_BASE = 'http://localhost:5002';

// ==================== AUTHENTICATION JWT ====================
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
    
    const btnGuest = document.getElementById('btnMulaiKonsultasiGuest');
    if (btnGuest) btnGuest.style.display = 'inline-flex';
    const btnUser = document.getElementById('btnMulaiKonsultasi');
    if (btnUser) btnUser.style.display = 'none';
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
    
    const btnUserConsul = document.getElementById('btnMulaiKonsultasi');
    if (btnUserConsul) btnUserConsul.style.display = 'none';
}

async function checkLoginStatus() {
    console.log('[Auth] Mengecek status login...');
    const token = getToken();
    if (!token) {
        console.log('[Auth] Token tidak ada');
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
        console.log('[Auth] Response status /me:', res.status);
        if (res.status === 200) {
            const data = await res.json();
            if (data.status === 'success') {
                currentUser = data.user;
                showUserMenu();
                console.log('[Auth] UI updated untuk user:', currentUser.email);
                return currentUser;
            }
        } else {
            console.log('[Auth] Token invalid atau expired');
            removeToken();
            showGuestMenu();
            return null;
        }
    } catch (err) {
        console.error('[Auth] Error saat cek login:', err);
        showGuestMenu();
        return null;
    }
}

async function logout() {
    console.log('[Auth] Logout...');
    removeToken();
    localStorage.removeItem('glisia_metabolic_log');
    localStorage.removeItem('glisia_konsultasi_data');
    window.location.href = 'index.html';
}

// ==================== REDIRECT TO KONSULTASI PAGE ====================
function saveDataForKonsultasi() {
    const totalKalori = getTotalKaloriToday();
    const totalLemak = getTotalLemakToday();
    const totalKarbohidrat = getTotalKarbohidratToday();
    const konsultasiData = {
        totalKalori: totalKalori,
        totalLemak: totalLemak,
        totalKarbohidrat: totalKarbohidrat,
        timestamp: Date.now()
    };
    localStorage.setItem('glisia_konsultasi_data', JSON.stringify(konsultasiData));
}

// ==================== METABOLIC TRACKER CORE ====================
let dailyLog = [];

function getTodayString() { return new Date().toISOString().split('T')[0]; }
function loadDailyLog() { const saved = localStorage.getItem('glisia_metabolic_log'); if (saved) dailyLog = JSON.parse(saved); updateAllUI(); }
function saveDailyLog() { localStorage.setItem('glisia_metabolic_log', JSON.stringify(dailyLog)); }

function addToLog(name, kalori, lemak, karbohidrat, quantity = 1) {
    const today = getTodayString();
    const existingIndex = dailyLog.findIndex(log => log.name === name && log.date === today);
    if (existingIndex !== -1) {
        dailyLog[existingIndex].quantity += quantity;
        dailyLog[existingIndex].totalKalori = dailyLog[existingIndex].quantity * kalori;
        dailyLog[existingIndex].totalLemak = dailyLog[existingIndex].quantity * lemak;
        dailyLog[existingIndex].totalKarbohidrat = dailyLog[existingIndex].quantity * karbohidrat;
    } else {
        dailyLog.push({
            id: Date.now(),
            name: name,
            kalori: kalori,
            lemak: lemak,
            karbohidrat: karbohidrat,
            quantity: quantity,
            totalKalori: kalori * quantity,
            totalLemak: lemak * quantity,
            totalKarbohidrat: karbohidrat * quantity,
            date: today,
            timestamp: Date.now()
        });
    }
    saveDailyLog();
    updateAllUI();
    showToast(`+${name} ditambahkan (${kalori} kkal)`);
}

function removeFromLog(index) { dailyLog.splice(index, 1); saveDailyLog(); updateAllUI(); showToast('Item dihapus'); }
function clearTodayLog() { const today = getTodayString(); dailyLog = dailyLog.filter(item => item.date !== today); saveDailyLog(); updateAllUI(); showToast('Semua catatan hari ini dihapus'); }

function getTotalKaloriToday() {
    const today = getTodayString();
    return dailyLog.filter(item => item.date === today).reduce((sum, item) => sum + item.totalKalori, 0);
}
function getTotalLemakToday() {
    const today = getTodayString();
    return dailyLog.filter(item => item.date === today).reduce((sum, item) => sum + item.totalLemak, 0);
}
function getTotalKarbohidratToday() {
    const today = getTodayString();
    return dailyLog.filter(item => item.date === today).reduce((sum, item) => sum + item.totalKarbohidrat, 0);
}
function getTopSource() {
    const today = getTodayString();
    const todayItems = dailyLog.filter(item => item.date === today);
    if (todayItems.length === 0) return "-";
    const maxItem = todayItems.reduce((max, item) => item.totalKalori > max.totalKalori ? item : max, todayItems[0]);
    return `${maxItem.name} (${maxItem.totalKalori} kkal)`;
}

function getWeeklyTrend() {
    const trend = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const total = dailyLog.filter(item => item.date === dateStr).reduce((sum, item) => sum + item.totalKalori, 0);
        trend.push({ date: dateStr, total: total });
    }
    return trend;
}

function renderWeeklyTrend() {
    const container = document.getElementById('trendBars');
    if (!container) return;
    const trend = getWeeklyTrend();
    container.innerHTML = '';
    trend.forEach(day => {
        const percent = (day.total / 2000) * 100;
        const barColor = day.total > 2000 ? '#E53935' : (day.total > 1500 ? '#FFB300' : '#43A047');
        const dayName = new Date(day.date).toLocaleDateString('id-ID', { weekday: 'short' });
        const div = document.createElement('div');
        div.className = 'trend-item';
        div.innerHTML = `
            <div class="trend-label">${dayName}</div>
            <div class="trend-bar-container">
                <div class="trend-bar" style="width: ${Math.min(percent, 100)}%; background: ${barColor};"></div>
            </div>
            <div class="trend-value">${day.total} kkal</div>
        `;
        container.appendChild(div);
    });
}

const tips = [
    "💡 Ganti minuman manis dengan air putih atau infused water untuk mengurangi asupan gula.",
    "🥤 Satu botol soda (330ml) mengandung sekitar 150 kkal dan 39g gula.",
    "🍵 Teh tawar tanpa gula memiliki 0 kalori dan membantu hidrasi.",
    "📊 Mencatat asupan kalori membantu Anda lebih sadar akan kebiasaan makan.",
    "🏃 Aktivitas fisik 30 menit sehari membantu membakar kelebihan kalori.",
    "🍎 Buah utuh lebih baik daripada jus buah karena mengandung serat."
];

function updateDailyTip() {
    const tipContainer = document.getElementById('dailyTip');
    if (tipContainer) {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        tipContainer.innerHTML = `<p>${randomTip}</p>`;
    }
}

function updateAllUI() {
    const totalKalori = getTotalKaloriToday();
    const targetKalori = 2000;
    const percent = Math.min((totalKalori / targetKalori) * 100, 100);
    document.getElementById('totalCalories').innerText = totalKalori;
    document.getElementById('progressPercent').innerText = Math.round(percent) + '%';
    document.getElementById('progressFill').style.width = percent + '%';

    let status = 'Aman', badgeText = 'Rendah', badgeClass = 'low';
    if (totalKalori > targetKalori) { status = 'Berlebih! Kurangi asupan'; badgeText = 'Tinggi'; badgeClass = 'high'; }
    else if (totalKalori > targetKalori * 0.8) { status = 'Mendekati batas'; badgeText = 'Sedang'; badgeClass = 'medium'; }
    document.getElementById('progressStatus').innerHTML = status;
    const badge = document.getElementById('dailyRiskBadge');
    badge.innerText = badgeText;
    badge.className = 'risk-badge ' + badgeClass;

    document.getElementById('evidenceCalories').innerText = totalKalori;
    document.getElementById('evidenceFat').innerText = getTotalLemakToday();
    document.getElementById('evidenceCarbo').innerText = getTotalKarbohidratToday();
    
    const ruleHint = document.getElementById('ruleHint');
    if (totalKalori > targetKalori) { ruleHint.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Kalori berlebih. Risiko metabolik meningkat.'; ruleHint.style.background = '#FFE0E0'; }
    else if (totalKalori > targetKalori * 0.8) { ruleHint.innerHTML = '<i class="fas fa-chart-line"></i> Kalori mendekati batas. Perhatikan porsi makan.'; ruleHint.style.background = '#FFF3E0'; }
    else { ruleHint.innerHTML = '<i class="fas fa-check-circle"></i> Asupan kalori dalam batas aman.'; ruleHint.style.background = '#E8F5E9'; }

    renderDailyLog();
    renderWeeklyTrend();
}

function renderDailyLog() {
    const container = document.getElementById('dailyLogList');
    if (!container) return;
    const today = getTodayString();
    const todayItems = dailyLog.filter(item => item.date === today);
    if (todayItems.length === 0) { container.innerHTML = '<div class="empty-log">Belum ada item. Klik tombol di atas untuk mencatat.</div>'; return; }
    container.innerHTML = '';
    todayItems.forEach((item, idx) => {
        const globalIdx = dailyLog.findIndex(d => d.id === item.id && d.date === item.date && d.timestamp === item.timestamp);
        const div = document.createElement('div'); div.className = 'log-item';
        div.innerHTML = `<div class="log-info"><strong>${item.name}</strong> x${item.quantity}<span class="log-sugar">${item.totalKalori} kkal | ${item.totalLemak}g lemak | ${item.totalKarbohidrat}g karbo</span></div>
            <div class="log-actions"><button class="btn-remove" data-idx="${globalIdx}"><i class="fas fa-trash"></i></button></div>`;
        container.appendChild(div);
    });
    document.querySelectorAll('.btn-remove').forEach(btn => { btn.addEventListener('click', (e) => { const idx = parseInt(btn.dataset.idx); removeFromLog(idx); }); });
}

function showToast(msg) {
    let toast = document.querySelector('.custom-toast');
    if (!toast) { toast = document.createElement('div'); toast.className = 'custom-toast'; document.body.appendChild(toast); }
    toast.innerText = msg; toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 2000);
}

document.getElementById('clearLogBtn')?.addEventListener('click', () => { if (confirm('Hapus semua catatan hari ini?')) clearTodayLog(); });

// ==================== MAKANAN SEHARI-HARI UNTUK TAMBAH CEPAT ====================
const dailyFoods = [
    { name: "Nasi Putih (1 porsi)", kalori: 180, lemak: 0.4, karbohidrat: 40, icon: "fa-utensils" },
    { name: "Mie Goreng (1 porsi)", kalori: 320, lemak: 14, karbohidrat: 40, icon: "fa-utensils" },
    { name: "Telur Dadar (1 butir)", kalori: 120, lemak: 9, karbohidrat: 1, icon: "fa-egg" },
    { name: "Ayam Goreng (1 potong)", kalori: 250, lemak: 15, karbohidrat: 0, icon: "fa-drumstick-bite" },
    { name: "Teh Manis (1 gelas)", kalori: 80, lemak: 0, karbohidrat: 20, icon: "fa-mug-hot" },
    { name: "Kopi Susu (1 gelas)", kalori: 120, lemak: 4, karbohidrat: 18, icon: "fa-coffee" },
    { name: "Roti Tawar (2 lembar)", kalori: 160, lemak: 2, karbohidrat: 30, icon: "fa-bread-slice" },
    { name: "Pisang (1 buah)", kalori: 105, lemak: 0.4, karbohidrat: 27, icon: "fa-apple-alt" },
    { name: "Air Putih", kalori: 0, lemak: 0, karbohidrat: 0, icon: "fa-tint" }
];

function renderDailyFoods() {
    const container = document.getElementById('quickAddButtons');
    if (!container) return;
    container.innerHTML = '';
    dailyFoods.forEach(food => {
        const btn = document.createElement('button');
        btn.className = 'quick-add-btn';
        btn.dataset.kalori = food.kalori;
        btn.dataset.lemak = food.lemak;
        btn.dataset.karbo = food.karbohidrat;
        btn.dataset.name = food.name;
        btn.innerHTML = `<i class="fas ${food.icon}"></i> ${food.name.length > 18 ? food.name.substring(0,15)+'...' : food.name}`;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addToLog(food.name, food.kalori, food.lemak, food.karbohidrat);
        });
        container.appendChild(btn);
    });
}

async function loadPopularFoods() {
    renderDailyFoods();
}

// ==================== AMBIL DATA DARI KONSULTASI ====================
function loadDataFromKonsultasi() {
    const savedData = localStorage.getItem('glisia_konsultasi_data');
    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.totalKalori !== undefined && data.totalKalori > 0) {
            const today = getTodayString();
            const existingLog = dailyLog.find(log => log.date === today && log.name === "Konsultasi");
            if (existingLog) {
                existingLog.totalKalori = data.totalKalori;
                existingLog.totalLemak = data.totalLemak;
                existingLog.totalKarbohidrat = data.totalKarbohidrat;
                existingLog.quantity = 1;
            } else {
                dailyLog.push({
                    id: 999,
                    name: "Konsultasi",
                    kalori: data.totalKalori,
                    lemak: data.totalLemak,
                    karbohidrat: data.totalKarbohidrat,
                    quantity: 1,
                    totalKalori: data.totalKalori,
                    totalLemak: data.totalLemak,
                    totalKarbohidrat: data.totalKarbohidrat,
                    date: today,
                    timestamp: Date.now()
                });
            }
            saveDailyLog();
            updateAllUI();
            showToast(`Data dari konsultasi dimuat: ${data.totalKalori} kkal`);
            localStorage.removeItem('glisia_konsultasi_data');
        }
    }
}

// ==================== EVENT SCROLL EDUKASI ====================
document.getElementById('heroEdukasi')?.addEventListener('click', () => {
    document.getElementById('edukasi').scrollIntoView({ behavior: 'smooth' });
});
document.getElementById('ctaPelajari')?.addEventListener('click', () => {
    document.getElementById('edukasi').scrollIntoView({ behavior: 'smooth' });
});

// ==================== VISUALISASI SUGAR BAR ====================
document.querySelectorAll('.sugar-bar').forEach(bar => {
    const grams = parseFloat(bar.dataset.grams);
    const percent = Math.min((grams / 50) * 100, 100);
    bar.style.background = `linear-gradient(90deg, #FFB300 ${percent}%, #FFE0B2 ${percent}%)`;
    const sdt = Math.round(grams / 4);
    bar.innerHTML = `${grams} gram (≈${sdt} sendok teh)`;
});

// ==================== INITIAL LOAD ====================
document.addEventListener('DOMContentLoaded', () => {
    loadDailyLog();
    updateDailyTip();
    loadDataFromKonsultasi();
    loadPopularFoods();
    checkLoginStatus();
    
    // Auth buttons
    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) btnLogin.addEventListener('click', () => window.location.href = 'login.html');
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    
    // Mulai Konsultasi buttons
    const btnMulaiKonsultasiUser = document.getElementById('btnMulaiKonsultasi');
    if (btnMulaiKonsultasiUser) {
        btnMulaiKonsultasiUser.addEventListener('click', (e) => {
            e.preventDefault();
            saveDataForKonsultasi();
            window.location.href = 'konsultasi.html';
        });
    }
    const btnMulaiKonsultasiGuest = document.getElementById('btnMulaiKonsultasiGuest');
    if (btnMulaiKonsultasiGuest) {
        btnMulaiKonsultasiGuest.addEventListener('click', (e) => {
            e.preventDefault();
            saveDataForKonsultasi();
            window.location.href = 'konsultasi.html';
        });
    }
    
    // Hero & CTA buttons
    const heroKonsultasi = document.getElementById('heroKonsultasi');
    if (heroKonsultasi) {
        heroKonsultasi.addEventListener('click', (e) => {
            e.preventDefault();
            saveDataForKonsultasi();
            window.location.href = 'konsultasi.html';
        });
    }
    const ctaKonsultasi = document.getElementById('ctaKonsultasi');
    if (ctaKonsultasi) {
        ctaKonsultasi.addEventListener('click', (e) => {
            e.preventDefault();
            saveDataForKonsultasi();
            window.location.href = 'konsultasi.html';
        });
    }
});

window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        console.log('[Auth] Page loaded from cache, re-checking login status');
        checkLoginStatus();
    }
});