from flask import Blueprint, request, jsonify
from backend.utils.db_helper import get_db_connection

edukasi_bp = Blueprint('edukasi', __name__)

@edukasi_bp.route('/api/edukasi', methods=['GET'])
def get_edukasi():
    kategori = request.args.get('kategori')
    search = request.args.get('search')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    query = """
        SELECT id, kategori, judul, subtitle, sumber, gambar_url, created_at 
        FROM edukasi 
    """
    params = []
    conditions = []
    
    if kategori and kategori != 'semua':
        conditions.append("kategori = %s")
        params.append(kategori)
    
    if search:
        conditions.append("(judul LIKE %s OR subtitle LIKE %s)")
        params.append(f"%{search}%")
        params.append(f"%{search}%")
    
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    
    query += " ORDER BY created_at DESC"
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({'status': 'success', 'data': rows}), 200

@edukasi_bp.route('/api/edukasi/<int:id>', methods=['GET'])
def get_edukasi_detail(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, kategori, judul, subtitle, konten, sumber, gambar_url, created_at 
        FROM edukasi 
        WHERE id = %s
    """, (id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if row:
        return jsonify({'status': 'success', 'data': row}), 200
    else:
        return jsonify({'error': 'Materi tidak ditemukan'}), 404

@edukasi_bp.route('/api/edukasi/<int:id>/increment-view', methods=['POST'])
def increment_view(id):
    """Menambah jumlah views materi edukasi setiap kali diakses."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE edukasi SET views = views + 1 WHERE id = %s", (id,))
        conn.commit()
        affected = cursor.rowcount
        if affected:
            return jsonify({'status': 'success', 'message': 'View incremented'}), 200
        else:
            return jsonify({'status': 'error', 'message': 'Materi tidak ditemukan'}), 404
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@edukasi_bp.route('/api/edukasi/saran', methods=['POST'])
def kirim_saran():
    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'Data tidak valid'}), 400

    nama = data.get('nama', '')
    email = data.get('email', '')
    topik = data.get('topik', '').strip()
    deskripsi = data.get('deskripsi', '')

    if not topik:
        return jsonify({'status': 'error', 'message': 'Topik saran harus diisi'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO saran_materi (nama, email, topik, deskripsi, status)
        VALUES (%s, %s, %s, %s, 'baru')
    """, (nama, email, topik, deskripsi))
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 'success', 'message': 'Terima kasih! Saran Anda telah kami terima.'}), 201