from flask import Blueprint, request, jsonify
from backend.utils.db_helper import get_db_connection
from datetime import datetime
import json

riwayat_bp = Blueprint('riwayat', __name__)


def get_user_id_from_token(token):
    import jwt
    from backend.config import Config
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload.get('user_id')
    except Exception:
        return None


def compute_bmi(weight_kg, height_cm):
    if not height_cm or height_cm == 0:
        return 0
    return round(weight_kg / ((height_cm / 100) ** 2), 1)


def bmi_category(bmi):
    if bmi < 18.5:
        return "Kurang"
    elif bmi < 23:
        return "Normal"
    elif bmi < 25:
        return "Overweight"
    else:
        return "Obesitas"


RISK_ORDER = {"rendah": 1, "sedang": 2, "tinggi": 3}


def compute_trend(current_risk, previous_risk):
    curr = RISK_ORDER.get((current_risk or "").lower(), 0)
    prev = RISK_ORDER.get((previous_risk or "").lower(), 0)
    if prev == 0:
        return "baru"
    if curr < prev:
        return "membaik"
    if curr > prev:
        return "memburuk"
    return "stabil"


def safe_json(value):
    """Parse JSON string, jika gagal atau hasil bukan list, kembalikan list kosong (untuk trace)"""
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            # Untuk trace, pastikan berupa list; jika tidak, kembalikan list kosong
            if isinstance(parsed, list):
                return parsed
            else:
                return []
        except Exception:
            return []
    elif isinstance(value, list):
        return value
    else:
        return []


# ==================== SUMMARY ====================
@riwayat_bp.route('/api/riwayat/summary', methods=['GET'])
def get_riwayat_summary():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) as total FROM hasil_analisis WHERE user_id = %s", (user_id,))
    total = cursor.fetchone()['total']

    cursor.execute("""
        SELECT AVG(weight_kg / POW(height_cm/100, 2)) AS avg_bmi,
               AVG(total_kalori_harian) AS avg_kalori,
               AVG(tdee) AS avg_tdee
        FROM hasil_analisis WHERE user_id = %s
    """, (user_id,))
    agg = cursor.fetchone()
    avg_bmi = round(agg['avg_bmi'] or 0, 1)
    avg_kalori = round(agg['avg_kalori'] or 0)
    avg_tdee = round(agg['avg_tdee'] or 0)

    cursor.execute("""
        SELECT risk_level, tanggal FROM hasil_analisis
        WHERE user_id = %s ORDER BY tanggal DESC LIMIT 1
    """, (user_id,))
    last = cursor.fetchone()
    last_risk = last['risk_level'] if last else '-'
    last_date = last['tanggal'].strftime('%d %b %Y') if last and last['tanggal'] else '-'

    cursor.execute("""
        SELECT risk_level FROM hasil_analisis
        WHERE user_id = %s ORDER BY tanggal DESC LIMIT 3
    """, (user_id,))
    recent = [r['risk_level'] for r in cursor.fetchall()]
    overall_trend = "stabil"
    if len(recent) >= 2:
        overall_trend = compute_trend(recent[0], recent[1])

    cursor.close()
    conn.close()

    return jsonify({
        'status': 'success',
        'data': {
            'total_analisis': total,
            'avg_bmi': avg_bmi,
            'bmi_category': bmi_category(avg_bmi),
            'avg_kalori': avg_kalori,
            'avg_tdee': avg_tdee,
            'last_risk': last_risk,
            'last_date': last_date,
            'overall_trend': overall_trend
        }
    })


