"""
app/api/market.py  ← NEW file, drop alongside existing api/ files
                      (chat.py, financial.py, health.py, news.py, etc.)

Registers routes:
    GET  /api/v1/market/quote
    POST /api/v1/market/chart
    POST /api/v1/market/watchlist
    POST /api/v1/market/depth
    GET  /api/v1/market/detail/{symbol}
    GET  /api/v1/market/usage           (admin — API key stats)

Mount in your main app (see integration note at bottom of file).
"""

import asyncio
import logging
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status

from app.market_data.dispatcher import MarketDataDispatcher
from app.market_data.key_rotator import KeyRotatorRegistry
from app.schemas.market import (
    ChartRequest,
    DepthRequest,
    Exchange,
    Market,
    MarketDepth,
    OHLCVPoint,
    QuoteRequest,
    StockDetail,
    StockFundamentals,
    StockQuote,
    WatchlistQuoteRequest,
)
from app.utils.market_utils import get_market_status

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/market", tags=["Market Data"])

# One shared dispatcher instance — stateless, safe to share
_dispatcher = MarketDataDispatcher()


# ──────────────────────────────────────────────
# GET /quote   (quick single quote)
# ──────────────────────────────────────────────

@router.get("/quote", response_model=StockQuote)
async def get_quote(
    symbol:   str  = Query(..., description="Stock ticker e.g. AAPL or HINDCOPPER"),
    market:   Market   = Query(Market.US),
    exchange: Exchange = Query(Exchange.NSE),
):
    """
    Real-time quote for any stock.
    Market is auto-detected when not supplied.
    """
    quote = await _dispatcher.get_quote(symbol, market, exchange.value)
    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Quote unavailable for '{symbol}'. Check symbol or market.",
        )
    return quote


# ──────────────────────────────────────────────
# POST /chart
# ──────────────────────────────────────────────

@router.post("/chart", response_model=List[OHLCVPoint])
async def get_chart(req: ChartRequest):
    """
    OHLCV candlestick data.
    Interval options: 1min, 5min, 15min, 30min, 1h, 1day, 1week
    """
    candles = await _dispatcher.get_chart(
        symbol=req.symbol,
        interval=req.interval.value,
        outputsize=req.outputsize,
        market=req.market,
        exchange=req.exchange.value,
        from_date=req.from_date or "",
        to_date=req.to_date or "",
    )
    if not candles:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Chart data unavailable for '{req.symbol}'.",
        )
    return candles


# ──────────────────────────────────────────────
# POST /watchlist  (batch quotes)
# ──────────────────────────────────────────────

@router.post("/watchlist", response_model=List[Optional[StockQuote]])
async def get_watchlist_quotes(req: WatchlistQuoteRequest):
    """
    Fetch quotes for multiple symbols in parallel.
    Used by the Watchlist page to bulk-update cards.
    """
    if len(req.symbols) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 50 symbols per request.",
        )
    quotes = await _dispatcher.get_batch_quotes(req.symbols, req.market, req.exchange.value)
    return quotes


# ──────────────────────────────────────────────
# POST /depth  (Indian markets only)
# ──────────────────────────────────────────────

@router.post("/depth", response_model=MarketDepth)
async def get_market_depth(req: DepthRequest):
    """
    Top-5 bid/ask order book for Indian stocks (NSE/BSE).
    Corresponds to the Market Depth section in screenshots.
    """
    depth = await _dispatcher.get_market_depth(req.symbol, req.exchange.value)
    if not depth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Market depth unavailable for '{req.symbol}'.",
        )
    return depth


# ──────────────────────────────────────────────
# GET /detail/{symbol}  (all-in-one for stock page)
# ──────────────────────────────────────────────

