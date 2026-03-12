"""
Arc AI - Chat Routes
POST /chat/{session_id}  - Send a message (with optional file context)
GET  /chat/{session_id}  - Get all messages in a session
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_connection
from auth import get_current_user
from services.gemini import GeminiService
from services.search import web_search, needs_search

router = APIRouter()
gemini = GeminiService()


class ChatRequest(BaseModel):
    message: str
    mode: str = "general"
    file_context: Optional[str] = None   # extracted file text
    file_name: Optional[str] = None      # original filename for display


class ChatResponse(BaseModel):
    response: str
    mode: str
    session_id: int
    user_message_id: int
    ai_message_id: int


@router.get("/{session_id}")
def get_messages(session_id: int, current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM chat_sessions WHERE id=%s AND user_id=%s",
                        (session_id, user_id))
            if not cur.fetchone():
                raise HTTPException(404, "Session not found.")
            cur.execute("""
                SELECT id, role, content, mode, created_at
                FROM messages WHERE session_id=%s ORDER BY created_at ASC
            """, (session_id,))
            messages = cur.fetchall()
        for m in messages:
            m["created_at"] = str(m["created_at"])
        return messages
    finally:
        conn.close()


@router.post("/{session_id}")
async def chat(session_id: int, req: ChatRequest,
               current_user: dict = Depends(get_current_user)):
    user_id = int(current_user["sub"])

    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM chat_sessions WHERE id=%s AND user_id=%s",
                        (session_id, user_id))
            if not cur.fetchone():
                raise HTTPException(404, "Session not found.")

            # Build display content — include filename badge if file was attached
            display_content = req.message.strip()
            if req.file_name:
                display_content = f"📎 **{req.file_name}**\n\n{req.message.strip()}"

            # Save user message
            cur.execute("""
                INSERT INTO messages (session_id, user_id, role, content, mode)
                VALUES (%s, %s, 'user', %s, %s)
            """, (session_id, user_id, display_content, req.mode))
            conn.commit()
            user_msg_id = cur.lastrowid

            # Auto-title session from first message
            cur.execute("SELECT COUNT(*) as cnt FROM messages WHERE session_id=%s", (session_id,))
            if cur.fetchone()["cnt"] == 1:
                title = req.message.strip()[:60]
                cur.execute("UPDATE chat_sessions SET title=%s WHERE id=%s", (title, session_id))
                conn.commit()

        # Load conversation history trimmed to fit within Groq's TPM budget.
        # Limit: 8,000 tokens/min. Reserve ~2,500 for current msg + response.
        # Leaves ~5,500 for system prompt + history (~22,000 chars at 4 chars/token).
        TPM_HISTORY_CHAR_BUDGET = 20_000

        with conn.cursor() as cur:
            cur.execute("""
                SELECT role, content FROM messages
                WHERE session_id = %s AND id != %s
                ORDER BY created_at DESC
                LIMIT 30
            """, (session_id, user_msg_id))
            rows = cur.fetchall()

        # Rows are newest-first — include as many as fit, then reverse to chronological
        history = []
        char_total = 0
        for row in rows:
            char_total += len(row["content"])
            if char_total > TPM_HISTORY_CHAR_BUDGET:
                break
            history.append(row)
        history.reverse()

        # Perform web search if mode is 'search' OR auto-detected on general
        search_context = None
        effective_mode = req.mode
        if req.mode == "search" or (req.mode == "general" and needs_search(req.message)):
            search_context = await web_search(req.message.strip())
            effective_mode = "search"   # use search system prompt when results found

        # Call AI with history + optional search/file context
        try:
            response_text = await gemini.send_message(
                message=req.message.strip(),
                mode=effective_mode,
                file_context=req.file_context,
                history=history,
                search_context=search_context,
            )
        except Exception as e:
            raise HTTPException(500, str(e))

        # Save AI response
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO messages (session_id, user_id, role, content, mode)
                VALUES (%s, %s, 'assistant', %s, %s)
            """, (session_id, user_id, response_text, req.mode))
            conn.commit()
            ai_msg_id = cur.lastrowid

        return ChatResponse(
            response=response_text,
            mode=req.mode,
            session_id=session_id,
            user_message_id=user_msg_id,
            ai_message_id=ai_msg_id,
        )
    finally:
        conn.close()