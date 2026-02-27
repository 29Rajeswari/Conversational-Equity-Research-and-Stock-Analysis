"""News Model"""
from pydantic import BaseModel
from datetime import datetime

class NewsArticle(BaseModel):
    title: str
    description: str
    url: str
    published_at: datetime
