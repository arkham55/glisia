# engine/inference_engine.py
import json
import os

class GlisiaInferenceEngine:
    def __init__(self, rules_file=None):
        if rules_file is None:
            # Cari file rules.json di folder yang sama
            base_dir = os.path.dirname(os.path.abspath(__file__))
            rules_file = os.path.join(base_dir, "rules.json")
        
        with open(rules_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        self.rules = data["rules"]
        self.default_conclusion = data["default_conclusion"]
        self.default_explanation = data["default_explanation"]
        
        # Urutkan aturan berdasarkan prioritas (1 = tertinggi)
        self.rules.sort(key=lambda r: r.get("priority", 999))
        
        # Simpan trace untuk penjelasan
        self.trace = []
    
    def infer(self, facts: dict):
        self.trace = []  # reset trace
        matched_rule = None
        
        for rule in self.rules:
            match = True
            for cond_key, cond_value in rule["conditions"].items():
                if facts.get(cond_key) != cond_value:
                    match = False
                    break
            if match:
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
        else:
            self.trace.append({"info": "Tidak ada aturan cocok, menggunakan default"})
            return {
                "risk_level": self.default_conclusion,
                "explanation": self.default_explanation,
                "matched_rule_id": None,
                "trace": self.trace.copy()
            }