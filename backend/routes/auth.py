"""
Arc AI - Auth Routes v2
POST /auth/send-otp   - Send verification code to email
POST /auth/register   - Verify OTP + create account
POST /auth/login      - Login and get JWT
GET  /auth/me         - Get current user info
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
from database import get_connection
from auth import hash_password, verify_password, create_token, get_current_user
from services.email_service import send_verification_email, generate_otp
from passlib.context import CryptContext

router  = APIRouter()
otp_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Constants ──────────────────────────────────────────────────────────────────
OTP_EXPIRE_MINUTES = 10
MAX_ATTEMPTS       = 5
RESEND_COOLDOWN_S  = 60   # seconds before allowing resend


# ── Models ─────────────────────────────────────────────────────────────────────
class SendOtpRequest(BaseModel):
    username: str
    email:    EmailStr
    password: str           # stored temporarily to validate before sending OTP

class VerifyOtpRequest(BaseModel):
    email:    EmailStr
    otp:      str

class RegisterRequest(BaseModel):
    username: str
    email:    EmailStr
    password: str
    otp:      str           # must include OTP now

class LoginRequest(BaseModel):
    email:    str
    password: str


# ── Helpers ────────────────────────────────────────────────────────────────────

def get_pending_otp(cur, email: str):
    """Fetch the latest unexpired OTP record for this email."""
    cur.execute("""
        SELECT * FROM email_verifications
        WHERE email = %s AND expires_at > UTC_TIMESTAMP()
        ORDER BY created_at DESC LIMIT 1
    """, (email.lower(),))
    return cur.fetchone()


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/send-otp")
async def send_otp(req: SendOtpRequest):
    """
    Step 1 of registration: validate inputs, send OTP to email.
    Does NOT create the account yet.
    """
    # Validate inputs early
    if len(req.username.strip()) < 2:
        raise HTTPException(400, "Username must be at least 2 characters.")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Check if email/username already registered
            cur.execute("SELECT id FROM users WHERE email=%s OR username=%s",
                        (req.email.lower(), req.username.strip()))
            if cur.fetchone():
                raise HTTPException(400, "Email or username already taken.")

            # Resend cooldown — prevent spam (compare entirely in MySQL UTC)
            cur.execute("""
                SELECT TIMESTAMPDIFF(SECOND, created_at, UTC_TIMESTAMP()) as elapsed_s
                FROM email_verifications
                WHERE email = %s ORDER BY created_at DESC LIMIT 1
            """, (req.email.lower(),))
            last = cur.fetchone()
            if last and last["elapsed_s"] is not None and last["elapsed_s"] < RESEND_COOLDOWN_S:
                wait = int(RESEND_COOLDOWN_S - last["elapsed_s"])
                raise HTTPException(429, f"Please wait {wait}s before requesting a new code.")

            # Delete any old OTP records for this email
            cur.execute("DELETE FROM email_verifications WHERE email=%s", (req.email.lower(),))

            # Generate OTP, hash it for storage
            otp      = generate_otp()
            otp_hash = otp_ctx.hash(otp)
            expires  = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)

            cur.execute("""
                INSERT INTO email_verifications (email, username, otp_hash, attempts, expires_at)
                VALUES (%s, %s, %s, 0, %s)
            """, (req.email.lower(), req.username.strip(), otp_hash, expires))
            conn.commit()

        # Send the email (outside DB transaction)
        await send_verification_email(req.email, req.username.strip(), otp)

        return {"message": "Verification code sent.", "expires_in": OTP_EXPIRE_MINUTES * 60}

    finally:
        conn.close()


@router.post("/register")
def register(req: RegisterRequest):
    """
    Step 2 of registration: verify OTP, then create the account.
    """
    if len(req.username.strip()) < 2:
        raise HTTPException(400, "Username must be at least 2 characters.")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")
    if len(req.otp.strip()) != 6:
        raise HTTPException(400, "Verification code must be 6 digits.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Fetch pending OTP
            record = get_pending_otp(cur, req.email)
            if not record:
                raise HTTPException(400, "No active verification code. Please request a new one.")

            # Check attempt limit
            if record["attempts"] >= MAX_ATTEMPTS:
                cur.execute("DELETE FROM email_verifications WHERE id=%s", (record["id"],))
                conn.commit()
                raise HTTPException(400, "Too many incorrect attempts. Please request a new code.")

            # Increment attempt count
            cur.execute("UPDATE email_verifications SET attempts = attempts + 1 WHERE id=%s", (record["id"],))
            conn.commit()

            # Verify OTP
            if not otp_ctx.verify(req.otp.strip(), record["otp_hash"]):
                remaining = MAX_ATTEMPTS - (record["attempts"] + 1)
                raise HTTPException(400, f"Incorrect code. {remaining} attempt(s) remaining.")

            # OTP valid — delete it so it can't be reused
            cur.execute("DELETE FROM email_verifications WHERE id=%s", (record["id"],))

            # Check again that email/username isn't taken (race condition guard)
            cur.execute("SELECT id FROM users WHERE email=%s OR username=%s",
                        (req.email.lower(), req.username.strip()))
            if cur.fetchone():
                raise HTTPException(400, "Email or username already taken.")

            # Create the account
            hashed = hash_password(req.password)
            cur.execute(
                "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                (req.username.strip(), req.email.lower(), hashed)
            )
            conn.commit()
            user_id = cur.lastrowid

        token = create_token(user_id, req.username.strip())
        return {"token": token, "username": req.username.strip(), "user_id": user_id}

    finally:
        conn.close()


@router.post("/login")
def login(req: LoginRequest):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email=%s", (req.email.lower(),))
            user = cur.fetchone()
        if not user or not verify_password(req.password, user["password"]):
            raise HTTPException(401, "Invalid email or password.")
        if user.get("is_banned"):
            reason = user.get("ban_reason") or "No reason provided."
            raise HTTPException(403, f"You are banned: {reason}")
        token = create_token(user["id"], user["username"])
        return {"token": token, "username": user["username"], "user_id": user["id"]}
    finally:
        conn.close()


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"user_id": current_user["sub"], "username": current_user["username"]}