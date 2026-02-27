import os
import smtplib
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()   # ← THIS IS WHAT YOU WERE MISSING

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))   # default if missing
SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")


def send_email(to_email: str, subject: str, body: str):
    if not SMTP_HOST or not SMTP_EMAIL or not SMTP_PASSWORD:
        raise Exception("SMTP is not configured correctly in .env")

    msg = MIMEText(body)
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    msg["Subject"] = subject

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.send_message(msg)
