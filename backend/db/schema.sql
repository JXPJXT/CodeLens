CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    prediction REAL NOT NULL,
    correct INTEGER NOT NULL,
    user_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    language TEXT,
    latency_ms REAL,
    risk_score REAL,
    mode TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
