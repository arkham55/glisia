# engine/categorizers.py
# Fokus pada kalori, lemak, karbohidrat, dan aktivitas
# Sumber: WHO, Kemenkes RI, AKG 2019, Mifflin-St Jeor
# Kategori BMI berdasarkan standar Asia Pasifik (Kemenkes RI)

def calculate_bmi_category(weight_kg: float, height_cm: float) -> str:
    """Menghitung BMI dan mengkategorikan berdasarkan standar Asia Pasifik."""
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    if bmi < 18.5:
        return "underweight"
    elif 18.5 <= bmi < 23:
        return "normal"
    elif 23 <= bmi < 25:
        return "overweight"
    else:
        return "obesitas"

def hitung_tdee(weight_kg: float, height_cm: float, usia: int, jenis_kelamin: str, intensitas_aktivitas: str) -> float:
    """
    Menghitung TDEE menggunakan rumus Mifflin-St Jeor.
    intensitas_aktivitas: 'ringan', 'sedang', 'berat'
    """
    if jenis_kelamin == 'pria':
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * usia + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * usia - 161
    faktor = {
        'ringan': 1.2,
        'sedang': 1.55,
        'berat': 1.725
    }
    return bmr * faktor.get(intensitas_aktivitas, 1.2)

def kategorikan_kalori(total_kalori_harian: float, tdee: float) -> str:
    """Kategorikan asupan kalori berdasarkan persentase terhadap TDEE."""
    persen = (total_kalori_harian / tdee) * 100 if tdee > 0 else 100
    if persen < 80:
        return "rendah"
    elif persen > 120:
        return "tinggi"
    else:
        return "cukup"

def kategorikan_lemak(lemak_gram_harian: float, total_kalori: float) -> str:
    """
    Kategorikan asupan lemak berdasarkan persentase dari total kalori.
    Batas: <20% rendah, 20-35% cukup, >35% tinggi
    """
    if total_kalori <= 0:
        return "cukup"
    lemak_kalori = lemak_gram_harian * 9
    persen = (lemak_kalori / total_kalori) * 100
    if persen < 20:
        return "rendah"
    elif persen > 35:
        return "tinggi"
    else:
        return "cukup"

def kategorikan_karbohidrat(karbohidrat_gram_harian: float, total_kalori: float) -> str:
    """
    Kategorikan asupan karbohidrat berdasarkan persentase dari total kalori.
    Batas: <45% rendah, 45-65% cukup, >65% tinggi
    """
    if total_kalori <= 0:
        return "cukup"
    karbo_kalori = karbohidrat_gram_harian * 4
    persen = (karbo_kalori / total_kalori) * 100
    if persen < 45:
        return "rendah"
    elif persen > 65:
        return "tinggi"
    else:
        return "cukup"

def categorize_intensitas_aktivitas(intensitas: str) -> str:
    return intensitas if intensitas in ['ringan','sedang','berat'] else 'ringan'

def categorize_aktivitas(menit_per_minggu: int, intensitas: str = "sedang") -> str:
    """Menganalisis aktivitas fisik berdasarkan durasi DAN intensitas."""
    # Konversi ke setara menit sedang (MET: ringan=2, sedang=3.5, berat=6)
    if intensitas == "ringan":
        equivalent = menit_per_minggu * (2.0 / 3.5)
    elif intensitas == "berat":
        equivalent = menit_per_minggu * (6.0 / 3.5)
    else:
        equivalent = menit_per_minggu
    if equivalent < 150:
        return "ringan"
    elif equivalent <= 300:
        return "sedang"
    else:
        return "berat"

