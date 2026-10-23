"""Database persistence layer for NationOS.

Provides connection to Supabase (PostgreSQL) with automatic fallback
to an embedded SQLite datastore when cloud credentials are unconfigured.
"""

import os
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

# Read Supabase environment credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = (
    os.environ.get("SUPABASE_KEY")
    or os.environ.get("SUPABASE_ANON_KEY")
    or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    or ""
).strip()

_supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[Database] Successfully connected to Supabase PostgreSQL.")
    except Exception as exc:
        print(f"[Database] Warning: Supabase client initialization failed: {exc}. Using local storage.")
        _supabase_client = None
else:
    print("[Database] Supabase credentials not detected. Initializing local database.")

# Ensure local data directory exists
LOCAL_DB_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(LOCAL_DB_DIR, exist_ok=True)
LOCAL_DB_PATH = os.path.join(LOCAL_DB_DIR, "nationos.db")


def _init_local_db():
    """Create local SQLite tables if they do not exist."""
    with sqlite3.connect(LOCAL_DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                fiscal_year INTEGER NOT NULL,
                budget_amount REAL NOT NULL,
                allocations TEXT NOT NULL,
                original_allocations TEXT,
                tradeoffs TEXT,
                assumptions TEXT,
                risks TEXT,
                status TEXT NOT NULL,
                reviewed INTEGER NOT NULL DEFAULT 0,
                reason TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint TEXT NOT NULL,
                query_text TEXT,
                response_text TEXT,
                timestamp TEXT NOT NULL
            )
        """)
        conn.commit()


_init_local_db()


def save_decision(decision: Dict[str, Any]) -> Dict[str, Any]:
    """Persist a budget decision record to Supabase or local SQLite."""
    now_iso = datetime.now(timezone.utc).isoformat()
    record_id = decision.get("id") or f"DEC-{int(datetime.now().timestamp())}"
    
    payload = {
        "id": record_id,
        "title": decision.get("title", "Untitled Proposal"),
        "fiscal_year": int(decision.get("fiscalYear", decision.get("fiscal_year", 2026))),
        "budget_amount": float(decision.get("budgetAmount", decision.get("budget_amount", 0.0))),
        "allocations": json.dumps(decision.get("allocations", {})),
        "original_allocations": json.dumps(decision.get("originalAllocations", decision.get("allocations", {}))),
        "tradeoffs": json.dumps(decision.get("tradeoffs", [])),
        "assumptions": json.dumps(decision.get("assumptions", [])),
        "risks": json.dumps(decision.get("risks", [])),
        "status": decision.get("status", "Draft"),
        "reviewed": 1 if decision.get("reviewed") else 0,
        "reason": decision.get("reason", ""),
        "created_at": decision.get("createdAt", now_iso),
        "updated_at": now_iso,
    }

    if _supabase_client:
        try:
            res = _supabase_client.table("decisions").upsert(payload).execute()
            if res.data:
                return res.data[0]
        except Exception as exc:
            print(f"[Database] Supabase write error: {exc}. Falling back to local storage.")

    # Local fallback
    with sqlite3.connect(LOCAL_DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO decisions 
            (id, title, fiscal_year, budget_amount, allocations, original_allocations,
             tradeoffs, assumptions, risks, status, reviewed, reason, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            payload["id"], payload["title"], payload["fiscal_year"], payload["budget_amount"],
            payload["allocations"], payload["original_allocations"], payload["tradeoffs"],
            payload["assumptions"], payload["risks"], payload["status"], payload["reviewed"],
            payload["reason"], payload["created_at"], payload["updated_at"]
        ))
        conn.commit()

    return {
        "id": payload["id"],
        "title": payload["title"],
        "fiscalYear": payload["fiscal_year"],
        "budgetAmount": payload["budget_amount"],
        "allocations": json.loads(payload["allocations"]),
        "originalAllocations": json.loads(payload["original_allocations"]),
        "tradeoffs": json.loads(payload["tradeoffs"]),
        "assumptions": json.loads(payload["assumptions"]),
        "risks": json.loads(payload["risks"]),
        "status": payload["status"],
        "reviewed": bool(payload["reviewed"]),
        "reason": payload["reason"],
        "createdAt": payload["created_at"],
        "updatedAt": payload["updated_at"],
    }


def list_decisions(limit: int = 50, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve saved decision records."""
    if _supabase_client:
        try:
            q = _supabase_client.table("decisions").select("*").order("created_at", desc=True).limit(limit)
            if status:
                q = q.eq("status", status)
            res = q.execute()
            if res.data:
                return res.data
        except Exception as exc:
            print(f"[Database] Supabase read error: {exc}. Falling back to local.")

    # Local SQLite read
    records = []
    with sqlite3.connect(LOCAL_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        if status:
            cursor.execute(
                "SELECT * FROM decisions WHERE status = ? ORDER BY created_at DESC LIMIT ?",
                (status, limit)
            )
        else:
            cursor.execute(
                "SELECT * FROM decisions ORDER BY created_at DESC LIMIT ?",
                (limit,)
            )
        for row in cursor.fetchall():
            records.append({
                "id": row["id"],
                "title": row["title"],
                "fiscalYear": row["fiscal_year"],
                "budgetAmount": row["budget_amount"],
                "allocations": json.loads(row["allocations"]),
                "originalAllocations": json.loads(row["original_allocations"] or "{}"),
                "tradeoffs": json.loads(row["tradeoffs"] or "[]"),
                "assumptions": json.loads(row["assumptions"] or "[]"),
                "risks": json.loads(row["risks"] or "[]"),
                "status": row["status"],
                "reviewed": bool(row["reviewed"]),
                "reason": row["reason"],
                "createdAt": row["created_at"],
                "updatedAt": row["updated_at"],
            })
    return records


def update_decision_status(decision_id: str, new_status: str) -> Optional[Dict[str, Any]]:
    """Update review status of a decision proposal."""
    now_iso = datetime.now(timezone.utc).isoformat()
    is_reviewed = 1 if new_status.lower() == "reviewed" else 0

    if _supabase_client:
        try:
            res = (
                _supabase_client.table("decisions")
                .update({"status": new_status, "reviewed": is_reviewed, "updated_at": now_iso})
                .eq("id", decision_id)
                .execute()
            )
            if res.data:
                return res.data[0]
        except Exception as exc:
            print(f"[Database] Supabase update error: {exc}")

    with sqlite3.connect(LOCAL_DB_PATH) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE decisions SET status = ?, reviewed = ?, updated_at = ? WHERE id = ?",
            (new_status, is_reviewed, now_iso, decision_id)
        )
        conn.commit()

    decisions = list_decisions(limit=1)
    return decisions[0] if decisions else None


def log_audit(endpoint: str, query_text: str, response_text: str):
    """Record an audit trail for citizen or analyst queries."""
    now_iso = datetime.now(timezone.utc).isoformat()
    if _supabase_client:
        try:
            _supabase_client.table("audit_logs").insert({
                "endpoint": endpoint,
                "query_text": query_text,
                "response_text": response_text[:2000],
                "timestamp": now_iso
            }).execute()
            return
        except Exception:
            pass

    try:
        with sqlite3.connect(LOCAL_DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO audit_logs (endpoint, query_text, response_text, timestamp) VALUES (?, ?, ?, ?)",
                (endpoint, query_text, response_text[:2000], now_iso)
            )
            conn.commit()
    except Exception:
        pass
