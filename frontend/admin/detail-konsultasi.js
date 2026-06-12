// frontend/admin/detail-konsultasi.js
const API_BASE = "http://localhost:5002";

function getToken() {
    return localStorage.getItem('glisia_token');
}

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// ==================== FUNGSI UTAMA (sama seperti konsultasi.js) ====================
function calculateBMI(weight, height) {
    if (weight && height) return (weight / (height / 100) ** 2).toFixed(1);
    return "-";
}
function getBMICategory(bmi) {
    if (isNaN(bmi)) return "-";
    if (bmi < 18.5) return "Kurus";
    if (bmi < 23) return "Normal";
    if (bmi < 25) return "Overweight";
    return "Obesitas";
}
function getIntensitasText(intensitas) {
    if (intensitas === "ringan") return "Ringan";
    if (intensitas === "berat") return "Berat";
    return "Sedang";
}
function classifyCalories(calories, tdee) {
    if (calories < 0.8 * tdee) return "rendah";
    if (calories > 1.2 * tdee) return "tinggi";
    return "cukup";
}
function classifyFat(fat, calories, tdee) {
    if (calories <= 0) return "cukup";
    let fatPercent = (fat * 9) / calories * 100;
    if (fatPercent < 20) return "rendah";
    if (fatPercent > 35) return "tinggi";
    return "cukup";
}
function classifyCarb(carb, calories, tdee) {
    if (calories <= 0) return "cukup";
    let carbPercent = (carb * 4) / calories * 100;
    if (carbPercent < 45) return "rendah";
    if (carbPercent > 65) return "tinggi";
    return "cukup";
}
function bmiCategory(bmiVal) {
    if (bmiVal < 18.5) return "underweight";
    if (bmiVal < 23) return "normal";
    if (bmiVal < 25) return "overweight";
    return "obesitas";
}

// ==================== REKOMENDASI DINAMIS (sama seperti konsultasi.js) ====================
function buatRekomendasiDinamis(categories, riskLevel) {
    const recs = [];
    const isUnderweight = categories.bmi === "underweight";
    if (categories.lemak === "tinggi")
        recs.push("🧈 Kurangi lemak jenuh (gorengan, santan, mentega). Ganti dengan lemak sehat dari alpukat, kacang, dan minyak zaitun.");
    if (categories.kalori === "tinggi") {
        if (isUnderweight) recs.push("🍽️ Asupan kalori tinggi membantu menambah berat badan. Pastikan sumbernya dari makanan bergizi (bukan junk food).");
        else recs.push("🍽️ Kurangi kalori harian dengan mengatur porsi makan, perbanyak sayur dan protein tanpa lemak.");
    }
    if (categories.karbohidrat === "tinggi")
        recs.push("🍚 Ganti karbohidrat olahan dengan kompleks: nasi merah, oatmeal, ubi, jagung.");
    if (categories.bmi === "obesitas")
        recs.push("⚖️ Targetkan penurunan berat badan 5-10% dalam 3-6 bulan dengan defisit 300-500 kkal/hari + olahraga.");
    else if (categories.bmi === "overweight")
        recs.push("⚖️ Usahakan mencapai berat badan ideal dengan kombinasi diet seimbang dan aktivitas fisik.");
    else if (categories.bmi === "underweight") {
        recs.push("🍗 Perhatikan asupan kalori dan protein untuk mencapai berat badan ideal. Konsultasikan dengan ahli gizi.");
        recs.push("🥑 Tambahkan makanan padat nutrisi seperti alpukat, kacang-kacangan, susu, dan telur untuk menambah berat badan sehat.");
    }
    if (categories.aktivitas === "ringan")
        recs.push("🏃 Tingkatkan aktivitas fisik: minimal 150 menit/minggu aktivitas sedang (jalan cepat, bersepeda).");
    else if (categories.aktivitas === "sedang")
        recs.push("💪 Aktivitas sudah baik. Tambahkan latihan kekuatan 2x/minggu untuk meningkatkan metabolisme.");
    else if (categories.aktivitas === "berat")
        recs.push("🏋️ Aktivitas berat sudah sangat baik! Pastikan asupan nutrisi mencukupi untuk pemulihan.");
    if (categories.kalori === "rendah")
        recs.push("🍚 Asupan kalori rendah, pastikan makan cukup untuk mendukung metabolisme dan aktivitas.");
    if (categories.lemak === "rendah")
        recs.push("🥑 Asupan lemak rendah, tetap konsumsi lemak sehat untuk fungsi hormon dan penyerapan vitamin.");
    if (categories.karbohidrat === "rendah")
        recs.push("🍚 Pastikan asupan karbohidrat cukup untuk energi, terutama jika aktif.");
    if (riskLevel === "TINGGI") {
        recs.push("🩺 Segera konsultasikan kondisi Anda ke dokter atau ahli gizi untuk evaluasi lebih lanjut.");
        recs.push("🏥 Lakukan pemeriksaan kolesterol, gula darah, dan tekanan darah.");
    } else if (riskLevel === "SEDANG") {
        recs.push("📊 Pantau asupan kalori, lemak, dan karbohidrat secara rutin menggunakan aplikasi.");
    } else {
        recs.push("✅ Pertahankan pola makan seimbang dan rutin berolahraga.");
        recs.push("🩺 Lakukan pemeriksaan kesehatan berkala setiap 6-12 bulan.");
    }
    return [...new Map(recs.map(item => [item, item])).values()];
}

