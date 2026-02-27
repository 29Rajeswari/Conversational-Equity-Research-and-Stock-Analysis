"""
app/startup_market.py  ← NEW file

Copy the `lifespan_market` function contents into your EXISTING
app startup / lifespan handler.

If you already have a lifespan in main.py or app/__init__.py,
just add the three initialisation lines shown below.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.cache.store import cache
from app.config_market import market_settings
from app.market_data.key_rotator import KeyRotatorRegistry

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# Initialisation helper (call from YOUR lifespan)
# ──────────────────────────────────────────────

async def init_market_services() -> None:
    """
    Call this inside your existing startup/lifespan event.

    Example — if you have an existing lifespan:

        @asynccontextmanager
        async def lifespan(app: FastAPI):
            # --- your existing startup code ---
            await init_market_services()   # ← add this line
            yield
            # --- your existing shutdown code ---
    """
    # 1. Init API key pools
    KeyRotatorRegistry.init(
        twelve_data_keys  = market_settings.TWELVE_DATA_KEYS,
        twelve_data_limit = market_settings.TWELVE_DATA_DAILY_LIMIT,
        upstox_keys       = market_settings.UPSTOX_KEYS,
        upstox_limit      = market_settings.UPSTOX_DAILY_LIMIT,
    )

    # 2. Init cache (wire Redis URL from settings)
    cache._redis_url  = market_settings.REDIS_URL
    cache._default_ttl = market_settings.CACHE_TTL_QUOTE
    logger.info(f"[Startup] Cache backend: {'Redis' if market_settings.REDIS_URL else 'Memory'}")

    # 3. Start background bridge to external WS providers
    try:
        from app.streaming.external_feeds import init_external_streams
        await init_external_streams()
        logger.info("[Startup] External market data streams started.")
    except Exception as e:
        logger.exception(f"[Startup] Failed to start external streams: {e}")

    logger.info("[Startup] Market data services ready.")


# ──────────────────────────────────────────────
# Route registration helper (call from YOUR app factory)
# ──────────────────────────────────────────────

def register_market_routes(app: FastAPI) -> None:
    """
    Mount the two new routers onto your existing FastAPI app.

    Call this in the same place you already register other routers:

        from app.startup_market import register_market_routes
        register_market_routes(app)
    """
    from app.api.market import router as market_router
    from app.streaming.stream_router import router as stream_router

    app.include_router(market_router)
    app.include_router(stream_router)

    logger.info("[Startup] Market API and WebSocket routes registered.")


# ──────────────────────────────────────────────
# Standalone lifespan (use ONLY if you have no existing lifespan)
# ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan_market(app: FastAPI):
    """
    Standalone lifespan — use ONLY if your app has no existing lifespan.
    Otherwise use init_market_services() + register_market_routes() above.
    """
    await init_market_services()
    register_market_routes(app)
    yield
    logger.info("[Shutdown] Market data services stopped.")
