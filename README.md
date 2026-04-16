# GLISIA - Sistem Pakar Analisis Risiko Konsumsi Gula

GLISIA (Gula & Metabolik Intelligent System Analyzer) adalah sistem pakar berbasis aturan (forward chaining) untuk menganalisis risiko konsumsi gula berlebih. Sistem ini mempertimbangkan asupan gula harian, frekuensi minuman manis, konsumsi karbohidrat, lemak, aktivitas fisik, dan BMI.

## Fitur
- Mesin inferensi forward chaining dengan prioritas aturan
- Basis pengetahuan dalam JSON (mudah diedit)
- Rekomendasi solusi sesuai pakar kesehatan
- Database makanan & minuman dengan kandungan gula
- REST API dengan Flask
- Frontend interaktif (dalam pengembangan)

## Teknologi
- Backend: Flask, MySQL
- Frontend: HTML, CSS, JavaScript
- Engine: Python murni

## Cara Menjalankan
1. Clone repositori
2. Buat virtual environment: `python -m venv venv`
3. Aktifkan: `venv\Scripts\activate` (Windows)
4. Install: `pip install -r requirements.txt`
5. Buat database MySQL: `glisia_db`
6. Jalankan: `python -m backend.app`

## Lisensi
MIT
