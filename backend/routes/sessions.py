"""
Arc AI - Chat Session Routes
Manage chat sessions (create, list, delete, search).
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from database import get_connection
from auth import get_current_user

router = APIRouter()


class CreateSessionRequest(BaseModel):
    title: str = "New Chat"


@router.get("/")
def list_sessions(current_user: dict = Depends(get_current_user)):
    """Get all chat sessions for the current user, newest first."""
    user_id = int(current_user["sub"])
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT s.id, s.title, s.created_at, s.updated_at,
                       COUNT(m.id) as message_count
                FROM chat_sessions s
                LEFT JOIN messages m ON m.session_id = s.id
                WHERE s.user_id = %s
                GROUP BY s.id
                ORDER BY s.updated_at DESC
            """, (user_id,))
            sessions = cur.fetchall()
        # Convert datetimes to strings
        for s in sessions:
            s["created_at"] = str(s["created_at"])
            s["updated_at"] = str(s["updated_at"])
        return sessions
    finally:
        conn.close()


@router.post("/")
def create_session(req: CreateSessionRequest, current_user: dict = Depends(get_current_user)):
    """Create a new chat session."""
    user_id = int(current_user["sub"])
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO chat_sessions (user_id, title) VALUES (%s, %s)",
                (user_id, req.title)
            )
            conn.commit()
            session_id = cur.lastrowid
            cur.execute("SELECT * FROM chat_sessions WHERE id=%s", (session_id,))
            session = cur.fetchone()
        session["created_at"] = str(session["created_at"])
        session["updated_at"] = str(session["updated_at"])
        return session
    finally:
        conn.close()


@router.delete("/{session_id}")
def delete_session(session_id: int, current_user: dict = Depends(get_current_user)):
    """Delete a chat session (only owner can delete)."""
    user_id = int(current_user["sub"])
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM chat_sessions WHERE id=%s AND user_id=%s",
                        (session_id, user_id))
            if not cur.fetchone():
                raise HTTPException(404, "Session not found.")
            cur.execute("DELETE FROM chat_sessions WHERE id=%s", (session_id,))
            conn.commit()
        return {"deleted": True}
    finally:
        conn.close()


@router.get("/search")
def search_sessions(q: str, current_user: dict = Depends(get_current_user)):
    """Search chat history by message content or session title."""
    user_id = int(current_user["sub"])
    if not q.strip():
        return []
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT s.id, s.title, s.updated_at
                FROM chat_sessions s
                LEFT JOIN messages m ON m.session_id = s.id
                WHERE s.user_id = %s
                  AND (s.title LIKE %s OR m.content LIKE %s)
                ORDER BY s.updated_at DESC
                LIMIT 20
            """, (user_id, f"%{q}%", f"%{q}%"))
            results = cur.fetchall()
        for r in results:
            r["updated_at"] = str(r["updated_at"])
        return results
    finally:
        conn.close()


@router.patch("/{session_id}/title")
def update_title(session_id: int, req: CreateSessionRequest,
                 current_user: dict = Depends(get_current_user)):
    """Rename a chat session."""
    user_id = int(current_user["sub"])
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE chat_sessions SET title=%s WHERE id=%s AND user_id=%s",
                        (req.title, session_id, user_id))
            conn.commit()
        return {"updated": True}
    finally:
        conn.close()
