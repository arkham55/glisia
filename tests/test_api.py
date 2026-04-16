import requests
import json

url = "http://localhost:5000/api/analyze"
data = {
    "weight_kg": 70,
    "height_cm": 160,
    "gula_gram_per_hari": 40,
    "frekuensi_minuman_per_hari": 1,
    "karbohidrat_porsi_per_hari": 5,
    "lemak_gram_per_hari": 60,
    "aktivitas_menit_per_minggu": 120,
    "user_id": "test001"
}

response = requests.post(url, json=data)
print("Status:", response.status_code)
print("Response:", json.dumps(response.json(), indent=2, ensure_ascii=False))