"""Base MCP Connector"""
import httpx

class BaseMCP:
    def __init__(self, base_url: str, api_key: str = None):
        self.base_url = base_url
        self.api_key = api_key
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def get(self, endpoint: str, params: dict = None):
        url = f"{self.base_url}/{endpoint}"
        if self.api_key:
            params = params or {}
            params['apikey'] = self.api_key
        response = await self.client.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        await self.client.aclose()
