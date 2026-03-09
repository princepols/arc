"""
Arc AI - Auth Routes
POST /auth/register  - Create new account
POST /auth/login     - Login and get JWT
GET  /auth/me        - Get current user info
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from database import get_connection
from auth import hash_password, verify_password, create_token, get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/register")
def register(req: RegisterRequest):
    if len(req.username.strip()) < 2:
        raise HTTPException(400, "Username must be at least 2 characters.")
    if len(req.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters.")

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Check if email or username already exists
            cur.execute("SELECT id FROM users WHERE email=%s OR username=%s",
                        (req.email, req.username))
            if cur.fetchone():
                raise HTTPException(400, "Email or username already taken.")

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

        token = create_token(user["id"], user["username"])
        return {"token": token, "username": user["username"], "user_id": user["id"]}
    finally:
        conn.close()


@router.get("/me")
def me(current_user: dict = Depends(get_current_user)):
    return {"user_id": current_user["sub"], "username": current_user["username"]}
