"""
app/schemas/market.py  ← NEW file, drop alongside existing schemas/

Pydantic models for market data.
These extend your existing schema layer (chat.py, financial.py, etc.)
without modifying them.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Enums
# ──────────────────────────────────────────────

class Market(str, Enum):
    US = "US"
    INDIA = "INDIA"


class Interval(str, Enum):
    ONE_MIN    = "1min"
    FIVE_MIN   = "5min"
    FIFTEEN    = "15min"
    THIRTY     = "30min"
    ONE_HOUR   = "1h"
    ONE_DAY    = "1day"
    ONE_WEEK   = "1week"


class Exchange(str, Enum):
    NSE = "NSE_EQ"
    BSE = "BSE_EQ"
    NYSE = "NYSE"
    NASDAQ = "NASDAQ"


# ──────────────────────────────────────────────
# Core data models
# ──────────────────────────────────────────────

class StockQuote(BaseModel):
    """Real-time quote — unified across US and Indian markets."""
    symbol:         str
    price:          float
    change:         float
    change_percent: float
    volume:         int
    high:           float
    low:            float
    open:           float
    prev_close:     float
    timestamp:      str
    market:         Market

    class Config:
        use_enum_values = True


class OHLCVPoint(BaseModel):
    """Single OHLCV candlestick."""
    timestamp: str
    open:      float
    high:      float
    low:       float
    close:     float
    volume:    int


class OrderBookEntry(BaseModel):
    """Single row in the bid/ask order book."""
    price:    float
    quantity: int
    orders:   Optional[int] = None


class MarketDepth(BaseModel):
    """Full order book — top 5 bids and asks."""
    symbol:          str
    buy_orders:      List[Dict[str, Any]]
    sell_orders:     List[Dict[str, Any]]
    buy_percentage:  float
    sell_percentage: float


class StockFundamentals(BaseModel):
    """Key fundamental ratios — used by existing financial.py routes."""
    symbol:          str
    market:          Market
    market_cap:      Optional[float] = None
    pe_ratio:        Optional[float] = None
    pb_ratio:        Optional[float] = None
    eps:             Optional[float] = None
    div_yield:       Optional[float] = None
    roe:             Optional[float] = None
    debt_to_equity:  Optional[float] = None
    book_value:      Optional[float] = None
    face_value:      Optional[float] = None
    industry_pe:     Optional[float] = None


class PerformanceBar(BaseModel):
    """52-week / intraday range bar — used by performance section in UI."""
    today_low:       float
    today_high:      float
    week52_low:      float
    week52_high:     float
    current:         float
    open:            float
    prev_close:      float
    volume:          int
    lower_circuit:   Optional[float] = None
    upper_circuit:   Optional[float] = None


# ──────────────────────────────────────────────
# Request / Response schemas  (used by api/market.py)
# ──────────────────────────────────────────────

class QuoteRequest(BaseModel):
    symbol:   str
    market:   Market = Market.US
    exchange: Exchange = Exchange.NSE


class ChartRequest(BaseModel):
    symbol:     str
    market:     Market = Market.US
    interval:   Interval = Interval.FIVE_MIN
    outputsize: int = Field(default=100, ge=1, le=5000)
    exchange:   Exchange = Exchange.NSE
    from_date:  Optional[str] = None
    to_date:    Optional[str] = None


class WatchlistQuoteRequest(BaseModel):
    symbols:  List[str]
    market:   Market = Market.US
    exchange: Exchange = Exchange.NSE


class DepthRequest(BaseModel):
    symbol:   str
    exchange: Exchange = Exchange.NSE


# ──────────────────────────────────────────────
# WebSocket message schemas
# ──────────────────────────────────────────────

class WSSubscribeMessage(BaseModel):
    action:   str = "subscribe"
    symbols:  List[str]
    market:   Market = Market.US
    interval: Interval = Interval.ONE_MIN


class WSQuoteMessage(BaseModel):
    type:   str = "quote"
    data:   StockQuote


class WSCandleMessage(BaseModel):
    type:   str = "candle"
    symbol: str
    data:   OHLCVPoint


class WSErrorMessage(BaseModel):
    type:    str = "error"
    message: str


# ──────────────────────────────────────────────
# Unified stock detail response
# ──────────────────────────────────────────────

class StockDetail(BaseModel):
    """
    All-in-one response for the stock detail page
    (mirrors the 4 screenshots: chart, performance, fundamentals, depth).
    """
    quote:          StockQuote
    performance:    Optional[PerformanceBar]  = None
    fundamentals:   Optional[StockFundamentals] = None
    depth:          Optional[MarketDepth]     = None
    chart:          List[OHLCVPoint]          = []
    market_status:  Optional[dict]            = None  # {status, open_time, close_time, is_open}
