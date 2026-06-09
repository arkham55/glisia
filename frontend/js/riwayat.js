// js/riwayat.js
const API_BASE = "http://localhost:5002";

// ==================== AUTH ====================
function getToken() {
    return localStorage.getItem('glisia_token');
}

async function fetchAPI(url, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    if (res.status === 401) {
        localStorage.removeItem('glisia_token');
        window.location.href = 'login.html';
        return null;
    }
    return res.json();
}

// ==================== DOM ====================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentPage = 1;
let totalPages = 1;
let currentSearch = '';
let currentSort = 'terbaru';
let currentRiskFilter = 'semua';
let currentRecord = null;
let deleteId = null;

function fmtRisk(level) {
    const l = (level || '').toLowerCase();
    const map = {
        tinggi: { cls: 'tinggi', icon: 'fa-triangle-exclamation', label: 'Tinggi' },
        sedang: { cls: 'sedang', icon: 'fa-circle-exclamation', label: 'Sedang' },
        rendah: { cls: 'rendah', icon: 'fa-circle-check', label: 'Rendah' }
    };
    const m = map[l] || { cls: 'sedang', icon: 'fa-circle-question', label: level || '-' };
    return `<span class="rw-risk-badge rw-risk-badge--${m.cls}"><i class="fas ${m.icon}"></i>${m.label}</span>`;
}

function fmtTrend(tren) {
    const map = {
        membaik: { cls: 'membaik', icon: 'fa-arrow-trend-down', label: 'Membaik' },
        memburuk: { cls: 'memburuk', icon: 'fa-arrow-trend-up', label: 'Memburuk' },
        stabil: { cls: 'stabil', icon: 'fa-minus', label: 'Stabil' },
        baru: { cls: 'baru', icon: 'fa-star', label: 'Baru' }
    };
    const m = map[tren] || map.stabil;
    return `<span class="rw-trend rw-trend--${m.cls}"><i class="fas ${m.icon}"></i>${m.label}</span>`;
}

function bmiColor(bmi) {
    if (bmi < 18.5) return '#4e9bff';
    if (bmi < 23) return '#34d399';
    if (bmi < 25) return '#f59e0b';
    return '#f87171';
}

function classifyFat(fatGrams, totalCalories) {
    if (totalCalories <= 0) return 'cukup';
    const fatPercent = (fatGrams * 9) / totalCalories * 100;
    if (fatPercent < 20) return 'rendah';
    if (fatPercent > 35) return 'tinggi';
    return 'cukup';
}

function classifyCarb(carbGrams, totalCalories) {
    if (totalCalories <= 0) return 'cukup';
    const carbPercent = (carbGrams * 4) / totalCalories * 100;
    if (carbPercent < 45) return 'rendah';
    if (carbPercent > 65) return 'tinggi';
    return 'cukup';
}

function getCategoryBadge(cat) {
    let label = "", bgColor = "", textColor = "", borderColor = "", icon = "";
    if (cat === "tinggi") {
        label = "Tinggi";
        bgColor = "#FEF2F2";
        textColor = "#B91C1C";
        borderColor = "#FEE2E2";
        icon = '<i class="fas fa-arrow-up" style="font-size: 0.7rem; margin-right: 4px;"></i>';
    } else if (cat === "rendah") {
        label = "Rendah";
        bgColor = "#ECFDF5";
        textColor = "#065F46";
        borderColor = "#D1FAE5";
        icon = '<i class="fas fa-arrow-down" style="font-size: 0.7rem; margin-right: 4px;"></i>';
    } else {
        label = "Cukup";
        bgColor = "#FFFBEB";
        textColor = "#B45309";
        borderColor = "#FEF3C7";
        icon = '<i class="fas fa-check-circle" style="font-size: 0.7rem; margin-right: 4px;"></i>';
    }
    return `<span class="nutri-badge" style="display: inline-flex; align-items: center; gap: 4px; background: ${bgColor}; color: ${textColor}; padding: 4px 10px; border-radius: 30px; font-size: 0.7rem; font-weight: 600; border: 1px solid ${borderColor}; line-height: 1.2; margin-left: 8px;">${icon}${label}</span>`;
}

function getInterpretationMessage(cat, type, value, tdee) {
    if (cat === "tinggi") {
        if (type === "kalori") return `Asupan kalori (${value} kkal) melebihi kebutuhan (${tdee} kkal). Kelebihan kalori dapat menambah berat badan.`;
        if (type === "lemak") return `Asupan lemak (${value} g) terlalu tinggi. Kurangi lemak jenuh, pilih lemak sehat.`;
        if (type === "karbohidrat") return `Karbohidrat (${value} g) berlebih. Pilih karbohidrat kompleks.`;
    } else if (cat === "rendah") {
        if (type === "kalori") return `Asupan kalori (${value} kkal) kurang dari kebutuhan (${tdee} kkal). Perbanyak porsi makan.`;
        if (type === "lemak") return `Asupan lemak (${value} g) rendah. Konsumsi lemak sehat seperti alpukat, kacang.`;
        if (type === "karbohidrat") return `Karbohidrat (${value} g) rendah. Tambahkan karbohidrat kompleks untuk energi.`;
    } else {
        if (type === "kalori") return `Asupan kalori (${value} kkal) seimbang dengan kebutuhan. Pertahankan.`;
        if (type === "lemak") return `Asupan lemak (${value} g) cukup. Pastikan sumber lemak sehat.`;
        if (type === "karbohidrat") return `Asupan karbohidrat (${value} g) cukup. Prioritaskan karbohidrat kompleks.`;
    }
    return "";
}

