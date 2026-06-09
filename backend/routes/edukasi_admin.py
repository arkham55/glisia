import jwt
from functools import wraps
from flask import Blueprint, request, jsonify, current_app
from backend.utils.db_helper import get_db_connection

edukasi_admin_bp = Blueprint('edukasi_admin', __name__, url_prefix='/api/admin')

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'status': 'error', 'message': 'Missing token'}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({'status': 'error', 'message': 'Invalid token format'}), 401

        token = parts[1]
        try:
            secret_key = current_app.config.get('SECRET_KEY')
            if not secret_key:
                secret_key = 'rahasia_default_ganti'

            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            if payload.get('role') != 'admin':
                return jsonify({'status': 'error', 'message': 'Admin only'}), 403

            request.user_id = payload.get('user_id')
            request.user_email = payload.get('email')

        except jwt.ExpiredSignatureError:
            return jsonify({'status': 'error', 'message': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'status': 'error', 'message': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated


@edukasi_admin_bp.route('/edukasi', methods=['GET'])
@admin_required
def get_all_edukasi():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id, kategori, judul, subtitle, sumber, gambar_url, created_at, views
        FROM edukasi 
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({'status': 'success', 'data': rows}), 200


@edukasi_admin_bp.route('/edukasi/<int:id>', methods=['GET'])
@admin_required
def get_edukasi_by_id(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM edukasi WHERE id = %s", (id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return jsonify({'status': 'success', 'data': row}), 200
    return jsonify({'status': 'error', 'message': 'Materi tidak ditemukan'}), 404


@edukasi_admin_bp.route('/edukasi', methods=['POST'])
@admin_required
def create_edukasi():
    data = request.get_json()
    required = ['kategori', 'judul', 'konten']
    for field in required:
        if not data.get(field):
            return jsonify({'status': 'error', 'message': f'Field {field} diperlukan'}), 400

    kategori = data['kategori']
    judul = data['judul']
    subtitle = data.get('subtitle', '')
    konten = data['konten']
    sumber = data.get('sumber', '')
    gambar = data.get('gambar_url', None)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO edukasi (kategori, judul, subtitle, konten, sumber, gambar_url, views)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (kategori, judul, subtitle, konten, sumber, gambar, 0))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Materi berhasil ditambahkan', 'id': new_id}), 201


@edukasi_admin_bp.route('/edukasi/<int:id>', methods=['PUT'])
@admin_required
def update_edukasi(id):
    data = request.get_json()
    if not data.get('judul') or not data.get('konten'):
        return jsonify({'status': 'error', 'message': 'Judul dan konten harus diisi'}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE edukasi 
        SET kategori=%s, judul=%s, subtitle=%s, konten=%s, sumber=%s, gambar_url=%s
        WHERE id=%s
    """, (
        data['kategori'], data['judul'], data.get('subtitle', ''), data['konten'],
        data.get('sumber', ''), data.get('gambar_url'), id
    ))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'status': 'success', 'message': 'Materi berhasil diperbarui'}), 200


@edukasi_admin_bp.route('/edukasi/<int:id>', methods=['DELETE'])
@admin_required
def delete_edukasi(id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM edukasi WHERE id = %s", (id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    if affected:
        return jsonify({'status': 'success', 'message': 'Materi berhasil dihapus'}), 200
    return jsonify({'status': 'error', 'message': 'Materi tidak ditemukan'}), 404