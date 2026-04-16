# tests/test_engine.py
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from engine import analyze_risk

print("=== GLISIA ENGINE TEST (aktivitas fisik dalam menit/minggu) ===\n")

def print_result(hasil, title):
    print(f"{title}")
    print(f"Risk level: {hasil['risk_level'].upper()}")
    print(f"Explanation: {hasil['explanation']}")
    print("\nRekomendasi solusi:")
    for i, rec in enumerate(hasil['recommendations'], 1):
        print(f"  {i}. {rec}")
    print(f"\nMateri edukasi: {hasil['education_material']}")
    print("\nTrace penalaran (Forward Chaining):")
    for t in hasil.get('trace', []):
        if 'rule_id' in t:
            print(f"  - Rule {t['rule_id']} (prioritas {t['priority']}) terpicu: kondisi {t['conditions']} -> kesimpulan {t['conclusion']}")
        else:
            print(f"  - {t.get('info', '')}")
    print("-" * 60 + "\n")

# Skenario 1: Risiko Tinggi
# Aktivitas 100 menit/minggu = ringan
hasil1 = analyze_risk(
    weight_kg=85,
    height_cm=165,
    gula_gram_per_hari=70,
    frekuensi_minuman_per_hari=2,
    karbohidrat_porsi_per_hari=7,
    lemak_gram_per_hari=80,
    aktivitas_menit_per_minggu=100
)
print_result(hasil1, "1. SKENARIO RISIKO TINGGI")

# Skenario 2: Risiko Rendah
# Aktivitas 160 menit/minggu = sedang
hasil2 = analyze_risk(
    weight_kg=60,
    height_cm=170,
    gula_gram_per_hari=20,
    frekuensi_minuman_per_hari=0,
    karbohidrat_porsi_per_hari=3,
    lemak_gram_per_hari=40,
    aktivitas_menit_per_minggu=160
)
print_result(hasil2, "2. SKENARIO RISIKO RENDAH")

# Skenario 3: Risiko Sedang
# Aktivitas 120 menit/minggu = ringan, gula sedang, karbo sedang, BMI overweight
hasil3 = analyze_risk(
    weight_kg=70,
    height_cm=160,
    gula_gram_per_hari=40,
    frekuensi_minuman_per_hari=1,
    karbohidrat_porsi_per_hari=5,
    lemak_gram_per_hari=60,
    aktivitas_menit_per_minggu=120
)
print_result(hasil3, "3. SKENARIO RISIKO SEDANG")