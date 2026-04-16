# backend/app.py
from flask import Flask, jsonify
from flask_cors import CORS
from backend.config import Config
from backend.utils.db_helper import init_db
from backend.routes.analyze import analyze_bp
from backend.routes.edukasi import edukasi_bp
from backend.routes.makanan import makanan_bp  # <-- tambah ini

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Inisialisasi database saat startup
init_db()

# Register blueprint
app.register_blueprint(analyze_bp)
app.register_blueprint(edukasi_bp)
app.register_blueprint(makanan_bp)  # <-- tambah ini

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'message': 'GLISIA backend running'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)