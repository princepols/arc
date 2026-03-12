"""
Arc AI - Admin Routes
All routes protected by admin JWT (separate token with role=admin).
Prefix: /api/admin
"""

from fastapi import APIRouter, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from database import get_connection
import os

router     = APIRouter(prefix="/admin", tags=["admin"])
bearer     = HTTPBearer()
pwd_ctx    = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET    = os.getenv("JWT_SECRET", "change_this_secret")
JWT_ALGORITHM = "HS256"


# ── Admin JWT ─────────────────────────────────────────────────────────────────

def create_admin_token(username: str) -> str:
    payload = {
        "sub":      "admin",
        "username": username,
        "role":     "admin",
        "exp":      datetime.utcnow() + timedelta(hours=8),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def require_admin(credentials: HTTPAuthorizationCredentials = Security(bearer)) -> dict:
    """Dependency — rejects non-admin tokens."""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(403, "Admin access required.")
        return payload
    except JWTError:
        raise HTTPException(401, "Invalid or expired admin token.")


# ── Models ────────────────────────────────────────────────────────────────────

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class BanRequest(BaseModel):
    reason: Optional[str] = "Banned by admin"

class ResetPasswordRequest(BaseModel):
    new_password: str


# ── Helper: log activity ──────────────────────────────────────────────────────

def log_event(conn, user_id, event_type, description):
    try:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO activity_logs (user_id, event_type, description)
                VALUES (%s, %s, %s)
            """, (user_id, event_type, description))
        conn.commit()
    except Exception:
        pass


# ── Auth ──────────────────────────────────────────────────────────────────────

@router.post("/login")
def admin_login(req: AdminLoginRequest):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM users WHERE username=%s AND is_admin=1",
                (req.username.strip(),)
            )
            admin = cur.fetchone()

        if not admin:
            raise HTTPException(401, "Invalid admin credentials.")
        if not pwd_ctx.verify(req.password, admin["password"]):
            raise HTTPException(401, "Invalid admin credentials.")

        token = create_admin_token(admin["username"])
        return {"token": token, "role": "admin"}
    finally:
        conn.close()


# ── Dashboard overview ────────────────────────────────────────────────────────

@router.get("/dashboard")
def dashboard(_: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Total users
            cur.execute("SELECT COUNT(*) as cnt FROM users")
            total_users = cur.fetchone()["cnt"]

            # Banned users
            cur.execute("SELECT COUNT(*) as cnt FROM users WHERE is_banned=1")
            banned_users = cur.fetchone()["cnt"]

            # Total messages
            cur.execute("SELECT COUNT(*) as cnt FROM messages")
            total_messages = cur.fetchone()["cnt"]

            # Messages today
            cur.execute("SELECT COUNT(*) as cnt FROM messages WHERE DATE(created_at)=CURDATE()")
            messages_today = cur.fetchone()["cnt"]

            # Messages this week
            cur.execute("SELECT COUNT(*) as cnt FROM messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)")
            messages_week = cur.fetchone()["cnt"]

            # Total sessions
            cur.execute("SELECT COUNT(*) as cnt FROM chat_sessions")
            total_sessions = cur.fetchone()["cnt"]

            # New users today
            cur.execute("SELECT COUNT(*) as cnt FROM users WHERE DATE(created_at)=CURDATE()")
            new_users_today = cur.fetchone()["cnt"]

            # Messages per day for last 7 days
            cur.execute("""
                SELECT DATE(created_at) as day, COUNT(*) as cnt
                FROM messages
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                  AND role = 'user'
                GROUP BY DATE(created_at)
                ORDER BY day ASC
            """)
            daily_messages = [{"day": str(r["day"]), "count": r["cnt"]} for r in cur.fetchall()]

            # Top active users
            cur.execute("""
                SELECT u.username, u.email, COUNT(m.id) as msg_count
                FROM users u
                LEFT JOIN messages m ON m.user_id = u.id AND m.role='user'
                GROUP BY u.id
                ORDER BY msg_count DESC
                LIMIT 5
            """)
            top_users = cur.fetchall()

            # Recent suspicious activity
            cur.execute("""
                SELECT * FROM activity_logs
                WHERE event_type='suspicious'
                ORDER BY created_at DESC LIMIT 10
            """)
            alerts = cur.fetchall()
            for a in alerts:
                a["created_at"] = str(a["created_at"])

        return {
            "stats": {
                "total_users":    total_users,
                "banned_users":   banned_users,
                "total_messages": total_messages,
                "messages_today": messages_today,
                "messages_week":  messages_week,
                "total_sessions": total_sessions,
                "new_users_today":new_users_today,
            },
            "daily_messages": daily_messages,
            "top_users":      top_users,
            "alerts":         alerts,
        }
    finally:
        conn.close()


# ── Users ─────────────────────────────────────────────────────────────────────

@router.get("/users")
def list_users(search: str = "", _: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if search:
                cur.execute("""
                    SELECT u.id, u.username, u.email, u.is_banned, u.banned_at,
                           u.ban_reason, u.created_at, u.last_active,
                           COUNT(m.id) as message_count
                    FROM users u
                    LEFT JOIN messages m ON m.user_id=u.id AND m.role='user'
                    WHERE u.username LIKE %s OR u.email LIKE %s
                    GROUP BY u.id ORDER BY u.created_at DESC
                """, (f"%{search}%", f"%{search}%"))
            else:
                cur.execute("""
                    SELECT u.id, u.username, u.email, u.is_banned, u.banned_at,
                           u.ban_reason, u.created_at, u.last_active,
                           COUNT(m.id) as message_count
                    FROM users u
                    LEFT JOIN messages m ON m.user_id=u.id AND m.role='user'
                    GROUP BY u.id ORDER BY u.created_at DESC
                """)
            users = cur.fetchall()
        for u in users:
            u["created_at"]  = str(u["created_at"])
            u["last_active"] = str(u["last_active"]) if u["last_active"] else None
            u["banned_at"]   = str(u["banned_at"])   if u["banned_at"]   else None
        return users
    finally:
        conn.close()


@router.post("/users/{user_id}/ban")
def ban_user(user_id: int, req: BanRequest, _: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username FROM users WHERE id=%s", (user_id,))
            u = cur.fetchone()
            if not u: raise HTTPException(404, "User not found.")
            cur.execute("UPDATE users SET is_banned=1, banned_at=NOW(), ban_reason=%s WHERE id=%s",
                        (req.reason, user_id))
            conn.commit()
        log_event(conn, user_id, "ban", f"Banned: {req.reason}")
        return {"message": f"User {u['username']} banned."}
    finally:
        conn.close()


@router.post("/users/{user_id}/unban")
def unban_user(user_id: int, _: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, username FROM users WHERE id=%s", (user_id,))
            u = cur.fetchone()
            if not u: raise HTTPException(404, "User not found.")
            cur.execute("UPDATE users SET is_banned=0, banned_at=NULL, ban_reason=NULL WHERE id=%s", (user_id,))
            conn.commit()
        log_event(conn, user_id, "unban", "Unbanned by admin")
        return {"message": f"User {u['username']} unbanned."}
    finally:
        conn.close()


@router.delete("/users/{user_id}")
def delete_user(user_id: int, _: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT username FROM users WHERE id=%s", (user_id,))
            u = cur.fetchone()
            if not u: raise HTTPException(404, "User not found.")
            cur.execute("DELETE FROM users WHERE id=%s", (user_id,))
            conn.commit()
        return {"message": f"User {u['username']} deleted."}
    finally:
        conn.close()


@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: int, req: ResetPasswordRequest, _: dict = Depends(require_admin)):
    if len(req.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT username FROM users WHERE id=%s", (user_id,))
            u = cur.fetchone()
            if not u: raise HTTPException(404, "User not found.")
            hashed = pwd_ctx.hash(req.new_password)
            cur.execute("UPDATE users SET password=%s WHERE id=%s", (hashed, user_id))
            conn.commit()
        log_event(conn, user_id, "password_reset", "Password reset by admin")
        return {"message": f"Password reset for {u['username']}."}
    finally:
        conn.close()


# ── Conversations ─────────────────────────────────────────────────────────────

@router.get("/conversations")
def list_conversations(user_id: Optional[int] = None, _: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if user_id:
                cur.execute("""
                    SELECT cs.id, cs.title, cs.created_at, cs.updated_at,
                           u.username, COUNT(m.id) as message_count
                    FROM chat_sessions cs
                    JOIN users u ON u.id=cs.user_id
                    LEFT JOIN messages m ON m.session_id=cs.id
                    WHERE cs.user_id=%s
                    GROUP BY cs.id ORDER BY cs.updated_at DESC LIMIT 50
                """, (user_id,))
            else:
                cur.execute("""
                    SELECT cs.id, cs.title, cs.created_at, cs.updated_at,
                           u.username, COUNT(m.id) as message_count
                    FROM chat_sessions cs
                    JOIN users u ON u.id=cs.user_id
                    LEFT JOIN messages m ON m.session_id=cs.id
                    GROUP BY cs.id ORDER BY cs.updated_at DESC LIMIT 100
                """)
            sessions = cur.fetchall()
        for s in sessions:
            s["created_at"] = str(s["created_at"])
            s["updated_at"] = str(s["updated_at"])
        return sessions
    finally:
        conn.close()


@router.get("/conversations/{session_id}/messages")
def get_conversation(session_id: int, _: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT m.id, m.role, m.content, m.mode, m.created_at,
                       u.username
                FROM messages m
                JOIN users u ON u.id=m.user_id
                WHERE m.session_id=%s ORDER BY m.created_at ASC
            """, (session_id,))
            msgs = cur.fetchall()
        for m in msgs:
            m["created_at"] = str(m["created_at"])
        return msgs
    finally:
        conn.close()


