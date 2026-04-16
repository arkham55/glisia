# engine/categorizers.py
# Semua parameter menggunakan satuan PER HARI, kecuali aktivitas fisik PER MINGGU
# Sumber: WHO, Kemenkes RI, AKG 2019

def calculate_bmi_category(weight_kg: float, height_cm: float) -> str:
    """Menghitung BMI dan mengkategorikan berdasarkan standar WHO."""
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2)
    if bmi < 18.5:
        return "underweight"
    elif 18.5 <= bmi < 25:
        return "normal"
    elif 25 <= bmi < 30:
        return "overweight"
    else:
        return "obesitas"

def categorize_gula_harian(gram_per_hari: float) -> str:
    if gram_per_hari < 25:
        return "rendah"
    elif 25 <= gram_per_hari <= 50:
        return "sedang"
    else:
        return "tinggi"

def categorize_frekuensi_minuman_manis(kali_per_hari: int) -> str:
    if kali_per_hari == 0:
        return "jarang"
    elif kali_per_hari == 1:
        return "kadang"
    else:
        return "sering"

def categorize_karbohidrat(porsi_per_hari: int) -> str:
    if porsi_per_hari <= 3:
        return "rendah"
    elif 4 <= porsi_per_hari <= 6:
        return "sedang"
    else:
        return "tinggi"

def categorize_lemak(gram_per_hari: float) -> str:
    if gram_per_hari < 67:
        return "rendah"
    elif gram_per_hari == 67:
        return "sedang"
    else:
        return "tinggi"

def categorize_aktivitas(menit_per_minggu: int) -> str:
    """
    Durasi aktivitas fisik (olahraga/gerak aktif) per minggu.
    Berdasarkan rekomendasi WHO:
    - Ringan (kurang aktif): < 150 menit/minggu
    - Sedang (cukup aktif): 150 - 300 menit/minggu
    - Berat (aktif): > 300 menit/minggu
    """
    if menit_per_minggu < 150:
        return "ringan"
    elif 150 <= menit_per_minggu <= 300:
        return "sedang"
    else:
        return "berat"

def generate_recommendations(facts: dict, risk_level: str) -> dict:
    """
    Menghasilkan rekomendasi solusi berdasarkan fakta dan tingkat risiko.
    Output: {
        "recommendations": list of str,
        "education_material": str
    }
    """
    recs = []
    edu_parts = []

    # Rekomendasi berdasarkan risiko utama
    if risk_level == "tinggi":
        recs.append("Segera konsultasikan kondisi Anda ke dokter atau ahli gizi untuk evaluasi lebih lanjut.")
        recs.append("Lakukan pemeriksaan gula darah puasa dan HbA1c untuk mendeteksi dini diabetes.")
        edu_parts.append("⚠️ Risiko tinggi berarti Anda berpotensi mengalami diabetes tipe 2, penyakit jantung, dan gangguan metabolik dalam waktu dekat jika tidak diubah polanya.")
    elif risk_level == "sedang":
        recs.append("Mulai perbaiki pola makan dan tingkatkan aktivitas fisik secara bertahap.")
        recs.append("Pantau asupan gula harian Anda menggunakan aplikasi atau catatan sederhana.")
        edu_parts.append("⚠️ Risiko sedang: tubuh Anda sudah menunjukkan tanda-tanda metabolik yang perlu diwaspadai. Perubahan kecil sekarang berdampak besar nanti.")
    else:  # rendah
        recs.append("Pertahankan pola makan sehat dan rutin berolahraga.")
        recs.append("Lakukan pemeriksaan kesehatan berkala setiap 6-12 bulan.")
        edu_parts.append("✅ Risiko rendah: Anda berada di jalur yang baik. Terus jaga kebiasaan positif.")

    # Rekomendasi spesifik berdasarkan parameter bermasalah
    if facts.get("gula_harian") in ["tinggi", "sedang"]:
        if facts["gula_harian"] == "tinggi":
            recs.append("Kurangi konsumsi gula tambahan: hindari minuman manis, permen, kue, dan saus manis. Batasi maksimal 25 gram/hari.")
        else:
            recs.append("Asupan gula Anda cukup, namun usahakan di bawah 25 gram/hari untuk hasil optimal. Ganti gula pasir dengan pemanis alami rendah kalori (stevia) jika perlu.")
        edu_parts.append("Gula tambahan tidak hanya dari minuman manis, tapi juga dari saus, roti, dan makanan olahan. Baca label nutrisi.")

    if facts.get("frekuensi_minuman") == "sering":
        recs.append("Hentikan kebiasaan minum minuman manis kemasan. Ganti dengan air putih, infused water, atau teh tanpa gula.")
        edu_parts.append("Satu botol soda (330ml) mengandung sekitar 35 gram gula – sudah melebihi batas harian yang dianjurkan (25 gram).")
    elif facts.get("frekuensi_minuman") == "kadang":
        recs.append("Kurangi frekuensi minuman manis menjadi maksimal 2-3 kali per minggu, lalu perlahan ke 0 kali.")

    if facts.get("karbohidrat") == "tinggi":
        recs.append("Kurangi porsi nasi atau sumber karbohidrat olahan. Ganti dengan karbohidrat kompleks: nasi merah, oatmeal, ubi, jagung (maksimal 3-4 porsi/hari).")
        edu_parts.append("Karbohidrat sederhana (nasi putih, roti putih, mi) cepat menjadi glukosa. Karbohidrat kompleks lebih lambat dicerna dan membantu kontrol gula darah.")
    elif facts.get("karbohidrat") == "sedang":
        recs.append("Porsi karbohidrat Anda sudah cukup baik, namun pastikan memilih sumber karbohidrat yang tidak diproses berlebihan.")

    if facts.get("lemak") == "tinggi":
        recs.append("Kurangi lemak jenuh dan lemak trans: hindari gorengan, santan kental, mentega, dan makanan cepat saji. Pilih lemak sehat dari alpukat, kacang-kacangan, dan minyak zaitun.")
        edu_parts.append("Lemak tinggi dapat menyebabkan resistensi insulin, memperburuk efek gula darah. Batasi lemak maksimal 67 gram/hari (setara 5 sendok makan minyak).")

    if facts.get("aktivitas") == "ringan":
        recs.append("Tingkatkan aktivitas fisik: target minimal 150 menit per minggu (misal jalan cepat 30 menit x 5 hari).")
        edu_parts.append("Aktivitas fisik membantu otot menyerap glukosa dari darah tanpa perlu insulin, sehingga menurunkan gula darah secara alami.")
    elif facts.get("aktivitas") == "sedang":
        recs.append("Aktivitas Anda sudah cukup baik. Tambahkan latihan kekuatan (push-up, squat) 2x/minggu untuk meningkatkan sensitivitas insulin.")

    if facts.get("bmi") == "obesitas":
        recs.append("Konsultasi dengan dokter untuk program penurunan berat badan yang aman. Target turun 5-10% berat badan dalam 3-6 bulan dapat memperbaiki metabolik.")
        edu_parts.append("Obesitas adalah faktor risiko utama resistensi insulin. Penurunan berat badan 5% saja sudah meningkatkan sensitivitas insulin secara signifikan.")
    elif facts.get("bmi") == "overweight":
        recs.append("Usahakan mencapai berat badan ideal dengan defisit kalori 300-500 kkal/hari dan olahraga teratur.")
    elif facts.get("bmi") == "underweight":
        recs.append("Meskipun kurus, pola makan tinggi gula dan lemak tetap berisiko. Fokus pada gizi seimbang dengan protein dan lemak sehat.")

    # Hapus rekomendasi duplikat
    recs = list(dict.fromkeys(recs))
    
    education_material = " ".join(edu_parts)
    return {
        "recommendations": recs,
        "education_material": education_material
    }