function estimasiMenitBaca(konten) {
    if (!konten) return 5;
    const plainText = konten.replace(/<[^>]*>/g, '');
    const kata = plainText.split(/\s+/).length;
    return Math.max(2, Math.ceil(kata / 200));
}

// ==================== INSIGHT METABOLISM ====================
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
        if (isOverweightOrObese && kaloriHigh && lemakHigh) {
            return "🚨 Risiko tinggi: Kombinasi kelebihan berat badan, asupan kalori dan lemak berlebih. Segera perbaiki pola makan dan konsultasi dengan dokter.";
        }
        if (isOverweightOrObese && isActiveLight) {
            return "⚠️ Risiko tinggi: Berat badan berlebih + kurang gerak. Tingkatkan aktivitas fisik secara signifikan dan atur kalori harian.";
        }
        if (isUnderweight && kaloriLow && isActiveHeavy) {
            return "⚠️ Risiko tinggi: Berat badan kurang + defisit kalori + aktivitas berat. Risiko malnutrisi dan kelelahan. Segera tingkatkan asupan kalori dan kurangi aktivitas berlebih.";
        }
        return "🩺 Risiko tinggi: Kondisi metabolik Anda memerlukan perhatian medis segera. Konsultasikan dengan tenaga kesehatan profesional.";
    }
    
    if (riskLevel === "RENDAH") {
        if (bmi === "normal" && !kaloriHigh && !lemakHigh && isActiveHeavy) {
            return "✨ Metabolisme sangat baik! BMI normal, asupan seimbang, dan aktivitas berat. Pertahankan gaya hidup sehat ini.";
        }
        if (bmi === "normal" && isActiveModerate) {
            return "✅ Metabolisme sehat. BMI normal, aktivitas sedang, dan pola makan seimbang. Terus jaga kebiasaan baik ini.";
        }
        if (bmi === "underweight" && kalori === "cukup" && isActiveLight) {
            return "🌱 Risiko rendah secara metabolik, namun berat badan kurang. Fokus pada penambahan berat badan sehat (tambah 300-500 kkal/hari).";
        }
        return "✅ Risiko rendah: Pola hidup Anda sudah baik. Pertahankan keseimbangan asupan dan aktivitas fisik.";
    }
    
    // RISIKO SEDANG
    if (isActiveHeavy && (kaloriLow || kalori === "cukup")) {
        return "🏋️ Aktivitas berat Anda sudah sangat baik, namun pastikan asupan kalori mencukupi (terutama jika ingin menaikkan berat badan atau mempertahankan energi). Perhatikan juga komposisi gizi.";
    }
    if (isActiveLight && isOverweightOrObese) {
        return "🚶 Aktivitas ringan kurang optimal untuk menurunkan risiko. Tingkatkan durasi dan intensitas latihan (target 150-300 menit/minggu aktivitas sedang).";
    }
    if (isActiveLight && kaloriHigh) {
        return "🍔 Kelebihan kalori dan kurang gerak dapat menyebabkan kenaikan berat badan. Kurangi asupan kalori dan tingkatkan aktivitas fisik.";
    }
    if (lemakHigh && isActiveLight) {
        return "🧈 Lemak tinggi + aktivitas ringan meningkatkan risiko dislipidemia. Batasi lemak jenuh dan perbanyak olahraga.";
    }
    if (karboHigh && isActiveLight) {
        return "🍚 Karbohidrat berlebih + kurang gerak dapat meningkatkan resistensi insulin. Ganti dengan karbohidrat kompleks dan tingkatkan aktivitas.";
    }
    if (isUnderweight && kaloriHigh && isActiveLight) {
        return "🍽️ Kelebihan kalori dengan berat kurang? Gunakan surplus kalori untuk menambah berat badan secara sehat (pilih makanan padat nutrisi). Tingkatkan aktivitas secara bertahap.";
    }
    if (isUnderweight && kalori === "cukup" && isActiveHeavy) {
        return "🏃‍♀️ Berat kurang + aktivitas berat + kalori cukup: Anda perlu tambahan kalori untuk mengejar kebutuhan energi agar berat badan bisa naik. Konsultasikan dengan ahli gizi.";
    }
    if (bmi === "overweight" && isActiveHeavy && kalori === "cukup") {
        return "⚖️ Overweight dengan aktivitas berat dan asupan cukup – fokus pada penurunan berat badan bertahap (0.5-1 kg/minggu) dengan defisit kalori moderat.";
    }
    if (bmi === "normal" && kaloriHigh && isActiveLight) {
        return "📈 BMI normal tapi kelebihan kalori + kurang gerak berisiko kenaikan berat badan. Perbaiki pola makan dan tingkatkan aktivitas.";
    }
    if (bmi === "normal" && kaloriLow && isActiveHeavy) {
        return "⚠️ Defisit kalori + aktivitas berat meski BMI normal dapat menyebabkan kelelahan dan defisiensi energi. Tingkatkan asupan kalori agar seimbang.";
    }
    return "📊 Risiko sedang. Perbaiki pola makan (kurangi lemak jenuh/gula, perbanyak sayur) dan penuhi rekomendasi aktivitas fisik (150-300 menit/minggu).";
}