function generateInsightMessage(categories, riskLevel, tdee, totalKalori) {
    const bmi = categories.bmi;
    const kalori = categories.kalori;
    const lemak = categories.lemak;
    const karbo = categories.karbohidrat;
    const aktivitas = categories.aktivitas;
    const isOverweightOrObese = (bmi === "overweight" || bmi === "obesitas");
    const isUnderweight = (bmi === "underweight");
    const isActiveHeavy = (aktivitas === "berat");
    const isActiveLight = (aktivitas === "ringan");
    const isActiveModerate = (aktivitas === "sedang");
    const kaloriHigh = (kalori === "tinggi");
    const kaloriLow = (kalori === "rendah");
    const lemakHigh = (lemak === "tinggi");
    const karboHigh = (karbo === "tinggi");
    if (riskLevel === "TINGGI") {
        if (isOverweightOrObese && kaloriHigh && lemakHigh)
            return "🚨 Risiko tinggi: Kombinasi kelebihan berat badan, asupan kalori dan lemak berlebih. Segera perbaiki pola makan dan konsultasi dengan dokter.";
        if (isOverweightOrObese && isActiveLight)
            return "⚠️ Risiko tinggi: Berat badan berlebih + kurang gerak. Tingkatkan aktivitas fisik secara signifikan dan atur kalori harian.";
        if (isUnderweight && kaloriLow && isActiveHeavy)
            return "⚠️ Risiko tinggi: Berat badan kurang + defisit kalori + aktivitas berat. Risiko malnutrisi dan kelelahan. Segera tingkatkan asupan kalori dan kurangi aktivitas berlebih.";
        return "🩺 Risiko tinggi: Kondisi metabolik Anda memerlukan perhatian medis segera. Konsultasikan dengan tenaga kesehatan profesional.";
    }
    if (riskLevel === "RENDAH") {
        if (bmi === "normal" && !kaloriHigh && !lemakHigh && isActiveHeavy)
            return "✨ Metabolisme sangat baik! BMI normal, asupan seimbang, dan aktivitas berat. Pertahankan gaya hidup sehat ini.";
        if (bmi === "normal" && isActiveModerate)
            return "✅ Metabolisme sehat. BMI normal, aktivitas sedang, dan pola makan seimbang. Terus jaga kebiasaan baik ini.";
        if (bmi === "underweight" && kalori === "cukup" && isActiveLight)
            return "🌱 Risiko rendah secara metabolik, namun berat badan kurang. Fokus pada penambahan berat badan sehat (tambah 300-500 kkal/hari).";
        return "✅ Risiko rendah: Pola hidup Anda sudah baik. Pertahankan keseimbangan asupan dan aktivitas fisik.";
    }
    // RISIKO SEDANG
    if (isActiveHeavy && (kaloriLow || kalori === "cukup"))
        return "🏋️ Aktivitas berat Anda sudah sangat baik, namun pastikan asupan kalori mencukupi (terutama jika ingin menaikkan berat badan atau mempertahankan energi). Perhatikan juga komposisi gizi.";
    if (isActiveLight && isOverweightOrObese)
        return "🚶 Aktivitas ringan kurang optimal untuk menurunkan risiko. Tingkatkan durasi dan intensitas latihan (target 150-300 menit/minggu aktivitas sedang).";
    if (isActiveLight && kaloriHigh)
        return "🍔 Kelebihan kalori dan kurang gerak dapat menyebabkan kenaikan berat badan. Kurangi asupan kalori dan tingkatkan aktivitas fisik.";
    if (lemakHigh && isActiveLight)
        return "🧈 Lemak tinggi + aktivitas ringan meningkatkan risiko dislipidemia. Batasi lemak jenuh dan perbanyak olahraga.";
    if (karboHigh && isActiveLight)
        return "🍚 Karbohidrat berlebih + kurang gerak dapat meningkatkan resistensi insulin. Ganti dengan karbohidrat kompleks dan tingkatkan aktivitas.";
    if (isUnderweight && kaloriHigh && isActiveLight)
        return "🍽️ Kelebihan kalori dengan berat kurang? Gunakan surplus kalori untuk menambah berat badan secara sehat (pilih makanan padat nutrisi). Tingkatkan aktivitas secara bertahap.";
    if (isUnderweight && kalori === "cukup" && isActiveHeavy)
        return "🏃‍♀️ Berat kurang + aktivitas berat + kalori cukup: Anda perlu tambahan kalori untuk mengejar kebutuhan energi agar berat badan bisa naik. Konsultasikan dengan ahli gizi.";
    if (bmi === "overweight" && isActiveHeavy && kalori === "cukup")
        return "⚖️ Overweight dengan aktivitas berat dan asupan cukup – fokus pada penurunan berat badan bertahap (0.5-1 kg/minggu) dengan defisit kalori moderat.";
    if (bmi === "normal" && kaloriHigh && isActiveLight)
        return "📈 BMI normal tapi kelebihan kalori + kurang gerak berisiko kenaikan berat badan. Perbaiki pola makan dan tingkatkan aktivitas.";
    if (bmi === "normal" && kaloriLow && isActiveHeavy)
        return "⚠️ Defisit kalori + aktivitas berat meski BMI normal dapat menyebabkan kelelahan dan defisiensi energi. Tingkatkan asupan kalori agar seimbang.";
    return "📊 Risiko sedang. Perbaiki pola makan (kurangi lemak jenuh/gula, perbanyak sayur) dan penuhi rekomendasi aktivitas fisik (150-300 menit/minggu).";
}

