from flask import Blueprint, request, jsonify
from backend.utils.db_helper import get_db_connection

makanan_bp = Blueprint('makanan', __name__)

@makanan_bp.route('/api/makanan', methods=['GET'])
def cari_makanan():
    query = request.args.get('q', '')
    if not query:
        return jsonify({'status': 'error', 'message': 'Parameter q diperlukan'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = "SELECT id, name, calories, fat, carbohydrate FROM foods WHERE name LIKE %s LIMIT 50"
    cursor.execute(sql, (f'%{query}%',))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return jsonify({'status': 'success', 'data': results})

@makanan_bp.route('/api/hitung-nutrisi', methods=['POST'])
def hitung_nutrisi():
    data = request.get_json()
    items = data.get('items', [])
    if not items:
        return jsonify({'status': 'error', 'message': 'items tidak boleh kosong'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    total_kalori = 0.0
    total_lemak = 0.0
    total_karbohidrat = 0.0
    
    for item in items:
        food_id = item.get('id')
        gram = item.get('gram', 100)
        cursor.execute("SELECT calories, fat, carbohydrate FROM foods WHERE id = %s", (food_id,))
        food = cursor.fetchone()
        if food:
            faktor = gram / 100.0
            total_kalori += food['calories'] * faktor
            total_lemak += food['fat'] * faktor
            total_karbohidrat += food['carbohydrate'] * faktor
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'status': 'success',
        'data': {
            'total_calories': round(total_kalori, 2),
            'total_fat': round(total_lemak, 2),
            'total_carbohydrate': round(total_karbohidrat, 2)
        }
    })

@makanan_bp.route('/api/makanan/populer', methods=['GET'])
def makanan_populer():
    """Ambil 8 makanan/minuman secara acak untuk quick add di landing page."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Mengambil 8 data acak (ORDER BY RAND())
    # Jika ingin data tetap (misal 8 pertama), ganti dengan ORDER BY id LIMIT 8
    cursor.execute("SELECT id, name, calories, fat, carbohydrate FROM foods ORDER BY RAND() LIMIT 8")
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify({'status': 'success', 'data': results})