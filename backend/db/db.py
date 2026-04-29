import sqlite3
from config import settings

def get_connection():
    db_path = settings.database_url.replace("sqlite:///", "")
    return sqlite3.connect(db_path)

def init_db():
    conn = get_connection()
    with open("db/schema.sql", "r") as f:
        schema = f.read()
    conn.executescript(schema)
    conn.commit()
    conn.close()

def save_feedback(code: str, prediction: float, correct: bool, user_comment: str | None = None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO feedback (code, prediction, correct, user_comment) VALUES (?, ?, ?, ?)",
        (code, prediction, int(correct), user_comment)
    )
    conn.commit()
    conn.close()

def save_log(endpoint: str, language: str, latency_ms: float, risk_score: float, mode: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO logs (endpoint, language, latency_ms, risk_score, mode) VALUES (?, ?, ?, ?, ?)",
        (endpoint, language, latency_ms, risk_score, mode)
    )
    conn.commit()
    conn.close()
