import bcrypt
import mysql.connector

# Konfigurasi database (sesuai XAMPP Anda)
DB_HOST = 'localhost'
DB_USER = 'root'
DB_PASSWORD = ''
DB_NAME = 'glisia_db'  # ganti dengan nama database Anda

conn = mysql.connector.connect(
    host=DB_HOST,
    user=DB_USER,
    password=DB_PASSWORD,
    database=DB_NAME
)
cursor = conn.cursor()

# Hash password admin
password = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode()

# Insert admin
cursor.execute("""
    INSERT INTO users (email, password, role) 
    VALUES (%s, %s, %s)
""", ('admin@gmail.com', password, 'admin'))

conn.commit()
print("Admin created: admin@gmail.com / admin123")

cursor.close()
conn.close()