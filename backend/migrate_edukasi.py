# backend/migrate_edukasi.py
import mysql.connector
import os
import sys

# Tambahkan path proyek ke sys.path agar bisa import backend.config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import Config

def migrate_edukasi():
    conn = mysql.connector.connect(
        host=Config.DB_HOST,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME
    )
    cursor = conn.cursor()

    # Tambah kolom sumber (jika belum ada)
    try:
        cursor.execute("SHOW COLUMNS FROM edukasi LIKE 'sumber'")
        if not cursor.fetchone():
            cursor.execute("ALTER TABLE edukasi ADD COLUMN sumber VARCHAR(255) AFTER subtitle")
            print("✅ Kolom 'sumber' berhasil ditambahkan.")
    except Exception as e:
        print(f"⚠️ Gagal menambah kolom sumber: {e}")

    # Hapus kolom durasi_menit, author, reviewer jika ada
    try:
        cursor.execute("SHOW COLUMNS FROM edukasi LIKE 'durasi_menit'")
        if cursor.fetchone():
            cursor.execute("ALTER TABLE edukasi DROP COLUMN durasi_menit")
            print("✅ Kolom 'durasi_menit' berhasil dihapus.")
    except Exception as e:
        print(f"⚠️ Gagal menghapus durasi_menit: {e}")

    try:
        cursor.execute("SHOW COLUMNS FROM edukasi LIKE 'author'")
        if cursor.fetchone():
            cursor.execute("ALTER TABLE edukasi DROP COLUMN author")
            print("✅ Kolom 'author' berhasil dihapus.")
    except Exception as e:
        print(f"⚠️ Gagal menghapus author: {e}")

    try:
        cursor.execute("SHOW COLUMNS FROM edukasi LIKE 'reviewer'")
        if cursor.fetchone():
            cursor.execute("ALTER TABLE edukasi DROP COLUMN reviewer")
            print("✅ Kolom 'reviewer' berhasil dihapus.")
    except Exception as e:
        print(f"⚠️ Gagal menghapus reviewer: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print("Migrasi tabel edukasi selesai.")

if __name__ == "__main__":
    migrate_edukasi()