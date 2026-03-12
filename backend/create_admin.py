"""
Arc AI - One-time Admin Account Setup
Run this ONCE to insert the admin user into the database:

    python create_admin.py

Creates user: princeadmin  /  2698664996prinsoy  (role: admin)
Safe to re-run — skips if admin already exists.
"""

import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from database import get_connection

load_dotenv()

ADMIN_USERNAME = "princeadmin"
ADMIN_EMAIL    = "admin@arc.local"
ADMIN_PASSWORD = "2698664996prinsoy"

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            # Ensure is_admin column exists
            try:
                cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) NOT NULL DEFAULT 0")
                conn.commit()
            except Exception:
                pass

            # Check if already exists
            cur.execute("SELECT id FROM users WHERE username=%s OR email=%s",
                        (ADMIN_USERNAME, ADMIN_EMAIL))
            if cur.fetchone():
                print(f"✅ Admin '{ADMIN_USERNAME}' already exists — skipping.")
                return

            hashed = pwd_ctx.hash(ADMIN_PASSWORD)
            cur.execute("""
                INSERT INTO users (username, email, password, is_admin)
                VALUES (%s, %s, %s, 1)
            """, (ADMIN_USERNAME, ADMIN_EMAIL, hashed))
            conn.commit()
            print(f"✅ Admin account created successfully!")
            print(f"   Username : {ADMIN_USERNAME}")
            print(f"   Password : {ADMIN_PASSWORD}")
            print(f"   Login at : http://localhost:5173/admin")
    finally:
        conn.close()

if __name__ == "__main__":
    create_admin()