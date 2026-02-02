"""Data Service"""
from app.ingestion.financial_loader import financial_loader
from app.schemas.financial import FinancialResponse

class DataService:
    async def get_financial_data(self, symbol: str):
        financials = await financial_loader.load_financials(symbol)
        
        return FinancialResponse(
            symbol=symbol,
            financials=financials,
            metrics={}
        )