// ==================== REKOMENDASI DINAMIS (BERDASARKAN RISK LEVEL) ====================
function buatRekomendasiDinamis(categories, riskLevel) {
    const recs = [];
    const isUnderweight = categories.bmi === "underweight";

    if (categories.lemak === "tinggi")
        recs.push("🧈 Kurangi lemak jenuh (gorengan, santan, mentega). Ganti dengan lemak sehat dari alpukat, kacang, dan minyak zaitun.");

    if (categories.kalori === "tinggi") {
        if (isUnderweight) {
            recs.push("🍽️ Asupan kalori tinggi membantu menambah berat badan. Pastikan sumbernya dari makanan bergizi (bukan junk food).");
        } else {
            recs.push("🍽️ Kurangi kalori harian dengan mengatur porsi makan, perbanyak sayur dan protein tanpa lemak.");
        }
    }

    if (categories.karbohidrat === "tinggi")
        recs.push("🍚 Ganti karbohidrat olahan dengan kompleks: nasi merah, oatmeal, ubi, jagung.");

    if (categories.bmi === "obesitas") {
        recs.push("⚖️ Targetkan penurunan berat badan 5-10% dalam 3-6 bulan dengan defisit 300-500 kkal/hari + olahraga.");
    } else if (categories.bmi === "overweight") {
        recs.push("⚖️ Usahakan mencapai berat badan ideal dengan kombinasi diet seimbang dan aktivitas fisik.");
    } else if (categories.bmi === "underweight") {
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

    return [...new Map(recs.map((item) => [item, item])).values()];
}

// ==================== REKOMENDASI EDUKASI ====================
async function getEdukasiRecommendations(categories, riskLevel, bmiCategory, aktivitasLevel) {
    try {
        const res = await fetch(`${API_BASE}/api/edukasi`);
        const data = await res.json();
        if (data.status !== 'success' || !data.data.length) return [];

        let semuaMateri = data.data;
        const isUnderweight = (bmiCategory === 'Kurang' || bmiCategory === 'Kurus');
        const isOverweightOrObese = (bmiCategory === 'Overweight' || bmiCategory === 'Obesitas');

        // ========== UNDERWEIGHT ==========
        if (isUnderweight) {
            const forbiddenForUnderweight = [
                'defisit kalori', 'defisit', 'penurunan berat badan', 'penurunan berat',
                'kurangi kalori', 'diet ketat', 'low calorie', 'menurunkan berat badan',
                'kelebihan kalori', 'kelebihan berat', 'overweight', 'obesitas',
                'tips mengurangi', 'kurangi asupan', 'defisit energi', 'bahaya kalori',
                'kontrol kalori', 'batasi kalori', 'kurangi porsi', 'lemak jenuh', 'kolesterol',
                'atlet', 'serat larut', 'indeks glikemik', 'beban glikemik',
                'stres', 'makan emosional', 'emotional eating', 'ngemil', 'craving',
                'makan berlebih', 'berat badan berlebih', 'kebiasaan makan', 'psikologis',
                'manajemen stres', 'stres makan', 'binge eating',
                'diabetes', 'gula darah', 'insulin', 'glukosa', 'hiperglikemia', 'hipoglikemia',
                'diabetes tipe 2', 'diabetes melitus', 'kadar gula', 'pengendalian gula',
                'termogenik', 'thermogenesis', 'cabai', 'capsaicin', 'teh hijau', 'katekin',
                'kopi', 'kafein', 'jahe', 'kunyit', 'makanan pembakar lemak', 'bakar kalori',
                'peningkatan metabolisme', 'meningkatkan metabolisme', 'makanan peningkat metabolisme'
            ];
            let filteredMateri = semuaMateri.filter(materi => {
                const text = (materi.judul + ' ' + (materi.subtitle || '') + ' ' + (materi.konten || '')).toLowerCase();
                return !forbiddenForUnderweight.some(f => text.includes(f));
            });
            filteredMateri.sort((a, b) => {
                const aText = (a.judul + ' ' + (a.subtitle || '')).toLowerCase();
                const bText = (b.judul + ' ' + (b.subtitle || '')).toLowerCase();
                const aBonus = (aText.includes('menambah berat badan') || aText.includes('meningkatkan berat badan') || aText.includes('berat badan ideal') || aText.includes('kenaikan berat badan')) ? 100 : 0;
                const bBonus = (bText.includes('menambah berat badan') || bText.includes('meningkatkan berat badan') || bText.includes('berat badan ideal') || bText.includes('kenaikan berat badan')) ? 100 : 0;
                return bBonus - aBonus;
            });
            return filteredMateri.slice(0, 5);
        }

        // ========== NON-UNDERWEIGHT ==========
        const diabetesBlacklist = [
            'diabetes', 'gula darah', 'insulin', 'glukosa', 'hiperglikemia',
            'hipoglikemia', 'diabetes tipe 2', 'diabetes melitus', 'kadar gula'
        ];
        const weightGainBlacklist = [
            'menambah berat badan', 'meningkatkan berat badan', 'kenaikan berat badan',
            'naikkan berat badan', 'menaikkan berat badan', 'nafsu makan',
            'cara menambah berat badan', 'menaikkan massa', 'tambah nafsu makan'
        ];

        const prioritasKategori = [];
        if (categories.kalori === 'tinggi') prioritasKategori.push('makanan', 'minuman');
        if (categories.karbohidrat === 'tinggi') prioritasKategori.push('karbohidrat');
        if (riskLevel === 'TINGGI') prioritasKategori.push('metabolisme', 'tips');
        if (riskLevel === 'SEDANG') prioritasKategori.push('tips');
        if (bmiCategory === 'Obesitas' || bmiCategory === 'Overweight') prioritasKategori.push('makanan', 'tips');
        const uniquePrioritas = [...new Set(prioritasKategori)];

        let materiDenganSkor = [];
        for (let materi of semuaMateri) {
            let score = 0;
            const textToCheck = (materi.judul + ' ' + (materi.konten || '') + ' ' + (materi.subtitle || '')).toLowerCase();
            const kategori = (materi.kategori || '').toLowerCase();

            if (diabetesBlacklist.some(kw => textToCheck.includes(kw.toLowerCase()))) score -= 100;
            if (weightGainBlacklist.some(kw => textToCheck.includes(kw.toLowerCase()))) score -= 100;

            if (kategori === 'metabolisme' && riskLevel === 'TINGGI') score += 25;
            if (kategori === 'tips' && riskLevel !== 'RENDAH') score += 15;
            if (kategori === 'makanan' && (categories.kalori === 'tinggi' || categories.lemak === 'tinggi')) score += 20;
            if (kategori === 'karbohidrat' && categories.karbohidrat === 'tinggi') score += 20;
            if (kategori === 'minuman' && categories.kalori === 'tinggi') score += 15;

            let keywords = [];
            if (riskLevel === 'TINGGI') keywords.push('metabolisme', 'risiko', 'lemak');
            else if (riskLevel === 'SEDANG') keywords.push('pola makan', 'karbohidrat', 'sehat');
            else keywords.push('pertahankan', 'seimbang', 'gaya hidup sehat');

            if (bmiCategory === 'Obesitas') keywords.push('obesitas', 'penurunan berat badan');
            else if (bmiCategory === 'Overweight') keywords.push('berat badan ideal', 'diet seimbang', 'penurunan berat badan');

            if (categories.kalori === 'tinggi') keywords.push('kontrol kalori', 'defisit kalori');
            if (categories.lemak === 'tinggi') keywords.push('lemak jenuh', 'lemak sehat');
            if (categories.karbohidrat === 'tinggi') keywords.push('karbohidrat kompleks', 'gula tambahan');

            for (let kw of keywords) {
                if (textToCheck.includes(kw.toLowerCase())) score += 5;
            }
            if (uniquePrioritas.includes(kategori)) score += 10;

            if (isOverweightOrObese) {
                const maintenanceKeywords = [ 'setelah turun', 'plateau', 'yo-yo', 'mempertahankan berat badan', 'menjaga berat badan', 'stabilisasi berat badan', 'mencegah yo-yo', 'setelah penurunan', 'fase maintenance' ];
                if (maintenanceKeywords.some(kw => textToCheck.includes(kw.toLowerCase()))) score -= 100;

                const lowPriorityKeywords = [ 'probiotik', 'prebiotik', 'mikrobioma', 'bakteri usus', 'kesehatan usus', 'fermentasi', 'yogurt', 'kefir', 'kimchi', 'tempe', 'miso' ];
                if (lowPriorityKeywords.some(kw => textToCheck.includes(kw.toLowerCase()))) score -= 100;

                const termogenikKeywords = [ 'termogenik', 'thermogenesis', 'cabai', 'capsaicin', 'teh hijau', 'katekin', 'kopi', 'kafein', 'jahe', 'kunyit', 'makanan pembakar lemak', 'bakar kalori', 'peningkatan metabolisme', 'meningkatkan metabolisme', 'makanan peningkat metabolisme' ];
                if (termogenikKeywords.some(kw => textToCheck.includes(kw.toLowerCase()))) score -= 100;

                const highPriorityKeywords = [ 'defisit kalori', 'kurangi kalori', 'kontrol kalori', 'batasi kalori', 'porsi makan', 'manajemen porsi', 'metode piring', 'ukuran porsi', 'penurunan berat badan', 'berat badan ideal', 'diet sehat' ];
                for (let kw of highPriorityKeywords) {
                    if (textToCheck.includes(kw.toLowerCase())) { score += 25; break; }
                }
            }
            materiDenganSkor.push({ materi, score, kategori });
        }

        if (!isUnderweight) {
            materiDenganSkor = materiDenganSkor.filter(item => {
                const text = (item.materi.judul + ' ' + (item.materi.subtitle || '') + ' ' + (item.materi.konten || '')).toLowerCase();
                return !weightGainBlacklist.some(kw => text.includes(kw.toLowerCase()));
            });
        }
        materiDenganSkor = materiDenganSkor.filter(item => item.score > 0);
        materiDenganSkor.sort((a, b) => b.score - a.score);

        const MAX_PER_CATEGORY = 2, targetTotal = 5;
        let selected = [], categoryCount = {};

        function ambilDariKategori(kategori, jumlah) {
            const dariKategori = materiDenganSkor.filter(item => item.kategori === kategori && !selected.includes(item.materi) && (!categoryCount[item.kategori] || categoryCount[item.kategori] < MAX_PER_CATEGORY));
            for (let item of dariKategori.slice(0, jumlah)) {
                selected.push(item.materi);
                categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + 1;
            }
        }

        for (let kat of uniquePrioritas) {
            if (selected.length >= targetTotal) break;
            ambilDariKategori(kat, 1);
        }
        for (let kat of uniquePrioritas) {
            if (selected.length >= targetTotal) break;
            ambilDariKategori(kat, 1);
        }
        if (selected.length < targetTotal) {
            const sisa = materiDenganSkor.filter(item => !selected.includes(item.materi) && (!categoryCount[item.kategori] || categoryCount[item.kategori] < MAX_PER_CATEGORY));
            for (let item of sisa) {
                if (selected.length >= targetTotal) break;
                selected.push(item.materi);
                categoryCount[item.kategori] = (categoryCount[item.kategori] || 0) + 1;
            }
        }
        if (selected.length > targetTotal) selected = selected.slice(0, targetTotal);
        return selected;
    } catch (err) {
        console.error("Error in getEdukasiRecommendations:", err);
        return [];
    }
}

// ==================== LOAD DATA ====================
async function loadSummary() {
    const data = await fetchAPI('/api/riwayat/summary');
    if (data && data.status === 'success') {
        const d = data.data;
        animateNumber('#statTotal', 0, d.total_analisis, 600);
        animateNumber('#statBmi', 0, d.avg_bmi, 700, 1);
        animateNumber('#statKalori', 0, d.avg_kalori, 800);
        $('#statBmiCat').innerText = d.bmi_category || '—';
        $('#statRisk').innerHTML = fmtRisk(d.last_risk);
        $('#statRiskDate').innerText = d.last_date || '—';
    }
}

async function loadList() {
    showLoading();
    const params = new URLSearchParams({ page: currentPage, limit: 10, search: currentSearch, sort_by: currentSort, risk_filter: currentRiskFilter });
    const data = await fetchAPI(`/api/riwayat/list?${params}`);
    if (data && data.status === 'success') {
        totalPages = data.data.total_pages;
        renderTable(data.data.items);
        renderPagination(data.data);
        $('#recordCount').innerText = `${data.data.total} data`;
    } else {
        showError('Gagal memuat data.');
    }
}

function renderTable(items) {
    const tbody = $('#riwayatBody');
    if (!items || items.length === 0) {
        $('#emptyState').style.display = 'block';
        $('#riwayatTable').style.display = 'none';
        $('#pagination').style.display = 'none';
        tbody.innerHTML = '';
        return;
    }
    $('#emptyState').style.display = 'none';
    $('#riwayatTable').style.display = '';
    $('#pagination').style.display = '';

    let html = '';
    items.forEach(item => {
        const date = new Date(item.tanggal);
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const surplus = item.surplus_kalori || 0;
        const surplusTag = surplus > 0 ? `<span class="rw-surplus-tag rw-surplus-tag--over">+${surplus} kkal</span>` : `<span class="rw-surplus-tag rw-surplus-tag--ok">${surplus} kkal</span>`;
        const pills = (item.faktor_utama || '').split(' · ').filter(Boolean).map(p => `<span class="rw-fpill">${p}</span>`).join('');
        html += `
        <tr>
            <td class="rw-td-date"><div class="rw-date-main">${dateStr}</div><div class="rw-date-time">${timeStr}</div></td>
            <td class="rw-td-bmi"><div class="rw-bmi-num" style="color:${bmiColor(item.bmi)}">${item.bmi}</div><div class="rw-bmi-cat">${item.bmi_category}</div></td>
            <td class="rw-td-kalori"><div class="rw-kalori-num">${item.kalori.toLocaleString('id')}</div><div class="rw-kalori-tdee">TDEE: ${item.tdee.toLocaleString('id')} kkal</div>${surplusTag}</td>
            <td class="rw-td-faktor"><div class="rw-faktor-pills">${pills}</div></td>
            <td>${fmtRisk(item.risk_level)}</td>
            <td>${fmtTrend(item.tren)}</td>
            <td class="rw-td-aksi"><button class="rw-btn-detail" data-id="${item.id}"><i class="fas fa-eye"></i> Detail</button></td>
        </tr>`;
    });
    tbody.innerHTML = html;
    document.querySelectorAll('.rw-btn-detail').forEach(btn => btn.addEventListener('click', () => openDetailModal(parseInt(btn.dataset.id))));
}

function renderPagination(data) {
    const prev = $('#prevPage'), next = $('#nextPage'), nums = $('#pageNumbers');
    if (prev) prev.disabled = data.page <= 1;
    if (next) next.disabled = data.page >= data.total_pages;
    if (nums) nums.innerHTML = '';
    let start = Math.max(1, data.page - 2), end = Math.min(data.total_pages, start + 4);
    if (end - start < 4) start = Math.max(1, end - 4);
    for (let p = start; p <= end; p++) {
        const btn = document.createElement('button');
        btn.className = `rw-page-num ${p === data.page ? 'active' : ''}`;
        btn.innerText = p;
        btn.addEventListener('click', () => { currentPage = p; loadList(); });
        nums.appendChild(btn);
    }
}

// ==================== DETAIL MODAL (TANPA SKOR) ====================
async function openDetailModal(id) {
    const data = await fetchAPI(`/api/riwayat/${id}`);
    if (!data || data.status !== 'success') return;
    const item = data.data;
    currentRecord = item;
    deleteId = item.id;

    const date = new Date(item.tanggal);
    $('#modalDate').innerText = date.toLocaleDateString('id-ID');
    $('#modalRiskBadge').innerHTML = fmtRisk(item.risk_level);
    $('#dWeight').innerText = `${item.weight_kg} kg`;
    $('#dHeight').innerText = `${item.height_cm} cm`;
    $('#dUsia').innerText = `${item.usia} tahun`;
    const gender = (item.jenis_kelamin === 'pria' || item.jenis_kelamin === 'laki-laki') ? 'Laki-laki' : 'Perempuan';
    $('#dGender').innerText = gender;
    $('#dBmiVal').innerText = item.bmi;
    $('#dAktivitas').innerText = `${item.aktivitas_menit_per_minggu || 0} menit/minggu (${item.intensitas_aktivitas || '-'})`;
    $('#dExplanation').innerText = item.explanation || 'Tidak ada penjelasan.';

    // Marker BMI
    let bmi = parseFloat(item.bmi);
    if (isNaN(bmi)) bmi = 0;
    const thresholds = [14, 18.5, 23, 25, 40], visualPct = [0, 20, 45, 65, 100];
    let bmiPct = 0;
    if (bmi <= thresholds[0]) bmiPct = visualPct[0];
    else if (bmi >= thresholds[thresholds.length-1]) bmiPct = visualPct[visualPct.length-1];
    else {
        for (let i=0; i<thresholds.length-1; i++) {
            if (bmi >= thresholds[i] && bmi <= thresholds[i+1]) {
                const t = (bmi - thresholds[i]) / (thresholds[i+1] - thresholds[i]);
                bmiPct = visualPct[i] + t * (visualPct[i+1] - visualPct[i]);
                break;
            }
        }
    }
    setTimeout(() => {
        const marker = document.getElementById('dBmiMarker'), bar = document.querySelector('.rw-bmi-bar');
        if (marker && bar) {
            bar.style.position = 'relative';
            const barWidth = bar.offsetWidth;
            let leftPx = (bmiPct/100) * barWidth;
            leftPx = Math.min(Math.max(leftPx, 8), barWidth - 8);
            marker.style.cssText = `position: absolute !important; width: 16px !important; height: 16px !important; background: white !important; border: 3px solid #1E88E5 !important; border-radius: 50% !important; top: -4px !important; left: ${leftPx}px !important; transform: translateX(-50%) !important; transition: left 0.3s ease !important; z-index: 2 !important; box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important; pointer-events: none !important;`;
        }
    }, 150);

    const tdee = item.tdee || 2000;
    const kalori = item.total_kalori_harian || 0;
    const lemak = item.total_lemak_harian || 0;
    const karbo = item.total_karbohidrat_harian || 0;
    const kaloriCat = kalori > tdee * 1.2 ? 'tinggi' : (kalori < tdee * 0.8 ? 'rendah' : 'cukup');
    const lemakCat = classifyFat(lemak, kalori);
    const karboCat = classifyCarb(karbo, kalori);
    const kaloriBadge = getCategoryBadge(kaloriCat);
    const lemakBadge = getCategoryBadge(lemakCat);
    const karboBadge = getCategoryBadge(karboCat);

    $('#dKalori').innerHTML = `${item.total_kalori_harian.toLocaleString('id')} ${kaloriBadge}`;
    $('#dTdee').innerText = (item.tdee || 0).toLocaleString('id');
    const surplus = (item.total_kalori_harian || 0) - (item.tdee || 0);
    const sb = $('#dSurplusBadge');
    if (sb) {
        sb.innerText = surplus > 0 ? `+${surplus} kkal` : `${surplus} kkal`;
        sb.className = `rw-surplus-badge ${surplus > 0 ? 'rw-surplus-badge--over' : 'rw-surplus-badge--ok'}`;
    }
    $('#dLemak').innerHTML = `${item.total_lemak_harian || 0} g ${lemakBadge}`;
    $('#dKarbo').innerHTML = `${item.total_karbohidrat_harian || 0} g ${karboBadge}`;
    $('#dLemakBar').style.width = `${Math.min(((item.total_lemak_harian||0)/100)*100, 100)}%`;
    $('#dKarboBar').style.width = `${Math.min(((item.total_karbohidrat_harian||0)/500)*100, 100)}%`;
    $('#dMenit').innerText = `${item.aktivitas_menit_per_minggu || 0} menit / minggu`;
    $('#dIntensitas').innerText = (item.intensitas_aktivitas || '-');

    const bmiCategoryRaw = item.bmi_category || 'Normal';
    let bmiKey = '';
    if (bmiCategoryRaw === 'Kurus' || bmiCategoryRaw === 'Kurang') bmiKey = 'underweight';
    else if (bmiCategoryRaw === 'Normal') bmiKey = 'normal';
    else if (bmiCategoryRaw === 'Overweight') bmiKey = 'overweight';
    else if (bmiCategoryRaw === 'Obesitas') bmiKey = 'obese';
    else bmiKey = 'normal';

    const aktivitasMenit = item.aktivitas_menit_per_minggu || 0;
    let aktivitasLevel = 'sedang';
    if (aktivitasMenit < 150) aktivitasLevel = 'ringan';
    else if (aktivitasMenit > 300) aktivitasLevel = 'berat';
    const categories = { kalori: kaloriCat, lemak: lemakCat, karbohidrat: karboCat, bmi: bmiKey, aktivitas: aktivitasLevel };
    const riskLevel = (item.risk_level || '').toUpperCase();
    const finalRiskLevel = riskLevel;

    // Rekomendasi dinamis
    const dynamicRecs = buatRekomendasiDinamis(categories, finalRiskLevel);
    let recs = item.recommendations;
    if (typeof recs === 'string') try { recs = JSON.parse(recs); } catch(e) { recs = [recs]; }
    if (!Array.isArray(recs)) recs = [recs];
    const allRecs = [...recs, ...dynamicRecs];
    const uniqueRecs = [...new Map(allRecs.map(r => [r, r])).values()];
    const rekEl = $('#dRekomendasi');
    if (rekEl) {
        if (uniqueRecs.length) {
            rekEl.innerHTML = uniqueRecs.map((r, i) => `<div class="rw-rekom-item"><div class="rw-rekom-item__num">${i+1}</div><div class="rw-rekom-item__text">${r}</div></div>`).join('');
        } else {
            rekEl.innerHTML = '<p class="rw-empty-tab">Tidak ada rekomendasi tersedia.</p>';
        }
    }

    // Edukasi
    let edukasiList = await getEdukasiRecommendations(categories, riskLevel, bmiCategoryRaw, aktivitasLevel);
    const eduContainer = $('#dEdukasi');
    const eduWrap = $('#dEdukasiWrap');
    if (eduWrap && eduContainer) {
        if (edukasiList.length > 0) {
            eduWrap.style.display = 'block';
            eduContainer.innerHTML = `<div class="rw-edukasi-grid">${edukasiList.map(item => `
                <div class="rw-edukasi-card" data-id="${item.id}">
                    <div class="rw-edukasi-card__inner">
                        <span class="rw-edukasi-category">${escapeHtml(item.kategori)}</span>
                        <h4>${escapeHtml(item.judul)}</h4>
                        <p>${escapeHtml(item.subtitle || '')}</p>
                        <div class="rw-edukasi-meta">
                            <span><i class="far fa-clock"></i> ${estimasiMenitBaca(item.konten)} menit</span>
                            <button class="rw-edukasi-read" data-id="${item.id}">Baca →</button>
                        </div>
                    </div>
                </div>
            `).join('')}</div>`;
            document.querySelectorAll('.rw-edukasi-read').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    if (id) window.location.href = `edukasi-detail.html?id=${id}`;
                });
            });
        } else {
            eduWrap.style.display = 'block';
            eduContainer.innerHTML = '<p class="rw-empty-tab">Belum ada materi edukasi yang tersedia saat ini.</p>';
        }
    }

    // Trace
    let trace = item.trace;
    if (typeof trace === 'string') try { trace = JSON.parse(trace); } catch(e) { trace = null; }
    const traceEl = $('#dTrace');
    if (traceEl) {
        if (trace && trace.length > 0) {
            traceEl.innerHTML = trace.map((step, idx) => {
                if (step.rule_id) {
                    return `<div class="rw-trace-step"><div class="rw-trace-step__num">${idx+1}</div><div class="rw-trace-step__content"><div class="rw-trace-step__rule">Aturan ${step.rule_id} (Prioritas ${step.priority})</div><div class="rw-trace-step__text">Kondisi: ${JSON.stringify(step.conditions)} → Kesimpulan: ${step.conclusion}</div></div></div>`;
                } else {
                    return `<div class="rw-trace-step"><div class="rw-trace-step__num">${idx+1}</div><div class="rw-trace-step__content">${step.info || 'Tidak ada aturan cocok, menggunakan default'}</div></div>`;
                }
            }).join('');
        } else {
            traceEl.innerHTML = '<p class="rw-empty-tab">Tidak ada data trace.</p>';
        }
    }

    // Insight message (tambahkan card baru di tab ringkasan)
    const insightMessage = generateInsightMessage(categories, finalRiskLevel, tdee, kalori);
    let insightDiv = document.getElementById('rwInsight');
    if (!insightDiv) {
        insightDiv = document.createElement('div');
        insightDiv.id = 'rwInsight';
        insightDiv.className = 'rw-insight';
        $('.rw-explanation')?.after(insightDiv);
    }
    insightDiv.innerHTML = `<div class="insight-card"><h4><i class="fas fa-lightbulb"></i> Insight Metabolisme</h4><p>${insightMessage}</p></div>`;

    // TDEE info (tambahkan di tab asupan)
    let tdeeInfoDiv = document.getElementById('rwTdeeInfo');
    if (!tdeeInfoDiv) {
        tdeeInfoDiv = document.createElement('div');
        tdeeInfoDiv.id = 'rwTdeeInfo';
        $('.rw-asupan-comparison')?.after(tdeeInfoDiv);
    }
    let tdeeInfo = '';
    if (tdee > 0) {
        const persen = ((kalori / tdee) * 100).toFixed(0);
        let statusClass = '', statusText = '';
        if (persen < 80) { statusClass = 'defisit'; statusText = 'Defisit Kalori'; }
        else if (persen > 120) { statusClass = 'surplus'; statusText = 'Surplus Kalori'; }
        else { statusClass = 'seimbang'; statusText = 'Seimbang'; }
        tdeeInfo = `<div class="tdee-info"><p><strong>Kebutuhan Kalori (TDEE):</strong> ${tdee.toFixed(0)} kkal/hari</p><p><strong>Persentase asupan terhadap kebutuhan:</strong> ${persen}% <span class="status-badge status-${statusClass}">${statusText}</span></p></div>`;
    }
    tdeeInfoDiv.innerHTML = tdeeInfo;

    // Tampilkan modal
    const modalOverlay = $('#modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
    activateTab('ringkasan');
} 

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function closeModal() {
    const modalOverlay = $('#modalOverlay');
    if (modalOverlay) modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
}

