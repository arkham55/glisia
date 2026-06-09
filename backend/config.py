# backend/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_HOST = 'localhost'
    DB_USER = 'root'
    DB_PASSWORD = ''
    DB_NAME = 'glisia_db'
    SECRET_KEY = 'glisia_jwt_secret_key_2026'  # tambahkan ini