async function getEdukasiRecommendations(categories, riskLevel, bmiCategory, aktivitasLevel) {
    try {
        const res = await fetch(`${API_BASE}/api/edukasi`);
        const data = await res.json();
        if (data.status !== "success" || !data.data.length) return [];
        let semuaMateri = data.data;
        const isUnderweight = bmiCategory === "Kurang" || bmiCategory === "Kurus";
        const isOverweightOrObese = bmiCategory === "Overweight" || bmiCategory === "Obesitas";
        if (isUnderweight) {
            const forbidden = ["defisit kalori","defisit","penurunan berat badan","penurunan berat","kurangi kalori","diet ketat","low calorie","menurunkan berat badan","kelebihan kalori","kelebihan berat","overweight","obesitas","tips mengurangi","kurangi asupan","defisit energi","bahaya kalori","kontrol kalori","batasi kalori","kurangi porsi","lemak jenuh","kolesterol","atlet","serat larut","indeks glikemik","beban glikemik","stres","makan emosional","emotional eating","ngemil","craving","makan berlebih","berat badan berlebih","kebiasaan makan","psikologis","manajemen stres","stres makan","binge eating","diabetes","gula darah","insulin","glukosa","hiperglikemia","hipoglikemia","diabetes tipe 2","diabetes melitus","kadar gula","pengendalian gula","termogenik","thermogenesis","cabai","capsaicin","teh hijau","katekin","kopi","kafein","jahe","kunyit","makanan pembakar lemak","bakar kalori","peningkatan metabolisme","meningkatkan metabolisme","makanan peningkat metabolisme"];
            let filtered = semuaMateri.filter(m => {
                const text = (m.judul + " " + (m.subtitle||"") + " " + (m.konten||"")).toLowerCase();
                return !forbidden.some(f => text.includes(f));
            });
            filtered.sort((a,b) => {
                const aText = (a.judul + " " + (a.subtitle||"")).toLowerCase();
                const bText = (b.judul + " " + (b.subtitle||"")).toLowerCase();
                const aBonus = aText.includes("menambah berat badan") || aText.includes("meningkatkan berat badan") || aText.includes("berat badan ideal") || aText.includes("kenaikan berat badan") ? 100 : 0;
                const bBonus = bText.includes("menambah berat badan") || bText.includes("meningkatkan berat badan") || bText.includes("berat badan ideal") || bText.includes("kenaikan berat badan") ? 100 : 0;
                return bBonus - aBonus;
            });
            return filtered.slice(0,5);
        }
        const diabetesBlacklist = ["diabetes","gula darah","insulin","glukosa","hiperglikemia","hipoglikemia","diabetes tipe 2","diabetes melitus","kadar gula"];
        const weightGainBlacklist = ["menambah berat badan","meningkatkan berat badan","kenaikan berat badan","naikkan berat badan","menaikkan berat badan","nafsu makan","cara menambah berat badan","menaikkan massa","tambah nafsu makan"];
        const prioritasKategori = [];
        if (categories.kalori === "tinggi") prioritasKategori.push("makanan","minuman");
        if (categories.karbohidrat === "tinggi") prioritasKategori.push("karbohidrat");
        if (riskLevel === "TINGGI") prioritasKategori.push("metabolisme","tips");
        if (riskLevel === "SEDANG") prioritasKategori.push("tips");
        if (bmiCategory === "Obesitas" || bmiCategory === "Overweight") prioritasKategori.push("makanan","tips");
        const uniquePrioritas = [...new Set(prioritasKategori)];
        let materiDenganSkor = [];
        for (let materi of semuaMateri) {
            let score = 0;
            const textToCheck = (materi.judul + " " + (materi.konten||"") + " " + (materi.subtitle||"")).toLowerCase();
            const kategori = (materi.kategori || "").toLowerCase();
            if (diabetesBlacklist.some(kw => textToCheck.includes(kw))) score -= 100;
            if (weightGainBlacklist.some(kw => textToCheck.includes(kw))) score -= 100;
            if (kategori === "metabolisme" && riskLevel === "TINGGI") score += 25;
            if (kategori === "tips" && riskLevel !== "RENDAH") score += 15;
            if (kategori === "makanan" && (categories.kalori === "tinggi" || categories.lemak === "tinggi")) score += 20;
            if (kategori === "karbohidrat" && categories.karbohidrat === "tinggi") score += 20;
            if (kategori === "minuman" && categories.kalori === "tinggi") score += 15;
            let keywords = [];
            if (riskLevel === "TINGGI") keywords.push("metabolisme","risiko","lemak");
            else if (riskLevel === "SEDANG") keywords.push("pola makan","karbohidrat","sehat");
            else keywords.push("pertahankan","seimbang","gaya hidup sehat");
            if (bmiCategory === "Obesitas") keywords.push("obesitas","penurunan berat badan");
            else if (bmiCategory === "Overweight") keywords.push("berat badan ideal","diet seimbang","penurunan berat badan");
            if (categories.kalori === "tinggi") keywords.push("kontrol kalori","defisit kalori");
            if (categories.lemak === "tinggi") keywords.push("lemak jenuh","lemak sehat");
            if (categories.karbohidrat === "tinggi") keywords.push("karbohidrat kompleks","gula tambahan");
            for (let kw of keywords) if (textToCheck.includes(kw)) score += 5;
            if (uniquePrioritas.includes(kategori)) score += 10;
            if (isOverweightOrObese) {
                const maintenanceKeywords = ["setelah turun","plateau","yo-yo","mempertahankan berat badan","menjaga berat badan","stabilisasi berat badan","mencegah yo-yo","setelah penurunan","fase maintenance"];
                if (maintenanceKeywords.some(kw => textToCheck.includes(kw))) score -= 100;
                const lowPriorityKeywords = ["probiotik","prebiotik","mikrobioma","bakteri usus","kesehatan usus","fermentasi","yogurt","kefir","kimchi","tempe","miso"];
                if (lowPriorityKeywords.some(kw => textToCheck.includes(kw))) score -= 100;
                const termogenikKeywords = ["termogenik","thermogenesis","cabai","capsaicin","teh hijau","katekin","kopi","kafein","jahe","kunyit","makanan pembakar lemak","bakar kalori","peningkatan metabolisme","meningkatkan metabolisme","makanan peningkat metabolisme"];
                if (termogenikKeywords.some(kw => textToCheck.includes(kw))) score -= 100;
                const highPriorityKeywords = ["defisit kalori","kurangi kalori","kontrol kalori","batasi kalori","porsi makan","manajemen porsi","metode piring","ukuran porsi","penurunan berat badan","berat badan ideal","diet sehat"];
                for (let kw of highPriorityKeywords) if (textToCheck.includes(kw)) { score += 25; break; }
            }
            materiDenganSkor.push({ materi, score, kategori });
        }
        if (!isUnderweight) {
            materiDenganSkor = materiDenganSkor.filter(item => {
                const text = (item.materi.judul + " " + (item.materi.subtitle||"") + " " + (item.materi.konten||"")).toLowerCase();
                return !weightGainBlacklist.some(kw => text.includes(kw));
            });
        }
        materiDenganSkor = materiDenganSkor.filter(item => item.score > 0);
        materiDenganSkor.sort((a,b) => b.score - a.score);
        const MAX_PER_CATEGORY = 2, targetTotal = 5;
        let selected = [], categoryCount = {};
        const ambilDariKategori = (kategori, jumlah) => {
            const dariKategori = materiDenganSkor.filter(item => item.kategori === kategori && !selected.includes(item.materi) && (!categoryCount[item.kategori] || categoryCount[item.kategori] < MAX_PER_CATEGORY));
            for (let item of dariKategori.slice(0, jumlah)) { selected.push(item.materi); categoryCount[item.kategori] = (categoryCount[item.kategori]||0) + 1; }
        };
        for (let kat of uniquePrioritas) { if (selected.length >= targetTotal) break; ambilDariKategori(kat, 1); }
        for (let kat of uniquePrioritas) { if (selected.length >= targetTotal) break; ambilDariKategori(kat, 1); }
        if (selected.length < targetTotal) {
            const sisa = materiDenganSkor.filter(item => !selected.includes(item.materi) && (!categoryCount[item.kategori] || categoryCount[item.kategori] < MAX_PER_CATEGORY));
            for (let item of sisa) { if (selected.length >= targetTotal) break; selected.push(item.materi); categoryCount[item.kategori] = (categoryCount[item.kategori]||0) + 1; }
        }
        if (selected.length > targetTotal) selected = selected.slice(0, targetTotal);
        return selected;
    } catch(err) { console.error(err); return []; }
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

function estimasiMenitBaca(konten) {
    if (!konten) return 5;
    const plainText = konten.replace(/<[^>]*>/g, "");
    const kata = plainText.split(/\s+/).length;
    return Math.max(2, Math.ceil(kata / 200));
}

function getCategoryBadge(cat) {
    if (cat === "tinggi") return `<span class="badge badge-danger" style="background:#FEF2F2; color:#B91C1C; padding:2px 8px; border-radius:30px; font-size:0.7rem; font-weight:600;">Tinggi</span>`;
    if (cat === "rendah") return `<span class="badge badge-success" style="background:#ECFDF5; color:#065F46; padding:2px 8px; border-radius:30px; font-size:0.7rem; font-weight:600;">Rendah</span>`;
    return `<span class="badge badge-warning" style="background:#FFFBEB; color:#B45309; padding:2px 8px; border-radius:30px; font-size:0.7rem; font-weight:600;">Cukup</span>`;
}

// ==================== RENDER DETAIL (Gaya admin sederhana, isi sama dengan konsultasi) ====================
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
            await renderDetailWithRecommendations(data.data);
        } else {
            document.getElementById('detailContent').innerHTML = `<div class="error-text">${data.message || 'Gagal memuat data'}</div>`;
        }
    } catch (err) {
        console.error(err);
        document.getElementById('detailContent').innerHTML = '<div class="error-text">Terjadi kesalahan saat memuat data.</div>';
    }
}

