import json
import os

class GlisiaInferenceEngine:
    def __init__(self, rules_file=None):
        if rules_file is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            rules_file = os.path.join(base_dir, "rules.json")
        
        with open(rules_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.rules = data["rules"]
        self.default_conclusion = data["default_conclusion"]
        self.default_explanation = data["default_explanation"]
        
        # Urutkan berdasarkan prioritas (1 = tertinggi)
        self.rules.sort(key=lambda r: r.get("priority", 999))
        self.trace = []
    
    def infer(self, facts: dict):
        self.trace = []
        matched_rule = None
        
        # Cari aturan yang cocok
        for rule in self.rules:
            if self._match_rule(rule, facts):
                matched_rule = rule
                break
        
        if matched_rule:
            self.trace.append({
                "rule_id": matched_rule["id"],
                "priority": matched_rule["priority"],
                "conditions": matched_rule["conditions"],
                "conclusion": matched_rule["conclusion"]
            })
            return {
                "risk_level": matched_rule["conclusion"],
                "explanation": matched_rule["explanation"],
                "matched_rule_id": matched_rule["id"],
                "trace": self.trace.copy()
            }
        
        # --- FALLBACK CERDAS BERDASARKAN BMI ---
        bmi = facts.get("bmi")
        if bmi == "underweight":
            risk = "sedang"
            explanation = "Berat badan kurang (underweight). Perhatikan asupan nutrisi untuk mencapai berat badan ideal. Konsultasikan dengan ahli gizi."
        elif bmi == "normal":
            risk = "sedang"
            explanation = "Indeks Massa Tubuh normal. Pertahankan pola makan seimbang, perbanyak aktivitas fisik, dan lakukan pemeriksaan kesehatan berkala."
        elif bmi == "overweight":
            risk = "sedang"
            explanation = "Berat badan lebih (overweight). Lakukan diet sehat dengan defisit kalori terkontrol dan tingkatkan aktivitas fisik secara teratur."
        elif bmi == "obesitas":
            risk = "tinggi"
            explanation = "Obesitas meningkatkan risiko metabolik serius seperti diabetes tipe 2, penyakit jantung, dan sindrom metabolik. Segera konsultasi ke dokter atau ahli gizi."
        else:
            # Jika tidak ada BMI, gunakan default
            risk = self.default_conclusion
            explanation = self.default_explanation
        
        self.trace.append({
            "info": f"Tidak ada aturan yang cocok. Menggunakan fallback berdasarkan BMI: {facts.get('bmi', 'tidak diketahui')}"
        })
        return {
            "risk_level": risk,
            "explanation": explanation,
            "matched_rule_id": None,
            "trace": self.trace.copy()
        }
    
    def _match_rule(self, rule, facts):
        """Cek apakah semua kondisi rule terpenuhi oleh facts."""
        for cond_key, cond_value in rule["conditions"].items():
            if facts.get(cond_key) != cond_value:
                return False
        return True