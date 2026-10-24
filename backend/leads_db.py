import sqlite3
import threading
from datetime import datetime, timezone

DB_FILE = "leads.db"
_lock = threading.Lock()


def _connect():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _lock, _connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                country TEXT NOT NULL,
                score INTEGER NOT NULL,
                is_priority INTEGER NOT NULL DEFAULT 0,
                matched_keywords TEXT DEFAULT '',
                captured_at TEXT NOT NULL
            )
        """)
        conn.commit()


def add_lead(title, country, score, is_priority, matched_keywords=None):
    matched_str = ", ".join(matched_keywords) if matched_keywords else ""
    captured_at = datetime.now(timezone.utc).isoformat()
    with _lock, _connect() as conn:
        cur = conn.execute(
            "INSERT INTO leads (title, country, score, is_priority, matched_keywords, captured_at) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (title, country, score, 1 if is_priority else 0, matched_str, captured_at),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (cur.lastrowid,)).fetchone()
        return dict(row)


def get_leads(limit=200, offset=0):
    with _lock, _connect() as conn:
        rows = conn.execute(
            "SELECT * FROM leads ORDER BY id DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(r) for r in rows]


def get_stats():
    with _lock, _connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS total, "
            "SUM(is_priority) AS priority_count, "
            "AVG(score) AS avg_score "
            "FROM leads"
        ).fetchone()
        total = row["total"] or 0
        priority_count = row["priority_count"] or 0
        avg_score = round(row["avg_score"], 1) if row["avg_score"] else 0
        return {"total": total, "priority_count": priority_count, "avg_score": avg_score}


def clear_leads():
    with _lock, _connect() as conn:
        conn.execute("DELETE FROM leads")
        conn.commit()