function activateTab(tabId) {
    $$('.rw-tab').forEach(t => t.classList.remove('active'));
    $$('.rw-tab-content').forEach(c => c.classList.remove('active'));
    const btn = $(`.rw-tab[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
    const pane = $(`#tab-${tabId}`);
    if (pane) pane.classList.add('active');
}

async function deleteRecord(id) {
    const res = await fetchAPI(`/api/riwayat/${id}`, { method: 'DELETE' });
    return res && res.status === 'success';
}

async function deleteAllRecords() {
    if (!confirm('⚠️ PERINGATAN: Anda akan menghapus SEMUA data riwayat konsultasi Anda. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?')) return;
    const res = await fetchAPI('/api/riwayat/delete-all', { method: 'DELETE' });
    if (res && res.status === 'success') {
        alert(res.message || 'Semua data riwayat berhasil dihapus.');
        currentPage = 1; currentSearch = ''; currentSort = 'terbaru'; currentRiskFilter = 'semua';
        const sortSelect = $('#sortSelect'); if (sortSelect) sortSelect.value = 'terbaru';
        const riskFilter = $('#riskFilter'); if (riskFilter) riskFilter.value = 'semua';
        const searchInput = $('#searchInput'); if (searchInput) searchInput.value = '';
        await loadSummary(); await loadList();
    } else alert('Gagal menghapus data. Silakan coba lagi.');
}

function initEvents() {
    $('#prevPage')?.addEventListener('click', () => { if (currentPage > 1) { currentPage--; loadList(); } });
    $('#nextPage')?.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadList(); } });
    $('#searchInput')?.addEventListener('input', (e) => {
        clearTimeout(window.searchTimeout);
        window.searchTimeout = setTimeout(() => { currentSearch = e.target.value; currentPage = 1; loadList(); }, 400);
    });
    $('#applyFilterBtn')?.addEventListener('click', () => { currentSort = $('#sortSelect').value; currentRiskFilter = $('#riskFilter').value; currentPage = 1; loadList(); });
    $('#deleteAllBtn')?.addEventListener('click', deleteAllRecords);
    $('#closeModal')?.addEventListener('click', closeModal);
    $('#modalCloseBtn')?.addEventListener('click', closeModal);
    $('#modalOverlay')?.addEventListener('click', (e) => { if (e.target === $('#modalOverlay')) closeModal(); });
    $$('.rw-tab').forEach(btn => btn.addEventListener('click', () => activateTab(btn.dataset.tab)));
    $('#modalDeleteBtn')?.addEventListener('click', () => { if (deleteId) $('#confirmOverlay').classList.add('open'); });
    $('#confirmCancel')?.addEventListener('click', () => $('#confirmOverlay').classList.remove('open'));
    $('#confirmDelete')?.addEventListener('click', async () => {
        const id = deleteId;
        $('#confirmOverlay').classList.remove('open');
        closeModal();
        const ok = await deleteRecord(id);
        if (ok) { loadSummary(); loadList(); } else alert('Gagal menghapus data.');
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); $('#confirmOverlay')?.classList.remove('open'); } });
}

