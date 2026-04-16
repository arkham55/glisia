# backend/routes/edukasi.py
from flask import Blueprint, request, jsonify
from backend.utils.db_helper import get_db_connection

edukasi_bp = Blueprint('edukasi', __name__)

@edukasi_bp.route('/api/edukasi', methods=['GET'])
def get_edukasi():
    """Ambil semua materi edukasi, bisa filter by kategori."""
    kategori = request.args.get('kategori')
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if kategori:
        cursor.execute("SELECT id, kategori, judul, konten FROM edukasi WHERE kategori = %s", (kategori,))
    else:
        cursor.execute("SELECT id, kategori, judul, konten FROM edukasi")
    
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({'status': 'success', 'data': rows}), 200

@edukasi_bp.route('/api/edukasi/<int:id>', methods=['GET'])
def get_edukasi_detail(id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, kategori, judul, konten FROM edukasi WHERE id = %s", (id,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if row:
        return jsonify({'status': 'success', 'data': row}), 200
    else:
        return jsonify({'error': 'Materi tidak ditemukan'}), 404