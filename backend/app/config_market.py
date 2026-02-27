"""
app/config_market.py  ← NEW file

Market data configuration settings.
Add these to your EXISTING app/config.py by either:

  Option A — Direct merge (recommended):
    Copy the MarketSettings class body into your existing Settings class.

  Option B — Composition:
    from app.config_market import market_settings
    Use market_settings.TWELVE_DATA_KEYS etc. in market_data code.

Environment variables (set in .env or shell):
    TWELVE_DATA_KEYS=key1,key2,key3
    UPSTOX_KEYS=key1,key2,key3
    REDIS_URL=redis://localhost:6379
    MARKET_POLL_INTERVAL=5
    TWELVE_DATA_DAILY_LIMIT=800
    UPSTOX_DAILY_LIMIT=1000
"""

import os
from typing import List, Optional


class MarketSettings:
    """
    Market-data specific settings.
    Reads from environment variables with sensible defaults.
    """

    # ── Twelve Data (US Markets) ──────────────────────────
    @property
    def TWELVE_DATA_KEYS(self) -> List[str]:
        """Comma-separated list of Twelve Data API keys."""
        raw = os.getenv("TWELVE_DATA_KEYS", "")
        return [k.strip() for k in raw.split(",") if k.strip()]

    @property
    def TWELVE_DATA_DAILY_LIMIT(self) -> int:
        """Max requests per key per day (free plan = 800)."""
        return int(os.getenv("TWELVE_DATA_DAILY_LIMIT", "800"))

    @property
    def TWELVE_DATA_BASE_URL(self) -> str:
        return os.getenv("TWELVE_DATA_BASE_URL", "https://api.twelvedata.com")

    # ── Upstox (Indian Markets) ───────────────────────────
    @property
    def UPSTOX_KEYS(self) -> List[str]:
        """Comma-separated list of Upstox access tokens."""
        raw = os.getenv("UPSTOX_KEYS", "")
        return [k.strip() for k in raw.split(",") if k.strip()]

    @property
    def UPSTOX_DAILY_LIMIT(self) -> int:
        return int(os.getenv("UPSTOX_DAILY_LIMIT", "1000"))

    @property
    def UPSTOX_BASE_URL(self) -> str:
        return os.getenv("UPSTOX_BASE_URL", "https://api.upstox.com/v2")

    # ── Cache ─────────────────────────────────────────────
    @property
    def REDIS_URL(self) -> Optional[str]:
        return os.getenv("REDIS_URL")  # None = use in-memory

    @property
    def CACHE_TTL_QUOTE(self) -> int:
        """Seconds to cache real-time quotes."""
        return int(os.getenv("CACHE_TTL_QUOTE", "10"))

    @property
    def CACHE_TTL_CHART(self) -> int:
        """Seconds to cache chart data."""
        return int(os.getenv("CACHE_TTL_CHART", "60"))

    @property
    def CACHE_TTL_FUNDAMENTALS(self) -> int:
        """Seconds to cache fundamentals."""
        return int(os.getenv("CACHE_TTL_FUNDAMENTALS", "3600"))

    # ── WebSocket Streaming ───────────────────────────────
    @property
    def MARKET_POLL_INTERVAL(self) -> int:
        """Seconds between quote pushes per WebSocket connection."""
        return int(os.getenv("MARKET_POLL_INTERVAL", "5"))

    @property
    def WS_HEARTBEAT_INTERVAL(self) -> int:
        return int(os.getenv("WS_HEARTBEAT_INTERVAL", "30"))

    # ── External provider WebSocket URLs ───────────────────────────────
    @property
    def TWELVE_DATA_WS_URL(self) -> str:
        """WebSocket endpoint for Twelve Data real-time stream."""
        return os.getenv(
            "TWELVE_DATA_WS_URL",
            "wss://ws.twelvedata.com/v1/quotes",
        )

    @property
    def UPSTOX_WS_URL(self) -> str:
        """WebSocket endpoint for Upstox real-time stream."""
        return os.getenv(
            "UPSTOX_WS_URL",
            "wss://ws.upstox.com/stream",
        )

    # ── CORS ─────────────────────────────────────────────
    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")
        return [o.strip() for o in raw.split(",") if o.strip()]


# Singleton
market_settings = MarketSettings()


# ──────────────────────────────────────────────
# .env template (copy to your project root)
# ──────────────────────────────────────────────
ENV_TEMPLATE = """
# ── Market Data ──────────────────────────────
TWELVE_DATA_KEYS=your_key_1,your_key_2,your_key_3
TWELVE_DATA_DAILY_LIMIT=800

UPSTOX_KEYS=your_upstox_token_1,your_upstox_token_2
UPSTOX_DAILY_LIMIT=1000

# ── External provider WebSockets ──────────────
TWELVE_DATA_WS_URL=wss://ws.twelvedata.com/v1/quotes
UPSTOX_WS_URL=wss://ws.upstox.com/stream

# ── Cache ─────────────────────────────────────
REDIS_URL=redis://localhost:6379
CACHE_TTL_QUOTE=10
CACHE_TTL_CHART=60
CACHE_TTL_FUNDAMENTALS=3600

# ── WebSocket (internal) ─────────────────────
MARKET_POLL_INTERVAL=5
WS_HEARTBEAT_INTERVAL=30

# ── CORS ──────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
"""