# ==================== LIST DENGAN SORTING & FILTER ====================
@riwayat_bp.route('/api/riwayat/list', methods=['GET'])
def get_riwayat_list():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 401

    page = max(int(request.args.get('page', 1)), 1)
    limit = min(int(request.args.get('limit', 10)), 50)
    search = request.args.get('search', '').strip()
    sort_by = request.args.get('sort_by', 'terbaru')
    risk_filter = request.args.get('risk_filter', 'semua')
    offset = (page - 1) * limit

    sort_map = {
        'terbaru': 'tanggal DESC',
        'terlama': 'tanggal ASC',
        'bmi_tertinggi': 'bmi DESC',
        'bmi_terendah': 'bmi ASC',
        'risiko_tertinggi': 'risk_order DESC',
        'risiko_terendah': 'risk_order ASC'
    }
    order_clause = sort_map.get(sort_by, 'tanggal DESC')

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    base_query = """
        SELECT 
            id, tanggal,
            weight_kg, height_cm, usia, jenis_kelamin,
            total_kalori_harian, total_lemak_harian, total_karbohidrat_harian,
            aktivitas_menit_per_minggu, intensitas_aktivitas,
            tdee, risk_level,
            explanation, recommendations, education_material, trace,
            (weight_kg / POW(height_cm/100, 2)) AS bmi,
            CASE 
                WHEN LOWER(risk_level) = 'tinggi' THEN 3
                WHEN LOWER(risk_level) = 'sedang' THEN 2
                WHEN LOWER(risk_level) = 'rendah' THEN 1
                ELSE 0
            END AS risk_order
        FROM hasil_analisis
        WHERE user_id = %s
    """
    params = [user_id]

    if search:
        base_query += " AND (DATE_FORMAT(tanggal,'%%d %%M %%Y') LIKE %s OR risk_level LIKE %s OR explanation LIKE %s)"
        sp = f"%{search}%"
        params.extend([sp, sp, sp])

    if risk_filter.lower() != 'semua':
        base_query += " AND LOWER(risk_level) = %s"
        params.append(risk_filter.lower())

    cursor.execute(f"SELECT COUNT(*) as total FROM ({base_query}) AS t", params)
    total = cursor.fetchone()['total']

    final_query = f"{base_query} ORDER BY {order_clause} LIMIT %s OFFSET %s"
    cursor.execute(final_query, params + [limit, offset])
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    conn2 = get_db_connection()
    cursor2 = conn2.cursor(dictionary=True)
    cursor2.execute(
        "SELECT id, risk_level FROM hasil_analisis WHERE user_id = %s ORDER BY tanggal DESC",
        (user_id,)
    )
    all_risk = cursor2.fetchall()
    risk_map = {r['id']: r['risk_level'] for r in all_risk}
    id_list = [r['id'] for r in all_risk]
    cursor2.close()
    conn2.close()

    items = []
    for row in rows:
        try:
            idx = id_list.index(row['id'])
        except ValueError:
            idx = -1
        prev_id = id_list[idx + 1] if idx + 1 < len(id_list) else None
        prev_risk = risk_map.get(prev_id) if prev_id else None

        bmi_raw = row['bmi']
        bmi_rounded = round(bmi_raw, 1)
        kalori = row['total_kalori_harian'] or 0
        tdee = row['tdee'] or 0
        surplus = round(kalori - tdee)

        faktor_parts = []
        if kalori:
            faktor_parts.append(f"Kalori {round(kalori)} kkal")
        if row['total_lemak_harian']:
            faktor_parts.append(f"Lemak {round(row['total_lemak_harian'])}g")
        if row['total_karbohidrat_harian']:
            faktor_parts.append(f"Karbo {round(row['total_karbohidrat_harian'])}g")

        # Proses trace agar selalu berupa list of objects
        trace_data = safe_json(row['trace'])

        items.append({
            'id': row['id'],
            'tanggal': row['tanggal'].strftime('%d %b %Y %H:%M') if row['tanggal'] else '-',
            'bmi': bmi_rounded,
            'bmi_category': bmi_category(bmi_rounded),
            'weight_kg': row['weight_kg'],
            'height_cm': row['height_cm'],
            'usia': row['usia'],
            'jenis_kelamin': row['jenis_kelamin'],
            'kalori': round(kalori),
            'lemak': round(row['total_lemak_harian'] or 0),
            'karbohidrat': round(row['total_karbohidrat_harian'] or 0),
            'aktivitas_menit': row['aktivitas_menit_per_minggu'],
            'intensitas': row['intensitas_aktivitas'],
            'tdee': round(tdee),
            'surplus_kalori': surplus,
            'risk_level': row['risk_level'] or '-',
            'faktor_utama': ' · '.join(faktor_parts),
            'tren': compute_trend(row['risk_level'], prev_risk),
            'explanation': row['explanation'] or '',
            'recommendations': safe_json(row['recommendations']),  # untuk recommendations juga aman
            'education_material': row['education_material'] or '',
            'trace': trace_data,
        })

    return jsonify({
        'status': 'success',
        'data': {
            'items': items,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': (total + limit - 1) // limit if total > 0 else 1
        }
    })


# ==================== DETAIL ====================
@riwayat_bp.route('/api/riwayat/<int:record_id>', methods=['GET'])
def get_riwayat_detail(record_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(
        "SELECT * FROM hasil_analisis WHERE id = %s AND user_id = %s",
        (record_id, user_id)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()

    if not row:
        return jsonify({'status': 'error', 'message': 'Data tidak ditemukan'}), 404

    bmi = compute_bmi(row['weight_kg'], row['height_cm'])
    # Pastikan trace di detail juga valid
    trace_data = safe_json(row['trace'])

    return jsonify({
        'status': 'success',
        'data': {
            **{k: (v.isoformat() if isinstance(v, datetime) else v) for k, v in row.items()},
            'bmi': bmi,
            'bmi_category': bmi_category(bmi),
            'surplus_kalori': round((row['total_kalori_harian'] or 0) - (row['tdee'] or 0)),
            'recommendations': safe_json(row['recommendations']),
            'education_material': row['education_material'] or '',
            'trace': trace_data,
        }
    })


# ==================== DELETE ====================
@riwayat_bp.route('/api/riwayat/<int:record_id>', methods=['DELETE'])
def delete_riwayat(record_id):
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM hasil_analisis WHERE id = %s AND user_id = %s",
        (record_id, user_id)
    )
    affected = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()

    if affected == 0:
        return jsonify({'status': 'error', 'message': 'Data tidak ditemukan'}), 404
    return jsonify({'status': 'success', 'message': 'Data berhasil dihapus'})

# ==================== DELETE ALL ====================
@riwayat_bp.route('/api/riwayat/delete-all', methods=['DELETE'])
def delete_all_riwayat():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 401

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM hasil_analisis WHERE user_id = %s",
        (user_id,)
    )
    affected = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 'success', 'message': f'Berhasil menghapus {affected} data riwayat'})