# backend/utils/db_helper.py
import mysql.connector
from backend.config import Config

def get_db_connection():
    """Mendapatkan koneksi ke database MySQL."""
    return mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
    )

def init_db():
    """Membuat database dan tabel jika belum ada."""
    # Koneksi tanpa database untuk membuat database jika belum ada
    conn = mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD
    )
    cursor = conn.cursor()
    cursor.execute(f"CREATE DATABASE IF NOT EXISTS {Config.DB_NAME}")
    cursor.close()
    conn.close()

    # Koneksi ke database yang sudah ada
    conn = get_db_connection()
    cursor = conn.cursor()   # <--- INI YANG KURANG

    # Tabel hasil analisis
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hasil_analisis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100),
            tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            weight_kg FLOAT,
            height_cm FLOAT,
            gula_gram_per_hari FLOAT,
            frekuensi_minuman_per_hari INT,
            karbohidrat_porsi_per_hari INT,
            lemak_gram_per_hari FLOAT,
            aktivitas_menit_per_minggu INT,
            risk_level VARCHAR(10),
            explanation TEXT,
            recommendations TEXT,
            education_material TEXT,
            trace TEXT
        )
    """)

    # Tabel edukasi
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS edukasi (
            id INT AUTO_INCREMENT PRIMARY KEY,
            kategori VARCHAR(50),
            judul VARCHAR(200),
            konten TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Insert contoh data edukasi jika kosong
    cursor.execute("SELECT COUNT(*) FROM edukasi")
    if cursor.fetchone()[0] == 0:
        contoh_edukasi = [
            ("gula", "Apa itu Gula?", "Gula adalah karbohidrat sederhana yang menjadi sumber energi. Terdiri dari gula alami (buah, susu) dan gula tambahan (gula pasir, sirup)."),
            ("gula", "Batasan Konsumsi Gula Harian", "WHO merekomendasikan kurang dari 50 gram per hari, idealnya kurang dari 25 gram per hari."),
            ("dampak", "Dampak Gula Berlebih", "Obesitas, diabetes tipe 2, penyakit jantung, dan gangguan metabolik lainnya."),
            ("olahraga", "Aktivitas Fisik", "Target minimal 150 menit aktivitas sedang per minggu, seperti jalan cepat, bersepeda, atau berenang."),
            ("karbohidrat", "Karbohidrat dan Glukosa", "Karbohidrat diubah menjadi glukosa. Pilih karbohidrat kompleks (nasi merah, oat) untuk penyerapan lebih lambat."),
            ("lemak", "Lemak dan Resistensi Insulin", "Lemak jenuh dan trans dapat memperburuk resistensi insulin. Batasi gorengan dan santan."),
        ]
        for kat, judul, konten in contoh_edukasi:
            cursor.execute(
                "INSERT INTO edukasi (kategori, judul, konten) VALUES (%s, %s, %s)",
                (kat, judul, konten),
            )

    conn.commit()
    cursor.close()
    conn.close()