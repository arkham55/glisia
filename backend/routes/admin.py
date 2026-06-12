# backend/routes/admin.py
from flask import Blueprint, request, jsonify
from backend.utils.db_helper import get_db_connection
from functools import wraps
import jwt
import json
from backend.config import Config

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token missing'}), 401
        try:
            payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
            if payload.get('role') != 'admin':
                return jsonify({'error': 'Admin only'}), 403
            request.user_id = payload.get('user_id')
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated

@admin_bp.route('/api/admin/stats', methods=['GET'])
@admin_required
def admin_stats():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Total users
    cursor.execute("SELECT COUNT(*) as total FROM users")
    total_users = cursor.fetchone()['total']

    # Total consultations
    cursor.execute("SELECT COUNT(*) as total FROM hasil_analisis")
    total_cons = cursor.fetchone()['total']

    # Rata-rata kalori harian
    cursor.execute("SELECT AVG(total_kalori_harian) as avg_cal FROM hasil_analisis")
    avg_cal = cursor.fetchone()['avg_cal'] or 0

    # Persentase risiko tinggi (berdasarkan jumlah sesi)
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(risk_level) = 'tinggi' THEN 1 ELSE 0 END) as high
        FROM hasil_analisis
    """)
    row = cursor.fetchone()
    high_percent = (row['high'] / row['total'] * 100) if row['total'] > 0 else 0

    # Jumlah PENGGUNA UNIK dengan risiko tinggi (minimal satu analisis berisiko tinggi)
    cursor.execute("""
        SELECT COUNT(DISTINCT user_id) as unique_high
        FROM hasil_analisis
        WHERE LOWER(risk_level) = 'tinggi'
    """)
    unique_high = cursor.fetchone()['unique_high'] or 0

    # Rata-rata BMI
    cursor.execute("""
        SELECT AVG(weight_kg / POW(height_cm/100, 2)) as avg_bmi 
        FROM hasil_analisis
    """)
    avg_bmi = cursor.fetchone()['avg_bmi'] or 0

    # Edukator aktif
    cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'educator'")
    educators = cursor.fetchone()['total']
    if educators == 0:
        cursor.execute("SELECT COUNT(*) as total FROM users WHERE role = 'admin'")
        educators = cursor.fetchone()['total']

    # Distribusi risiko per usia
    cursor.execute("""
        SELECT 
            CASE 
                WHEN usia BETWEEN 18 AND 25 THEN '18-25'
                WHEN usia BETWEEN 26 AND 35 THEN '26-35'
                WHEN usia BETWEEN 36 AND 45 THEN '36-45'
                WHEN usia > 45 THEN '>45'
                ELSE 'Lainnya'
            END as age_group,
            SUM(CASE WHEN LOWER(risk_level) = 'rendah' THEN 1 ELSE 0 END) as rendah,
            SUM(CASE WHEN LOWER(risk_level) = 'sedang' THEN 1 ELSE 0 END) as sedang,
            SUM(CASE WHEN LOWER(risk_level) = 'tinggi' THEN 1 ELSE 0 END) as tinggi
        FROM hasil_analisis
        WHERE usia IS NOT NULL
        GROUP BY age_group
        ORDER BY MIN(usia)
    """)
    risk_by_age = cursor.fetchall()

    # Faktor dominan penyebab risiko tinggi (berdasarkan sesi)
    cursor.execute("""
        SELECT id, total_kalori_harian, tdee, total_lemak_harian, total_karbohidrat_harian,
               aktivitas_menit_per_minggu, intensitas_aktivitas
        FROM hasil_analisis
        WHERE LOWER(risk_level) = 'tinggi'
    """)
    high_risk_rows = cursor.fetchall()
    total_high = len(high_risk_rows)
    factors = {
        'Kelebihan Kalori': 0,
        'Lemak Tinggi': 0,
        'Karbohidrat Tinggi': 0,
        'Kurang Aktivitas': 0
    }
    for row in high_risk_rows:
        if row['total_kalori_harian'] > row['tdee'] * 1.1:
            factors['Kelebihan Kalori'] += 1
        if row['total_kalori_harian'] > 0:
            fat_percent = (row['total_lemak_harian'] * 9) / row['total_kalori_harian'] * 100
            if fat_percent > 35:
                factors['Lemak Tinggi'] += 1
        if row['total_kalori_harian'] > 0:
            carb_percent = (row['total_karbohidrat_harian'] * 4) / row['total_kalori_harian'] * 100
            if carb_percent > 65:
                factors['Karbohidrat Tinggi'] += 1
        if row['aktivitas_menit_per_minggu'] < 150 or row['intensitas_aktivitas'].lower() == 'ringan':
            factors['Kurang Aktivitas'] += 1

    top_factors = []
    for name, count in factors.items():
        if total_high > 0:
            percent = (count / total_high) * 100
            top_factors.append({'name': name, 'percent': round(percent, 1)})
    top_factors.sort(key=lambda x: x['percent'], reverse=True)

    cursor.close()
    conn.close()

    return jsonify({
        'status': 'success',
        'data': {
            'total_users': total_users,
            'total_consultations': total_cons,
            'avg_calories': round(avg_cal),
            'high_risk_percentage': round(high_percent, 1),
            'unique_high_risk_users': unique_high,
            'avg_bmi': round(avg_bmi, 1),
            'active_educators': educators,
            'risk_by_age': risk_by_age,
            'top_factors': top_factors
        }
    })

@admin_bp.route('/api/admin/consultations', methods=['GET'])
@admin_required
def admin_consultations():
    limit = request.args.get('limit', 5, type=int)
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT h.*, u.email
        FROM hasil_analisis h
        JOIN users u ON h.user_id = u.id
        ORDER BY h.tanggal DESC
        LIMIT %s
    """, (limit,))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    items = []
    for row in rows:
        bmi = row['weight_kg'] / ((row['height_cm'] / 100) ** 2)
        bmi = round(bmi, 1)
        surplus = row['total_kalori_harian'] - row['tdee']
        if surplus > 200:
            faktor = f"Kelebihan {surplus} kkal"
        elif surplus < -200:
            faktor = f"Defisit {abs(surplus)} kkal"
        else:
            faktor = "Seimbang"
        username = row['email'].split('@')[0]
        items.append({
            'id': row['id'],
            'user_name': username,
            'bmi': bmi,
            'risk_level': row['risk_level'],
            'faktor_utama': faktor,
            'tanggal': row['tanggal'].isoformat()
        })
    return jsonify({'status': 'success', 'data': items})

