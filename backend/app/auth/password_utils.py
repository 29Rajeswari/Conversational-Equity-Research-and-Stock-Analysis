import bcrypt
import hashlib
import re
from fastapi import HTTPException

MIN_LENGTH = 8

# -------------------------
# Validate password
# -------------------------
def validate_password(password: str):
    if len(password) < MIN_LENGTH:
        raise HTTPException(400, "Password must be at least 8 characters")

    if not re.search(r"[A-Z]", password):
        raise HTTPException(400, "Password must contain at least one uppercase letter")

    if not re.search(r"[0-9]", password):
        raise HTTPException(400, "Password must contain at least one number")

    if not re.search(r"[!@#$%^&*]", password):
        raise HTTPException(400, "Password must contain at least one special character")

# -------------------------
# Pre-hash to avoid bcrypt 72-byte crash
# -------------------------
def _prehash(password: str) -> bytes:
    return hashlib.sha256(password.encode("utf-8")).digest()

# -------------------------
# Hash password
# -------------------------
def hash_password(password: str) -> str:
    validate_password(password)
    pre = _prehash(password)
    hashed = bcrypt.hashpw(pre, bcrypt.gensalt())
    return hashed.decode("utf-8")

# -------------------------
# Verify password
# -------------------------
def verify_password(plain: str, hashed: str) -> bool:
    pre = _prehash(plain)
    return bcrypt.checkpw(pre, hashed.encode("utf-8"))