@router.get("/detail/{symbol}", response_model=StockDetail)
async def get_stock_detail(
    symbol:   str,
    market:   Market   = Query(Market.US),
    exchange: Exchange = Query(Exchange.NSE),
    interval: str      = Query("5min"),
):
    """
    All-in-one endpoint that powers the full stock detail page.
    Returns: quote + chart + fundamentals + market depth (India) in one call.
    """
    is_india = (market == Market.INDIA)

    # Run all fetches concurrently
    tasks = [
        _dispatcher.get_quote(symbol, market, exchange.value),
        _dispatcher.get_chart(symbol, interval, 100, market, exchange.value),
        _dispatcher.get_fundamentals(symbol, market),
    ]
    if is_india:
        tasks.append(_dispatcher.get_market_depth(symbol, exchange.value))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    quote        = results[0] if not isinstance(results[0], Exception) else None
    candles      = results[1] if not isinstance(results[1], Exception) else []
    fundamentals = results[2] if not isinstance(results[2], Exception) else {}
    depth        = results[3] if (is_india and not isinstance(results[3], Exception)) else None

    if not quote:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Stock '{symbol}' not found.",
        )

    # Build performance bar from quote data
    from app.schemas.market import PerformanceBar
    performance = PerformanceBar(
        today_low=quote.low,
        today_high=quote.high,
        week52_low=0.0,   # extend with dedicated endpoint if needed
        week52_high=0.0,
        current=quote.price,
        open=quote.open,
        prev_close=quote.prev_close,
        volume=quote.volume,
    )

    # Parse fundamentals dict → schema if non-empty
    fund_obj: Optional[StockFundamentals] = None
    if fundamentals:
        try:
            fund_obj = _parse_fundamentals(symbol, market, fundamentals)
        except Exception as exc:
            logger.warning(f"[market.py] Fundamentals parse failed: {exc}")

    # Get market status
    market_status = get_market_status(market)

    return StockDetail(
        quote=quote,
        performance=performance,
        fundamentals=fund_obj,
        depth=depth,
        chart=candles,
        market_status=market_status,
    )


# ──────────────────────────────────────────────
# GET /usage  (admin)
# ──────────────────────────────────────────────

@router.get("/usage")
async def api_key_usage():
    """
    Returns current API key usage stats for all providers.
    Useful for monitoring dashboards and debugging rate limits.
    """
    return {
        "twelve_data": KeyRotatorRegistry.twelve_data.get_stats() if KeyRotatorRegistry.twelve_data else {},
        "upstox": KeyRotatorRegistry.upstox.get_stats() if KeyRotatorRegistry.upstox else {},
    }


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _parse_fundamentals(symbol: str, market: Market, raw: dict) -> StockFundamentals:
    """Parse raw fundamentals dict from TwelveData into StockFundamentals."""
    stats = raw.get("statistics", raw)  # TwelveData nests under "statistics"
    val = stats.get("valuations_metrics", {})
    fin = stats.get("financials", {})

    return StockFundamentals(
        symbol=symbol,
        market=market,
        market_cap=_safe_float(val.get("market_capitalization")),
        pe_ratio=_safe_float(val.get("trailing_pe")),
        pb_ratio=_safe_float(val.get("price_to_book_mrq")),
        eps=_safe_float(fin.get("diluted_eps_ttm")),
        div_yield=_safe_float(stats.get("dividends_and_splits", {}).get("forward_annual_dividend_yield")),
        roe=_safe_float(fin.get("return_on_equity_ttm")),
        debt_to_equity=_safe_float(fin.get("total_debt_to_equity_mrq")),
        book_value=_safe_float(val.get("book_value")),
    )


def _safe_float(value) -> Optional[float]:
    try:
        return float(value) if value not in (None, "-", "", "N/A") else None
    except (TypeError, ValueError):
        return None


# ──────────────────────────────────────────────
# Integration note
# ──────────────────────────────────────────────
#
# In your existing  app/__init__.py  or  main.py  add:
#
#   from app.api.market import router as market_router
#   app.include_router(market_router)
#
# And in your startup event / lifespan add:
#
#   from app.market_data.key_rotator import KeyRotatorRegistry
#   from app.config import settings
#
#   KeyRotatorRegistry.init(
#       twelve_data_keys = settings.TWELVE_DATA_KEYS,   # list[str]
#       twelve_data_limit = 800,
#       upstox_keys       = settings.UPSTOX_KEYS,       # list[str]
#       upstox_limit      = 1000,
#   )