def analyze_risk(weight_kg: float, height_cm: float,
                 gula_gram_per_hari: float,
                 frekuensi_minuman_per_hari: int,
                 karbohidrat_porsi_per_hari: int,
                 lemak_gram_per_hari: float,
                 aktivitas_menit_per_minggu: int):
    """
    Menerima input numerik user:
    - Semua parameter PER HARI, kecuali aktivitas_menit_per_minggu (PER MINGGU)
    """
    # Kategorisasi
    bmi_cat = calculate_bmi_category(weight_kg, height_cm)
    gula_cat = categorize_gula_harian(gula_gram_per_hari)
    frek_cat = categorize_frekuensi_minuman_manis(frekuensi_minuman_per_hari)
    karb_cat = categorize_karbohidrat(karbohidrat_porsi_per_hari)
    lemak_cat = categorize_lemak(lemak_gram_per_hari)
    aktivitas_cat = categorize_aktivitas(aktivitas_menit_per_minggu)

    facts = {
        "gula_harian": gula_cat,
        "frekuensi_minuman": frek_cat,
        "karbohidrat": karb_cat,
        "lemak": lemak_cat,
        "aktivitas": aktivitas_cat,
        "bmi": bmi_cat
    }

    from .inference_engine import GlisiaInferenceEngine
    engine = GlisiaInferenceEngine()
    result = engine.infer(facts)
    
    # Tambahkan rekomendasi
    rec_data = generate_recommendations(facts, result["risk_level"])
    result["recommendations"] = rec_data["recommendations"]
    result["education_material"] = rec_data["education_material"]
    
    result["categories"] = {
        "bmi": bmi_cat,
        "gula_harian": gula_cat,
        "frekuensi_minuman": frek_cat,
        "karbohidrat": karb_cat,
        "lemak": lemak_cat,
        "aktivitas": aktivitas_cat
    }
    result["input_numeric"] = {
        "weight_kg": weight_kg,
        "height_cm": height_cm,
        "gula_gram_per_hari": gula_gram_per_hari,
        "frekuensi_minuman_per_hari": frekuensi_minuman_per_hari,
        "karbohidrat_porsi_per_hari": karbohidrat_porsi_per_hari,
        "lemak_gram_per_hari": lemak_gram_per_hari,
        "aktivitas_menit_per_minggu": aktivitas_menit_per_minggu
    }
    return result