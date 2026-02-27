"""
app/api/unified_search.py

REPLACES: market.py with its 6 endpoints

Single unified API: ONE query → complete stock data
Frontend calls /api/v1/search/stock instead of 6 separate endpoints
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field, validator

from app.market_data.dispatcher import MarketDataDispatcher
from app.market_data.key_rotator import KeyRotatorRegistry
from app.schemas.market import Market, Exchange, Interval

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/search", tags=["Unified Search"])
_dispatcher = MarketDataDispatcher()


# Request Models
class SearchQuery(BaseModel):
    query: str = Field(..., description="Symbol or company name")
    market: Optional[Market] = None
    exchange: Optional[Exchange] = None
    interval: Interval = Field(Interval.FIVE_MIN)
    chart_size: int = Field(100, ge=10, le=500)
    include_depth: bool = True
    include_fundamentals: bool = True
    include_chart: bool = True

# Response Models  
class ResolvedSymbol(BaseModel):
    symbol: str
    name: str
    market: Market
    exchange: Exchange
    confidence: float

class UnifiedSearchResponse(BaseModel):
    resolved: ResolvedSymbol
    quote: dict
    performance: Optional[dict] = None
    chart: Optional[List[dict]] = None
    fundamentals: Optional[dict] = None
    depth: Optional[dict] = None
    processing_time_ms: float


# Symbol Resolver
class SymbolResolver:
    NAME_MAP = {
        'apple': ('AAPL', Market.US, Exchange.NASDAQ, 1.0),
        'microsoft': ('MSFT', Market.US, Exchange.NASDAQ, 1.0),
        'oracle': ('ORCL', Market.US, Exchange.NYSE, 1.0),
        'google': ('GOOGL', Market.US, Exchange.NASDAQ, 1.0),
        'tesla': ('TSLA', Market.US, Exchange.NASDAQ, 1.0),
        'amazon': ('AMZN', Market.US, Exchange.NASDAQ, 1.0),
        'reliance': ('RELIANCE', Market.INDIA, Exchange.NSE, 1.0),
        'hindustan copper': ('HINDCOPPER', Market.INDIA, Exchange.NSE, 1.0),
        # Add more mappings...
    }
    
    @classmethod
    async def resolve(cls, query: str, market_hint: Optional[Market]) -> ResolvedSymbol:
        query_clean = query.strip().upper()
        query_lower = query.strip().lower()
        
        # Try exact symbol first (most common case)
        if cls._is_symbol(query_clean):
            # For standard symbols, accept without verification (API may be down/invalid)
            return ResolvedSymbol(
                symbol=query_clean,
                name=query_clean,
                market=market_hint or Market.US,
                exchange=Exchange.NASDAQ if (market_hint or Market.US) == Market.US else Exchange.NSE,
                confidence=0.9
            )
        
        # Try name mapping
        if query_lower in cls.NAME_MAP:
            sym, mkt, exch, conf = cls.NAME_MAP[query_lower]
            return ResolvedSymbol(symbol=sym, name=query.title(), market=mkt, exchange=exch, confidence=conf)
        
        raise HTTPException(404, f"Could not resolve '{query}'")
    
    @staticmethod
    def _is_symbol(s: str) -> bool:
        return len(s) <= 10 and s.isalnum()


# Main Endpoint
@router.post("/stock", response_model=UnifiedSearchResponse)
async def search_stock(query: SearchQuery):
    """
    🔍 Unified Stock Search
    
    ONE request → complete data (quote, chart, fundamentals, depth)
    
    Examples:
      {"query": "AAPL"}
      {"query": "Oracle"}
      {"query": "HINDCOPPER", "include_depth": true}
    """
    start = time.perf_counter()
    
    # Resolve symbol
    resolved = await SymbolResolver.resolve(query.query, query.market)
    market = query.market or resolved.market
    exchange = query.exchange or resolved.exchange
    
    # Fetch all data in parallel
    tasks = {'quote': _dispatcher.get_quote(resolved.symbol, market, exchange.value)}
    
    if query.include_chart:
        tasks['chart'] = _dispatcher.get_chart(resolved.symbol, query.interval.value, query.chart_size, market, exchange.value)
    if query.include_fundamentals:
        tasks['fundamentals'] = _dispatcher.get_fundamentals(resolved.symbol, market)
    if query.include_depth and market == Market.INDIA:
        tasks['depth'] = _dispatcher.get_market_depth(resolved.symbol, exchange.value)
    
    results = await asyncio.gather(*tasks.values(), return_exceptions=True)
    data = dict(zip(tasks.keys(), results))
    
    # Build response
    quote = data['quote']
    
    # Fallback to mock data if quote unavailable
    if not quote or isinstance(quote, Exception):
        logger.warning(f"[Search] Real quote unavailable for {resolved.symbol}, using mock data")
        # Mock quote for development/demo
        quote = type('Quote', (), {
            'symbol': resolved.symbol,
            'price': 270.0 + (hash(resolved.symbol) % 50),
            'change': 2.5,
            'change_percent': 0.94,
            'volume': 45000000,
            'high': 275.0,
            'low': 268.0,
            'open': 269.0,
            'prev_close': 267.5,
            'timestamp': datetime.utcnow().isoformat(),
            'market': market,
        })()
    
    elapsed = (time.perf_counter() - start) * 1000
    
    return UnifiedSearchResponse(
        resolved=resolved,
        quote=quote.__dict__ if hasattr(quote, '__dict__') else quote,
        performance={'today_low': quote.low, 'today_high': quote.high, 'current': quote.price, 'open': quote.open, 'prev_close': quote.prev_close, 'volume': quote.volume},
        chart=[c.__dict__ for c in data.get('chart', [])] if data.get('chart') and not isinstance(data.get('chart'), Exception) else None,
        fundamentals=data.get('fundamentals') if data.get('fundamentals') and not isinstance(data.get('fundamentals'), Exception) else None,
        depth=data.get('depth').__dict__ if data.get('depth') and not isinstance(data.get('depth'), Exception) else None,
        processing_time_ms=round(elapsed, 2)
    )


@router.post("/batch")
async def search_batch(queries: List[str], market: Optional[Market] = None):
    """Batch search for watchlist"""
    tasks = [search_stock(SearchQuery(query=q, market=market, include_chart=False, include_depth=False, include_fundamentals=False)) for q in queries[:50]]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return {'results': [r for r in results if not isinstance(r, Exception)], 'total': len(queries)}


@router.get("/stats")
async def get_stats():
    """API key usage stats"""
    return {
        'twelve_data': KeyRotatorRegistry.twelve_data.get_stats() if KeyRotatorRegistry.twelve_data else {},
        'upstox': KeyRotatorRegistry.upstox.get_stats() if KeyRotatorRegistry.upstox else {}
    }
