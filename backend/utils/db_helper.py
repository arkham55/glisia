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
    cursor = conn.cursor()
    
    # Tabel users
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            nama VARCHAR(100),
            role ENUM('admin', 'user') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tabel hasil analisis
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hasil_analisis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100),
            tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            weight_kg FLOAT,
            height_cm FLOAT,
            usia INT,
            jenis_kelamin VARCHAR(10),
            total_kalori_harian FLOAT,
            total_lemak_harian FLOAT,
            total_karbohidrat_harian FLOAT,
            aktivitas_menit_per_minggu INT,
            intensitas_aktivitas VARCHAR(10),
            tdee FLOAT,
            risk_level VARCHAR(10),
            explanation TEXT,
            recommendations TEXT,
            education_material TEXT,
            trace TEXT
        )
    """)

    # Tabel edukasi (tanpa durasi_menit, author, reviewer, dan ditambah sumber)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS edukasi (
            id INT AUTO_INCREMENT PRIMARY KEY,
            kategori VARCHAR(50),
            judul VARCHAR(200),
            subtitle VARCHAR(255),
            konten TEXT,
            sumber VARCHAR(255),
            gambar_url VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tabel saran_materi
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saran_materi (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nama VARCHAR(100),
            email VARCHAR(100),
            topik VARCHAR(255),
            deskripsi TEXT,
            status ENUM('baru', 'dibaca', 'ditindak') DEFAULT 'baru',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Tabel foods
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS foods (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            calories FLOAT NOT NULL,
            fat FLOAT NOT NULL,
            carbohydrate FLOAT NOT NULL
        )
    """)

    # (Opsional) Migrasi kolom jika diperlukan – tapi tidak melakukan seeding data
    # Hanya untuk memastikan kolom yang diperlukan ada (jika tabel sudah ada dari versi lama)
    try:
        cursor.execute("SHOW COLUMNS FROM edukasi LIKE 'sumber'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE edukasi ADD COLUMN sumber VARCHAR(255)")
        # Hapus kolom lama jika masih ada
        for col in ['durasi_menit', 'author', 'reviewer']:
            cursor.execute(f"SHOW COLUMNS FROM edukasi LIKE '{col}'")
            if cursor.fetchone():
                cursor.execute(f"ALTER TABLE edukasi DROP COLUMN {col}")
    except mysql.connector.Error:
        # Abaikan jika tidak dapat memodifikasi (misal tabel belum ada)
        pass

    # Tidak ada seeding data edukasi di sini
    # Data edukasi akan dikelola via admin atau import terpisah

    cursor.close()
    conn.close()
    print("Database initialized successfully (no seeding data).")