# ========== NEW ENDPOINT: Detail konsultasi berdasarkan ID ==========
@admin_bp.route('/api/admin/consultations/<int:consultation_id>', methods=['GET'])
@admin_required
def get_consultation_detail(consultation_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT h.*, u.email, u.nama
        FROM hasil_analisis h
        JOIN users u ON h.user_id = u.id
        WHERE h.id = %s
    """, (consultation_id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return jsonify({'status': 'error', 'message': 'Data tidak ditemukan'}), 404

    # Hitung BMI
    bmi = None
    if row['weight_kg'] and row['height_cm']:
        bmi = row['weight_kg'] / ((row['height_cm'] / 100) ** 2)
        bmi = round(bmi, 1)

    # Parse JSON fields jika ada
    try:
        recommendations = json.loads(row['recommendations']) if row['recommendations'] else []
    except (json.JSONDecodeError, TypeError):
        recommendations = row['recommendations'] or []
    try:
        trace = json.loads(row['trace']) if row['trace'] else []
    except (json.JSONDecodeError, TypeError):
        trace = row['trace'] or []

    surplus = (row['total_kalori_harian'] or 0) - (row['tdee'] or 0)

    return jsonify({
        'status': 'success',
        'data': {
            'id': row['id'],
            'user_id': row['user_id'],
            'nama': row.get('nama', ''),
            'email': row['email'],
            'tanggal': row['tanggal'].isoformat() if row['tanggal'] else None,
            'weight_kg': row['weight_kg'],
            'height_cm': row['height_cm'],
            'bmi': bmi,
            'usia': row['usia'],
            'jenis_kelamin': row['jenis_kelamin'],
            'total_kalori_harian': row['total_kalori_harian'],
            'total_lemak_harian': row['total_lemak_harian'],
            'total_karbohidrat_harian': row['total_karbohidrat_harian'],
            'aktivitas_menit_per_minggu': row['aktivitas_menit_per_minggu'],
            'intensitas_aktivitas': row['intensitas_aktivitas'],
            'tdee': row['tdee'],
            'surplus_kalori': surplus,
            'risk_level': row['risk_level'],
            'explanation': row['explanation'],
            'recommendations': recommendations,
            'education_material': row['education_material'],
            'trace': trace
        }
    
    })