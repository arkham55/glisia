from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from backend.config import Config
from backend.utils.db_helper import init_db
from backend.routes.analyze import analyze_bp
from backend.routes.edukasi import edukasi_bp
from backend.routes.makanan import makanan_bp
from backend.routes.auth import auth_bp
from backend.routes.edukasi_admin import edukasi_admin_bp
from backend.routes.riwayat import riwayat_bp
from backend.routes.admin import admin_bp          # ✅ Import blueprint admin
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
frontend_dir = os.path.join(base_dir, 'frontend')

app = Flask(__name__, static_folder=frontend_dir, static_url_path='')
app.config.from_object(Config)
app.config['SECRET_KEY'] = Config.SECRET_KEY

# ✅ CORS – tambahkan semua origin yang diperlukan
CORS(app, origins=[
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:5002',
    'http://127.0.0.1:5002',
    'http://192.168.100.23:5002',
    'http://192.168.18.227:5002'   # tambahkan jika perlu
], supports_credentials=True)

init_db()

# Daftarkan semua blueprint
app.register_blueprint(analyze_bp)
app.register_blueprint(edukasi_bp)
app.register_blueprint(makanan_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(edukasi_admin_bp)
app.register_blueprint(riwayat_bp)
app.register_blueprint(admin_bp)                  # ✅ Daftarkan blueprint admin

@app.route('/')
def index():
    return send_from_directory(frontend_dir, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(frontend_dir, path)

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'message': 'GLISIA backend running'})

if __name__ == '__main__':
    port = 5002
    print(f"Frontend directory: {frontend_dir}")
    app.run(debug=True, host='0.0.0.0', port=port)