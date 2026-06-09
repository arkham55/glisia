# backend/routes/analyze.py
from flask import Blueprint, request, jsonify
import json
import jwt
from engine.inference_engine import GlisiaInferenceEngine
from backend.utils.db_helper import get_db_connection
from backend.config import Config

analyze_bp = Blueprint('analyze', __name__)

inference_engine = GlisiaInferenceEngine()

def get_user_id_from_token(token):
    try:
        payload = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        return payload.get('user_id')
    except Exception:
        return None

def classify_calories(calories, tdee):
    if calories < 0.8 * tdee:
        return "rendah"
    elif calories > 1.2 * tdee:
        return "tinggi"
    else:
        return "cukup"

def classify_fat(fat_grams, total_calories, tdee):
    if total_calories <= 0:
        return "cukup"
    fat_percent = (fat_grams * 9) / total_calories * 100
    if fat_percent < 20:
        return "rendah"
    elif fat_percent > 35:
        return "tinggi"
    else:
        return "cukup"

def classify_carb(carb_grams, total_calories, tdee):
    if total_calories <= 0:
        return "cukup"
    carb_percent = (carb_grams * 4) / total_calories * 100
    if carb_percent < 45:
        return "rendah"
    elif carb_percent > 65:
        return "tinggi"
    else:
        return "cukup"

def bmi_category(bmi):
    if bmi < 18.5:
        return "underweight"
    elif bmi < 23:
        return "normal"
    elif bmi < 25:
        return "overweight"
    else:
        return "obesitas"

def get_activity_category(intensitas):
    return intensitas.lower()

def get_tdee(weight_kg, height_cm, usia, jenis_kelamin, activity_minutes, intensity):
    if jenis_kelamin.lower() in ["pria", "laki-laki"]:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * usia + 5
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * usia - 161

    if intensity == "ringan":
        factor = 1.2
    elif intensity == "berat":
        factor = 1.725
    else:
        factor = 1.55

    if activity_minutes >= 300:
        factor = min(factor * 1.05, 1.9)
    elif activity_minutes <= 60:
        factor = max(factor * 0.95, 1.2)

    tdee = bmr * factor
    return round(tdee)

@analyze_bp.route('/api/analyze', methods=['POST'])
def analyze():
    # Autentikasi
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 401
    user_id = get_user_id_from_token(token)
    if not user_id:
        return jsonify({'status': 'error', 'message': 'Invalid token'}), 401

    data = request.get_json()
    if not data:
        return jsonify({'status': 'error', 'message': 'Invalid JSON'}), 400

    required_fields = [
        'weight_kg', 'height_cm', 'usia', 'jenis_kelamin',
        'total_kalori_harian', 'total_lemak_harian', 'total_karbohidrat_harian',
        'aktivitas_menit_per_minggu', 'intensitas_aktivitas'
    ]
    for field in required_fields:
        if field not in data:
            return jsonify({'status': 'error', 'message': f'Missing field: {field}'}), 400

    try:
        weight = float(data['weight_kg'])
        height = float(data['height_cm'])
        usia = int(data['usia'])
        jenis_kelamin = data['jenis_kelamin'].lower()
        total_kalori = float(data['total_kalori_harian'])
        total_lemak = float(data['total_lemak_harian'])
        total_karbohidrat = float(data['total_karbohidrat_harian'])
        aktivitas_menit = int(data['aktivitas_menit_per_minggu'])
        intensitas = data['intensitas_aktivitas'].lower()
        selected_activities = data.get('selected_activities', [])  # opsional, tidak digunakan

        # Validasi
        if any(x <= 0 for x in [weight, height, usia, total_kalori, total_lemak, total_karbohidrat, aktivitas_menit]):
            return jsonify({'status': 'error', 'message': 'Nilai harus positif'}), 400
        if jenis_kelamin not in ['pria', 'laki-laki', 'wanita', 'perempuan']:
            return jsonify({'status': 'error', 'message': 'Jenis kelamin tidak valid'}), 400
        if intensitas not in ['ringan', 'sedang', 'berat']:
            return jsonify({'status': 'error', 'message': 'Intensitas tidak valid'}), 400

        # Hitung BMI
        bmi_val = weight / ((height / 100) ** 2)
        bmi = round(bmi_val, 1)
        bmi_cat = bmi_category(bmi)

        # Hitung TDEE
        tdee = get_tdee(weight, height, usia, jenis_kelamin, aktivitas_menit, intensitas)

        # Klasifikasi
        kalori_cat = classify_calories(total_kalori, tdee)
        lemak_cat = classify_fat(total_lemak, total_kalori, tdee)
        karbo_cat = classify_carb(total_karbohidrat, total_kalori, tdee)
        aktivitas_cat = get_activity_category(intensitas)

        # Fakta untuk inferensi
        facts = {
            "bmi": bmi_cat,
            "kalori": kalori_cat,
            "lemak": lemak_cat,
            "karbohidrat": karbo_cat,
            "aktivitas": aktivitas_cat
        }

        # Jalankan inferensi
        inference_result = inference_engine.infer(facts)

        # Susun hasil (tanpa skor numerik)
        result = {
            "tdee": tdee,
            "bmi": bmi,
            "bmi_category": bmi_cat,
            "risk_level": inference_result["risk_level"],
            "explanation": inference_result["explanation"],
            "recommendations": [],
            "education_material": "Edukasi tersedia di halaman Edukasi.",
            "trace": inference_result["trace"],
            "categories": facts
        }

        # Simpan ke database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO hasil_analisis 
            (user_id, weight_kg, height_cm, usia, jenis_kelamin,
             total_kalori_harian, total_lemak_harian, total_karbohidrat_harian,
             aktivitas_menit_per_minggu, intensitas_aktivitas, tdee,
             risk_level, explanation, recommendations, education_material, trace)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (
            user_id,
            weight, height, usia, jenis_kelamin,
            total_kalori, total_lemak, total_karbohidrat,
            aktivitas_menit, intensitas,
            tdee,
            result["risk_level"],
            result["explanation"],
            json.dumps(result["recommendations"]),
            result["education_material"],
            json.dumps(result["trace"])
        ))
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            'status': 'success',
            'data': result
        }), 200

    except ValueError as ve:
        print(f"ValueError: {ve}")
        return jsonify({'status': 'error', 'message': 'Data tidak valid'}), 400
    except Exception as e:
        print(f"Unexpected error: {e}")
        return jsonify({'status': 'error', 'message': 'Terjadi kesalahan pada server'}), 500