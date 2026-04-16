from flask import Blueprint, request, jsonify
from backend.utils.db_helper import get_db_connection

makanan_bp = Blueprint('makanan', __name__)

@makanan_bp.route('/api/makanan', methods=['GET'])
def cari_makanan():
    """Endpoint untuk mencari makanan/minuman berdasarkan nama (query parameter ?q=...)"""
    query = request.args.get('q', '')
    if not query:
        return jsonify({'status': 'error', 'message': 'Parameter q diperlukan'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = "SELECT id, nama, kategori, gula_gram, satuan FROM makanan WHERE nama LIKE %s LIMIT 20"
    cursor.execute(sql, (f'%{query}%',))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({'status': 'success', 'data': results})

@makanan_bp.route('/api/hitung-gula', methods=['POST'])
def hitung_gula():
    """Endpoint untuk menghitung total gula dari daftar makanan yang dipilih (items: [{id, jumlah}])"""
    data = request.get_json()
    items = data.get('items', [])
    if not items:
        return jsonify({'status': 'error', 'message': 'items tidak boleh kosong'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    total = 0
    rincian = []
    for item in items:
        cursor.execute("SELECT id, nama, gula_gram, satuan FROM makanan WHERE id = %s", (item['id'],))
        makanan = cursor.fetchone()
        if makanan:
            jumlah = item.get('jumlah', 1)
            subtotal = makanan['gula_gram'] * jumlah
            total += subtotal
            rincian.append({
                'id': makanan['id'],
                'nama': makanan['nama'],
                'gula_gram': subtotal,
                'jumlah': jumlah,
                'satuan': makanan['satuan']
            })
    cursor.close()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'data': {
            'total_gula_gram': total,
            'rincian': rincian
        }
    })