"""
Arc AI - Guest Routes
Handles guest session creation, prompt tracking, and limit enforcement.
No auth required — identified by guest_id.
"""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from database import get_connection
from services.gemini import GeminiService
from services.search import web_search, needs_search

router = APIRouter()
gemini = GeminiService()

GUEST_PROMPT_LIMIT = 5


# ── Models ────────────────────────────────────────────────────────────────────

class GuestChatRequest(BaseModel):
    guest_id: str
    message:  str
    mode:     str = "general"


class GuestConvertRequest(BaseModel):
    guest_id: str
    user_id:  int


# ── Helper ────────────────────────────────────────────────────────────────────

def get_or_create_guest(conn, guest_id: str, ip: str = None):
    with conn.cursor() as cur:
        cur.execute("SELECT * FROM guest_sessions WHERE guest_id=%s", (guest_id,))
        guest = cur.fetchone()
        if not guest:
            cur.execute("""
                INSERT INTO guest_sessions (guest_id, ip_address)
                VALUES (%s, %s)
            """, (guest_id, ip))
            conn.commit()
            cur.execute("SELECT * FROM guest_sessions WHERE guest_id=%s", (guest_id,))
            guest = cur.fetchone()
    return guest


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/guest/chat")
async def guest_chat(req: GuestChatRequest, request: Request):
    if not req.guest_id or len(req.guest_id) < 8:
        raise HTTPException(400, "Invalid guest ID.")
    if not req.message.strip():
        raise HTTPException(400, "Message cannot be empty.")

    ip = request.client.host
    conn = get_connection()
    try:
        guest = get_or_create_guest(conn, req.guest_id, ip)

        # Enforce limit — backend validation (cannot be bypassed)
        if guest["prompt_count"] >= GUEST_PROMPT_LIMIT:
            raise HTTPException(429, "Guest prompt limit reached. Please create an account to continue.")

        # Perform web search if needed
        search_context  = None
        effective_mode  = req.mode
        if req.mode == "search" or (req.mode == "general" and needs_search(req.message)):
            search_context = await web_search(req.message.strip())
            effective_mode = "search"
            if not search_context:
                search_context = (
                    "⚠️ SYSTEM NOTICE: No live search results were retrieved for this query. "
                    "You MUST NOT invent or fabricate any news stories or current events. "
                    "Tell the user you could not retrieve live results and suggest trusted news sources."
                )

        # Call AI
        try:
            response_text = await gemini.send_message(
                message=req.message.strip(),
                mode=effective_mode,
                search_context=search_context,
            )
        except Exception as e:
            raise HTTPException(500, str(e))

        # Increment prompt count + log message
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE guest_sessions
                SET prompt_count = prompt_count + 1, last_seen = NOW()
                WHERE guest_id = %s
            """, (req.guest_id,))
            cur.execute("""
                INSERT INTO guest_messages (guest_id, prompt, mode)
                VALUES (%s, %s, %s)
            """, (req.guest_id, req.message.strip()[:500], req.mode))
            conn.commit()

        new_count = guest["prompt_count"] + 1
        return {
            "response":     response_text,
            "prompt_count": new_count,
            "limit":        GUEST_PROMPT_LIMIT,
            "limit_reached": new_count >= GUEST_PROMPT_LIMIT,
        }
    finally:
        conn.close()


@router.get("/guest/status/{guest_id}")
def guest_status(guest_id: str):
    """Check how many prompts a guest has used."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT prompt_count FROM guest_sessions WHERE guest_id=%s", (guest_id,))
            row = cur.fetchone()
        count = row["prompt_count"] if row else 0
        return {
            "prompt_count":  count,
            "limit":         GUEST_PROMPT_LIMIT,
            "limit_reached": count >= GUEST_PROMPT_LIMIT,
            "remaining":     max(0, GUEST_PROMPT_LIMIT - count),
        }
    finally:
        conn.close()


@router.post("/guest/convert")
def convert_guest(req: GuestConvertRequest):
    """Link a guest_id to a newly registered user account."""
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE guest_sessions
                SET converted=1, converted_user_id=%s
                WHERE guest_id=%s
            """, (req.user_id, req.guest_id))
            conn.commit()
        return {"message": "Guest session linked to account."}
    finally:
        conn.close()