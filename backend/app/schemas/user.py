from pydantic import BaseModel, EmailStr
from typing import Optional


# Used when returning user info (no password!)
class UserOut(BaseModel):
    id: Optional[str]
    email: EmailStr
    role: str


# Used when registering
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


# Used when logging in
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Used inside JWT token
class TokenData(BaseModel):
    email: EmailStr
    role: str
