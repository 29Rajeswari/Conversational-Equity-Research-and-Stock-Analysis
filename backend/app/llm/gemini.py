"""Gemini LLM Client"""
import google.generativeai as genai
from app.config import settings

class GeminiClient:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
    
    async def generate(self, prompt: str) -> str:
        response = self.model.generate_content(prompt)
        return response.text

gemini = GeminiClient()
