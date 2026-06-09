from flask import Blueprint, request, jsonify, current_app
import bcrypt
import jwt
import datetime
from backend.utils.db_helper import get_db_connection
import mysql.connector

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

def generate_token(user_id, email, role):
    payload = {
        'user_id': user_id,
        'email': email,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    return jwt.encode(payload, current_app.config['SECRET_KEY'], algorithm='HS256')

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    nama = data.get('nama', '')
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email dan password wajib diisi'}), 400
    
    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (email, password, nama, role) VALUES (%s, %s, %s, 'user')",
                       (email, hashed.decode('utf-8'), nama))
        conn.commit()
        user_id = cursor.lastrowid
        token = generate_token(user_id, email, 'user')
        return jsonify({'status': 'success', 'message': 'Registrasi berhasil', 'token': token, 'user': {'id': user_id, 'email': email, 'role': 'user'}}), 201
    except mysql.connector.IntegrityError:
        return jsonify({'status': 'error', 'message': 'Email sudah terdaftar'}), 400
    finally:
        cursor.close()
        conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'status': 'error', 'message': 'Email dan password wajib diisi'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id, email, password, nama, role FROM users WHERE email = %s", (email,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user:
        return jsonify({'status': 'error', 'message': 'Email tidak terdaftar'}), 401
    
    if bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        token = generate_token(user['id'], user['email'], user['role'])
        return jsonify({'status': 'success', 'message': 'Login berhasil', 'token': token, 'user': {'id': user['id'], 'email': user['email'], 'role': user['role']}}), 200
    else:
        return jsonify({'status': 'error', 'message': 'Password salah'}), 401

@auth_bp.route('/me', methods=['GET'])
def me():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'status': 'error', 'message': 'Token tidak ada'}), 401
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        return jsonify({'status': 'success', 'user': {'id': payload['user_id'], 'email': payload['email'], 'role': payload['role']}}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'status': 'error', 'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'status': 'error', 'message': 'Token invalid'}), 401

@auth_bp.route('/admin/check', methods=['GET'])
def admin_check():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'status': 'error', 'admin': False}), 403
    try:
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        if payload.get('role') == 'admin':
            return jsonify({'status': 'success', 'admin': True}), 200
        else:
            return jsonify({'status': 'error', 'admin': False}), 403
    except:
        return jsonify({'status': 'error', 'admin': False}), 403