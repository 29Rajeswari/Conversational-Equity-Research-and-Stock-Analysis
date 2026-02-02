from pydantic import BaseModel, EmailStr
from typing import Optional

class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    password: str
    role: str = "user"   # user | admin