async function renderDetailWithRecommendations(d) {
    // Hitung kategori dari data yang ada
    const tdee = d.tdee;
    const totalKalori = d.total_kalori_harian;
    const totalLemak = d.total_lemak_harian;
    const totalKarbohidrat = d.total_karbohidrat_harian;
    const bmiVal = d.bmi;
    const bmiCat = getBMICategory(bmiVal);
    const intensitas = getIntensitasText(d.intensitas_aktivitas);
    const kaloriCat = classifyCalories(totalKalori, tdee);
    const lemakCat = classifyFat(totalLemak, totalKalori, tdee);
    const karboCat = classifyCarb(totalKarbohidrat, totalKalori, tdee);
    const aktivitasCat = intensitas.toLowerCase();
    const bmiKey = bmiCategory(bmiVal);
    const riskLevel = (d.risk_level || "").toUpperCase();
    const finalRiskLevel = (riskLevel === "TINGGI" || riskLevel === "SEDANG" || riskLevel === "RENDAH") ? riskLevel : "SEDANG";
    const categories = {
        bmi: bmiKey,
        kalori: kaloriCat,
        lemak: lemakCat,
        karbohidrat: karboCat,
        aktivitas: aktivitasCat
    };
    // Rekomendasi dinamis
    const dynamicRecs = buatRekomendasiDinamis(categories, finalRiskLevel);
    const backendRecs = d.recommendations || [];
    const allRecs = [...backendRecs, ...dynamicRecs];
    const uniqueRecs = [...new Map(allRecs.map(item => [item, item])).values()];
    const insightMessage = generateInsightMessage(categories, finalRiskLevel, tdee, totalKalori);
    // Edukasi recommendations
    const edukasiList = await getEdukasiRecommendations(categories, finalRiskLevel, bmiCat, intensitas);
    
    // Hitung persentase surplus
    const persen = ((totalKalori / tdee) * 100).toFixed(0);
    let statusClass = "", statusText = "";
    if (persen < 80) { statusClass = "defisit"; statusText = "Defisit Kalori"; }
    else if (persen > 120) { statusClass = "surplus"; statusText = "Surplus Kalori"; }
    else { statusClass = "seimbang"; statusText = "Seimbang"; }

    // Bangun HTML dengan gaya admin card (detail-grid)
    let html = `
        <div class="detail-container">
            <!-- Informasi Pengguna -->
            <div class="detail-card">
                <h2><i class="fas fa-user"></i> Informasi Pengguna</h2>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">Nama / Email</span><span class="detail-value">${escapeHtml(d.nama || '-')} (${escapeHtml(d.email)})</span></div>
                    <div class="detail-item"><span class="detail-label">Tanggal Analisis</span><span class="detail-value">${new Date(d.tanggal).toLocaleString('id-ID')}</span></div>
                    <div class="detail-item"><span class="detail-label">Usia</span><span class="detail-value">${d.usia} tahun</span></div>
                    <div class="detail-item"><span class="detail-label">Jenis Kelamin</span><span class="detail-value">${d.jenis_kelamin === 'pria' ? 'Pria' : 'Wanita'}</span></div>
                    <div class="detail-item"><span class="detail-label">Berat Badan / Tinggi</span><span class="detail-value">${d.weight_kg} kg / ${d.height_cm} cm</span></div>
                    <div class="detail-item"><span class="detail-label">BMI</span><span class="detail-value">${bmiVal} (${bmiCat})</span></div>
                </div>
            </div>
            <!-- Asupan & Aktivitas -->
            <div class="detail-card">
                <h2><i class="fas fa-utensils"></i> Asupan & Aktivitas</h2>
                <div class="detail-grid">
                    <div class="detail-item"><span class="detail-label">Kalori Harian</span><span class="detail-value">${totalKalori} kkal ${getCategoryBadge(kaloriCat)}</span></div>
                    <div class="detail-item"><span class="detail-label">Lemak Harian</span><span class="detail-value">${totalLemak} g ${getCategoryBadge(lemakCat)}</span></div>
                    <div class="detail-item"><span class="detail-label">Karbohidrat Harian</span><span class="detail-value">${totalKarbohidrat} g ${getCategoryBadge(karboCat)}</span></div>
                    <div class="detail-item"><span class="detail-label">TDEE (Kebutuhan Kalori)</span><span class="detail-value">${tdee} kkal</span></div>
                    <div class="detail-item"><span class="detail-label">Surplus/Defisit</span><span class="detail-value">${(totalKalori - tdee) > 0 ? '+' : ''}${(totalKalori - tdee).toFixed(0)} kkal</span></div>
                    <div class="detail-item"><span class="detail-label">Aktivitas / Minggu</span><span class="detail-value">${d.aktivitas_menit_per_minggu} menit (${intensitas})</span></div>
                </div>
            </div>
            <!-- Hasil Analisis Risiko -->
            <div class="detail-card">
                <h2><i class="fas fa-chart-line"></i> Hasil Analisis Risiko</h2>
                <div style="margin-bottom: 20px;">
                    <span class="risk-badge-large risk-${finalRiskLevel.toLowerCase()}">Tingkat Risiko: ${finalRiskLevel}</span>
                </div>
                <div class="detail-item"><span class="detail-label">Penjelasan</span><span class="detail-value">${escapeHtml(d.explanation)}</span></div>
            </div>
            <!-- TDEE & Persentase -->
            <div class="detail-card">
                <div class="tdee-info" style="background:#F0F9FF; padding:16px; border-radius:16px; border-left:4px solid #1E88E5;">
                    <p><strong>Kebutuhan Kalori (TDEE):</strong> ${tdee} kkal/hari</p>
                    <p><strong>Persentase asupan terhadap kebutuhan:</strong> ${persen}% <span class="status-badge status-${statusClass}">${statusText}</span></p>
                </div>
            </div>
            <!-- Insight Metabolisme -->
            <div class="detail-card">
                <div class="insight-card" style="background:#E3F2FD; border-radius:20px; padding:20px; border-left:4px solid #1E88E5;">
                    <h4 style="margin-bottom:8px; display:flex; align-items:center; gap:8px;"><i class="fas fa-lightbulb"></i> Insight Metabolisme</h4>
                    <p>${insightMessage}</p>
                </div>
            </div>
            <!-- Rekomendasi -->
            <div class="detail-card">
                <h2><i class="fas fa-clipboard-list"></i> Rekomendasi</h2>
                <ul class="recommendation-list">
                    ${uniqueRecs.map(rec => `<li><i class="fas fa-check-circle"></i> ${escapeHtml(rec)}</li>`).join('')}
                </ul>
            </div>
            <!-- Trace Forward Chaining -->
            <div class="detail-card">
                <h2><i class="fas fa-code-branch"></i> Trace Forward Chaining</h2>
                ${d.trace && d.trace.length ? `
                    <ul class="trace-list">
                        ${d.trace.map(step => {
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

    // Rekomendasi Edukasi (jika ada)
    if (edukasiList.length > 0) {
        html += `<div class="detail-card">
            <h2><i class="fas fa-graduation-cap"></i> Rekomendasi Materi Edukasi</h2>
            <div class="edukasi-grid" style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; margin-top:16px;">`;
        for (let item of edukasiList) {
            const estimasi = estimasiMenitBaca(item.konten);
            html += `
                <div class="edukasi-card" data-id="${item.id}" style="background:#F8FAFE; border-radius:20px; border:1px solid #E2E8F0; cursor:pointer; transition:0.2s;">
                    <div class="edukasi-card-content" style="padding:18px;">
                        <span class="edukasi-category" style="display:inline-block; background:#E3F2FD; color:#1E88E5; font-size:0.7rem; font-weight:600; padding:4px 10px; border-radius:30px; margin-bottom:12px;">${escapeHtml(item.kategori)}</span>
                        <h4 style="font-size:1rem; margin:0 0 8px;">${escapeHtml(item.judul)}</h4>
                        <p style="font-size:0.8rem; color:#475569; margin-bottom:12px;">${escapeHtml(item.subtitle || "")}</p>
                        <div class="edukasi-meta" style="display:flex; justify-content:space-between; align-items:center; font-size:0.7rem; color:#64748B;">
                            <span><i class="far fa-clock"></i> ${estimasi} menit</span>
                            <button class="btn-edukasi-detail" style="background:none; border:none; color:#1E88E5; font-weight:600; cursor:pointer;">Baca →</button>
                        </div>
                    </div>
                </div>
            `;
        }
        html += `</div></div>`;
    } else {
        html += `<div class="detail-card"><h2><i class="fas fa-graduation-cap"></i> Rekomendasi Materi Edukasi</h2><p class="empty-edukasi" style="text-align:center; padding:30px 20px; background:#F8FAFE; border-radius:16px; color:#64748B;">📚 Belum ada materi edukasi yang tersedia. Silakan cek kembali nanti atau <a href="../edukasi.html">jelajahi materi lainnya</a>.</p></div>`;
    }

    html += `<div class="result-actions" style="margin-top:24px; text-align:center;"><a href="dashboard.html" class="btn btn--outline"><i class="fas fa-arrow-left"></i> Kembali ke Dashboard</a></div></div>`;
    
    document.getElementById('detailContent').innerHTML = html;

    // Pasang event listener untuk tombol baca edukasi
    document.querySelectorAll('.btn-edukasi-detail').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = btn.closest('.edukasi-card');
            const id = card.getAttribute('data-id');
            if (id) window.open(`../edukasi-detail.html?id=${id}`, '_blank');
        });
    });
}

// ==================== SIDEBAR TOGGLE ====================
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