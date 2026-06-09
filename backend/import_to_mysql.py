import csv
import os
import mysql.connector
from mysql.connector import Error

# Konfigurasi koneksi MySQL (XAMPP)
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'glisia_db'
}

# Path ke file CSV
CSV_PATH = os.path.join(os.path.dirname(__file__), 'data', 'indonesian_food_nutrition.csv')

try:
    conn = mysql.connector.connect(**MYSQL_CONFIG)
    cursor = conn.cursor()

    # Buat tabel foods dengan kolom carbohydrate
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS foods (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            calories FLOAT NOT NULL,
            fat FLOAT NOT NULL,
            carbohydrate FLOAT NOT NULL
        )
    ''')
    conn.commit()

    # Kosongkan tabel (isi ulang)
    cursor.execute("DELETE FROM foods")
    conn.commit()

    if os.path.exists(CSV_PATH):
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                name = row.get('name') or row.get('nama')
                calories = float(row.get('calories') or row.get('kalori') or 0)
                fat = float(row.get('fat') or row.get('lemak') or 0)
                carb = float(row.get('carbohydrate') or row.get('karbohidrat') or 0)
                cursor.execute(
                    "INSERT INTO foods (name, calories, fat, carbohydrate) VALUES (%s, %s, %s, %s)",
                    (name, calories, fat, carb)
                )
                count += 1
        conn.commit()
        print(f"✅ Data foods berhasil diimpor ke MySQL. Total: {count} baris")
    else:
        print(f"❌ CSV tidak ditemukan: {CSV_PATH}")

except Error as e:
    print(f"❌ Gagal koneksi ke MySQL: {e}")

finally:
    if conn and conn.is_connected():
        cursor.close()
        conn.close()