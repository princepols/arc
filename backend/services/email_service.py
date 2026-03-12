"""
Arc AI - Email Service
Sends 6-digit OTP verification codes via Gmail SMTP.
Uses aiosmtplib for async sending so FastAPI doesn't block.
"""

import os
import random
import string
import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text      import MIMEText
from dotenv import load_dotenv

load_dotenv()

SMTP_HOST     = "smtp.gmail.com"
SMTP_PORT     = 587
SMTP_USER     = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")   # Gmail App Password


def generate_otp(length: int = 6) -> str:
    """Generate a secure 6-digit numeric OTP."""
    return ''.join(random.choices(string.digits, k=length))


def build_email_html(otp: str, username: str) -> str:
    """Build a clean HTML email body for the verification code."""
    return f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0;padding:0;background:#0c0c0e;font-family:'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#111114;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1a1e,#111114);padding:32px 36px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="font-size:22px;font-weight:800;color:#f0ede8;letter-spacing:-0.03em;">Arc <span style="color:#e8a838;">AI</span></div>
          <div style="font-size:12px;color:#5a5550;margin-top:4px;">Email Verification</div>
        </div>

        <!-- Body -->
        <div style="padding:32px 36px;">
          <p style="font-size:15px;color:#a09a90;margin:0 0 24px;">Hi <strong style="color:#f0ede8;">{username}</strong>, here is your verification code:</p>

          <!-- OTP Box -->
          <div style="background:#18181c;border:1px solid rgba(232,168,56,0.25);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <div style="font-size:42px;font-weight:900;letter-spacing:14px;color:#e8a838;font-family:'Courier New',monospace;">{otp}</div>
            <div style="font-size:11px;color:#5a5550;margin-top:10px;letter-spacing:0.04em;">VERIFICATION CODE</div>
          </div>

          <div style="background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.15);border-radius:8px;padding:12px 16px;margin-bottom:20px;">
            <p style="font-size:12px;color:#f87171;margin:0;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>

          <p style="font-size:12px;color:#5a5550;margin:0;">If you didn't request this, you can safely ignore this email.</p>
        </div>

        <!-- Footer -->
        <div style="padding:16px 36px;border-top:1px solid rgba(255,255,255,0.06);">
          <p style="font-size:11px;color:#5a5550;margin:0;">Arc AI · Built by Prince Ryan</p>
        </div>

      </div>
    </body>
    </html>
    """


async def send_verification_email(to_email: str, username: str, otp: str) -> bool:
    """
    Send OTP verification email via Gmail SMTP.
    Returns True on success, False on failure.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP_EMAIL and SMTP_PASSWORD must be set in .env")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"{otp} — Your Arc AI Verification Code"
    msg["From"]    = f"Arc AI <{SMTP_USER}>"
    msg["To"]      = to_email

    # Plain text fallback
    plain = f"Hi {username},\n\nYour Arc AI verification code is: {otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, ignore this email."
    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(build_email_html(otp, username), "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
            start_tls=True,
        )
        return True
    except Exception as e:
        raise RuntimeError(f"Failed to send email: {str(e)}")