def get_aktivitas_rekomendasi(intensitas: str, durasi: int) -> dict:
    """Memberikan rekomendasi aktivitas berdasarkan intensitas dan durasi."""
    if intensitas == "ringan":
        if durasi < 150:
            return {"status": "kurang", "message": "Durasi aktivitas ringan belum cukup. Targetkan 150 menit/minggu aktivitas sedang.", "saran": "Tingkatkan intensitas atau durasi."}
        else:
            return {"status": "cukup", "message": "Durasi aktivitas ringan sudah baik.", "saran": "Pertahankan konsistensi."}
    elif intensitas == "sedang":
        if durasi < 150:
            return {"status": "kurang", "message": "Durasi aktivitas sedang di bawah rekomendasi WHO (150 menit/minggu).", "saran": "Tingkatkan durasi minimal 150 menit/minggu."}
        elif durasi <= 300:
            return {"status": "cukup", "message": "Durasi aktivitas sedang memenuhi rekomendasi WHO!", "saran": "Pertahankan dan tambahkan variasi."}
        else:
            return {"status": "baik", "message": "Durasi aktivitas sedang sangat baik!", "saran": "Pertahankan dan jaga keseimbangan."}
    else:  # berat
        if durasi < 75:
            return {"status": "kurang", "message": "Durasi aktivitas berat di bawah rekomendasi WHO (75 menit/minggu).", "saran": "Tingkatkan durasi."}
        else:
            return {"status": "baik", "message": "Durasi aktivitas berat memenuhi rekomendasi WHO!", "saran": "Pertahankan kebiasaan baik."}

def generate_recommendations(facts: dict, risk_level: str) -> dict:
    """Menghasilkan rekomendasi berdasarkan fakta dan tingkat risiko."""
    recs = []
    edu_parts = []

    if risk_level == "tinggi":
        recs.append("⚠️ Segera konsultasikan kondisi Anda ke dokter atau ahli gizi.")
        recs.append("🏥 Lakukan pemeriksaan kolesterol, gula darah, dan tekanan darah.")
        edu_parts.append("Risiko tinggi terkait kelebihan kalori dan lemak dapat menyebabkan obesitas, diabetes, dan penyakit jantung.")
    elif risk_level == "sedang":
        recs.append("📝 Mulai perbaiki pola makan dan tingkatkan aktivitas fisik secara bertahap.")
        recs.append("📊 Pantau asupan kalori dan lemak harian Anda.")
        edu_parts.append("Risiko sedang: tubuh sudah menunjukkan ketidakseimbangan. Perubahan kecil sekarang berdampak besar nanti.")
    else:
        recs.append("✅ Pertahankan pola makan seimbang dan rutin olahraga.")
        recs.append("🩺 Lakukan pemeriksaan kesehatan berkala setiap 6-12 bulan.")
        edu_parts.append("Risiko rendah: Anda berada di jalur yang baik. Terus jaga kebiasaan positif.")

    if facts.get("kalori") == "tinggi":
        recs.append("🍽️ Kurangi total kalori harian dengan mengatur porsi makan dan memilih makanan rendah kalori namun padat nutrisi.")
        recs.append("🚶 Tingkatkan aktivitas fisik untuk membakar kelebihan kalori.")
    elif facts.get("kalori") == "rendah":
        recs.append("🍚 Pastikan Anda makan cukup untuk memenuhi kebutuhan energi, terutama jika aktif berolahraga.")
        recs.append("🥩 Tambahkan protein dan karbohidrat kompleks untuk menjaga stamina.")

    if facts.get("lemak") == "tinggi":
        recs.append("🧈 Kurangi lemak jenuh dan lemak trans: hindari gorengan, santan kental, mentega, dan makanan cepat saji. Pilih lemak sehat dari alpukat, kacang-kacangan, dan minyak zaitun.")
        edu_parts.append("Konsumsi lemak >35% dari total kalori meningkatkan kolesterol jahat dan risiko penyakit jantung.")
    elif facts.get("lemak") == "rendah":
        recs.append("🥑 Asupan lemak Anda cukup rendah, pastikan tetap konsumsi lemak sehat untuk fungsi hormon dan penyerapan vitamin.")

    if facts.get("karbohidrat") == "tinggi":
        recs.append("🍚 Kurangi porsi karbohidrat olahan (nasi putih, roti putih, mi). Ganti dengan karbohidrat kompleks: nasi merah, oatmeal, ubi, jagung.")
        edu_parts.append("Karbohidrat sederhana cepat menjadi glukosa. Karbohidrat kompleks lebih lambat dicerna dan membantu kontrol gula darah.")
    elif facts.get("karbohidrat") == "rendah":
        recs.append("🍚 Pastikan konsumsi karbohidrat cukup untuk energi, terutama jika Anda aktif.")

    if facts.get("bmi") == "obesitas":
        recs.append("⚖️ Konsultasi dengan dokter untuk program penurunan berat badan yang aman. Target turun 5-10% berat badan dalam 3-6 bulan.")
        edu_parts.append("Obesitas adalah faktor risiko utama resistensi insulin. Penurunan berat badan 5% saja sudah meningkatkan sensitivitas insulin.")
    elif facts.get("bmi") == "overweight":
        recs.append("⚖️ Usahakan mencapai berat badan ideal dengan defisit kalori 300-500 kkal/hari dan olahraga teratur.")
    elif facts.get("bmi") == "underweight":
        recs.append("⚖️ Meskipun kurus, pola makan tinggi kalori dan lemak tetap berisiko. Fokus pada gizi seimbang.")

    if facts.get("aktivitas") == "ringan":
        recs.append("🏃 Tingkatkan aktivitas fisik: target minimal 150 menit per minggu aktivitas sedang (jalan cepat, bersepeda santai).")
        edu_parts.append("Aktivitas fisik membantu otot menyerap glukosa dari darah tanpa perlu insulin, menurunkan gula darah secara alami.")
    elif facts.get("aktivitas") == "sedang":
        recs.append("🏃 Aktivitas Anda sudah cukup baik. Pertahankan dan coba tambahkan latihan kekuatan 2x/minggu untuk meningkatkan sensitivitas insulin.")

    recs = list(dict.fromkeys(recs))
    return {
        "recommendations": recs,
        "education_material": " ".join(edu_parts)
    }

