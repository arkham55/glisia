# backend/routes/analyze.py
from flask import Blueprint, request, jsonify
import json
from engine import analyze_risk
from backend.utils.db_helper import get_db_connection

analyze_bp = Blueprint('analyze', __name__)

@analyze_bp.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    
    # Validasi field yang wajib (tanpa gula dulu, karena bisa dari total_gula_gram)
    required_fields = ['weight_kg', 'height_cm', 
                       'frekuensi_minuman_per_hari', 'karbohidrat_porsi_per_hari',
                       'lemak_gram_per_hari', 'aktivitas_menit_per_minggu']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
    
    # Ambil nilai gula: bisa dari gula_gram_per_hari atau total_gula_gram
    gula = data.get('gula_gram_per_hari')
    if gula is None and 'total_gula_gram' in data:
        gula = data['total_gula_gram']
    if gula is None:
        return jsonify({'error': 'Harus mengirim gula_gram_per_hari atau total_gula_gram'}), 400
    
    try:
        # Panggil engine
        result = analyze_risk(
            weight_kg=float(data['weight_kg']),
            height_cm=float(data['height_cm']),
            gula_gram_per_hari=float(gula),
            frekuensi_minuman_per_hari=int(data['frekuensi_minuman_per_hari']),
            karbohidrat_porsi_per_hari=int(data['karbohidrat_porsi_per_hari']),
            lemak_gram_per_hari=float(data['lemak_gram_per_hari']),
            aktivitas_menit_per_minggu=int(data['aktivitas_menit_per_minggu'])
        )
        
        # Simpan ke database (perhatikan: kita simpan nilai gula yang dipakai)
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO hasil_analisis 
            (user_id, weight_kg, height_cm, gula_gram_per_hari, frekuensi_minuman_per_hari,
             karbohidrat_porsi_per_hari, lemak_gram_per_hari, aktivitas_menit_per_minggu,
             risk_level, explanation, recommendations, education_material, trace)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            data.get('user_id', 'anonymous'),
            data['weight_kg'], data['height_cm'],
            gula,  # <-- pakai nilai gula yang sudah dipilih
            data['frekuensi_minuman_per_hari'],
            data['karbohidrat_porsi_per_hari'], data['lemak_gram_per_hari'],
            data['aktivitas_menit_per_minggu'],
            result['risk_level'], result['explanation'],
            json.dumps(result['recommendations']),
            result['education_material'],
            json.dumps(result.get('trace', []))
        ))
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data': result
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500