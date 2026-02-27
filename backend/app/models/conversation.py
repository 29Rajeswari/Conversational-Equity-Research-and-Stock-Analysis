"""Conversation Model"""
from pydantic import BaseModel
from datetime import datetime

class Message(BaseModel):
    session_id: str
    role: str
    content: str
    timestamp: datetime