def analyze_risk(weight_kg: float, height_cm: float,
                 usia: int, jenis_kelamin: str,
                 total_kalori_harian: float,
                 total_lemak_harian: float,
                 total_karbohidrat_harian: float,
                 aktivitas_menit_per_minggu: int,
                 intensitas_aktivitas: str = "sedang"):
    """
    Menerima input numerik user (semua dalam satuan per hari, kecuali aktivitas per minggu).
    """
    bmi_cat = calculate_bmi_category(weight_kg, height_cm)
    tdee = hitung_tdee(weight_kg, height_cm, usia, jenis_kelamin, intensitas_aktivitas)
    kalori_cat = kategorikan_kalori(total_kalori_harian, tdee)
    lemak_cat = kategorikan_lemak(total_lemak_harian, total_kalori_harian)
    karbohidrat_cat = kategorikan_karbohidrat(total_karbohidrat_harian, total_kalori_harian)
    aktivitas_cat = categorize_aktivitas(aktivitas_menit_per_minggu, intensitas_aktivitas)
    intensitas_cat = categorize_intensitas_aktivitas(intensitas_aktivitas)

    facts = {
        "kalori": kalori_cat,
        "lemak": lemak_cat,
        "karbohidrat": karbohidrat_cat,
        "bmi": bmi_cat,
        "aktivitas": aktivitas_cat,
        "intensitas": intensitas_cat
    }

    from .inference_engine import GlisiaInferenceEngine
    engine = GlisiaInferenceEngine()
    result = engine.infer(facts)
    
    rec_data = generate_recommendations(facts, result["risk_level"])
    result["recommendations"] = rec_data["recommendations"]
    result["education_material"] = rec_data["education_material"]
    
    aktivitas_info = get_aktivitas_rekomendasi(intensitas_aktivitas, aktivitas_menit_per_minggu)
    result["aktivitas_info"] = aktivitas_info
    result["tdee"] = tdee
    
    result["categories"] = {
        "bmi": bmi_cat,
        "kalori": kalori_cat,
        "lemak": lemak_cat,
        "karbohidrat": karbohidrat_cat,
        "aktivitas": aktivitas_cat,
        "intensitas": intensitas_cat
    }
    result["input_numeric"] = {
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "usia": usia,
        "jenis_kelamin": jenis_kelamin,
        "total_kalori_harian": total_kalori_harian,
        "total_lemak_harian": total_lemak_harian,
        "total_karbohidrat_harian": total_karbohidrat_harian,
        "aktivitas_menit_per_minggu": aktivitas_menit_per_minggu,
        "intensitas_aktivitas": intensitas_aktivitas
    }
    return result