# ── Usage Analytics ────────────────────────────────────────────────────────────

@router.get("/analytics")
def analytics(_: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Messages per day — last 30 days
            cur.execute("""
                SELECT DATE(created_at) as day, COUNT(*) as total,
                       SUM(role='user') as user_msgs,
                       SUM(role='assistant') as ai_msgs,
                       SUM(role='error') as errors
                FROM messages
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at) ORDER BY day ASC
            """)
            daily = [{"day": str(r["day"]), "total": r["total"],
                      "user": r["user_msgs"], "ai": r["ai_msgs"], "errors": r["errors"]}
                     for r in cur.fetchall()]

            # Mode breakdown
            cur.execute("""
                SELECT mode, COUNT(*) as cnt FROM messages
                WHERE role='user' GROUP BY mode ORDER BY cnt DESC
            """)
            modes = cur.fetchall()

            # Hourly pattern (last 7 days)
            cur.execute("""
                SELECT HOUR(created_at) as hour, COUNT(*) as cnt
                FROM messages WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                  AND role='user'
                GROUP BY HOUR(created_at) ORDER BY hour ASC
            """)
            hourly = cur.fetchall()

            # High-usage users (>100 msgs)
            cur.execute("""
                SELECT u.username, u.email, COUNT(m.id) as cnt
                FROM users u JOIN messages m ON m.user_id=u.id AND m.role='user'
                GROUP BY u.id HAVING cnt > 50
                ORDER BY cnt DESC LIMIT 20
            """)
            heavy_users = cur.fetchall()

        return {"daily": daily, "modes": modes, "hourly": hourly, "heavy_users": heavy_users}
    finally:
        conn.close()


# ── Security / Logs ────────────────────────────────────────────────────────────

@router.get("/logs")
def get_logs(event_type: str = "", limit: int = 100, _: dict = Depends(require_admin)):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            if event_type:
                cur.execute("""
                    SELECT l.*, u.username FROM activity_logs l
                    LEFT JOIN users u ON u.id=l.user_id
                    WHERE l.event_type=%s
                    ORDER BY l.created_at DESC LIMIT %s
                """, (event_type, limit))
            else:
                cur.execute("""
                    SELECT l.*, u.username FROM activity_logs l
                    LEFT JOIN users u ON u.id=l.user_id
                    ORDER BY l.created_at DESC LIMIT %s
                """, (limit,))
            logs = cur.fetchall()
        for log in logs:
            log["created_at"] = str(log["created_at"])
        return logs
    finally:
        conn.close()