function showLoading() {
    const tbody = $('#riwayatBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="rw-loading"><div class="rw-spinner"></div> Memuat...<\/td><\/tr>`;
    $('#emptyState').style.display = 'none';
}
function showError(msg) {
    const tbody = $('#riwayatBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:48px;color:#f87171;">${msg}<\/td><\/tr>`;
}

function animateNumber(sel, from, to, duration, decimals = 0) {
    const el = $(sel);
    if (!el) return;
    const startTime = performance.now();
    const diff = to - from;
    function step(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const val = from + diff * (1 - Math.pow(1 - t, 3));
        el.innerText = val.toFixed(decimals);
        if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
}

async function initHeader() {
    const token = getToken();
    if (token) {
        try {
            const res = await fetchAPI('/api/auth/me');
            if (res && res.status === 'success') {
                $('#guestMenu').style.display = 'none';
                $('#userMenu').style.display = 'flex';
                $('#userName').innerText = res.user.email.split('@')[0];
                if (res.user.role === 'admin') {
                    const adminLink = $('#adminPanelLink');
                    if (adminLink) adminLink.style.display = 'block';
                }
            } else throw new Error();
        } catch(e) {
            localStorage.removeItem('glisia_token');
            window.location.href = 'login.html';
        }
    } else {
        $('#guestMenu').style.display = 'flex';
        $('#userMenu').style.display = 'none';
    }
    $('#logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); localStorage.removeItem('glisia_token'); window.location.href = 'index.html'; });
    $('#btnLogin')?.addEventListener('click', () => { window.location.href = 'login.html'; });
}

document.addEventListener('DOMContentLoaded', async () => {
    await initHeader();
    initEvents();
    await loadSummary();
    await loadList();
});