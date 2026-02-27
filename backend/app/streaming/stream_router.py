"""
app/streaming/stream_router.py

WebSocket endpoint for real-time stock data streaming.
Connects the ConnectionManager to the MarketDataDispatcher.

Client → Server messages (JSON):
    { "action": "subscribe",   "symbols": ["AAPL"], "market": "US", "interval": "1min" }
    { "action": "unsubscribe", "symbols": ["AAPL"] }
    { "action": "ping" }

Server → Client messages (JSON):
    { "type": "quote",   "data": { ...StockQuote fields... } }
    { "type": "candle",  "symbol": "AAPL", "data": { ...OHLCVPoint fields... } }
    { "type": "pong",    "timestamp": "..." }
    { "type": "error",   "message": "..." }
    { "type": "info",    "message": "...", "stats": {...} }
"""

import asyncio
import logging
from datetime import datetime

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.market_data.dispatcher import MarketDataDispatcher
from app.schemas.market import Market
from app.streaming.connection_manager import connection_manager

logger = logging.getLogger(__name__)
router = APIRouter()

_dispatcher = MarketDataDispatcher()

# How often (seconds) to push fresh quotes to subscribed clients
POLL_INTERVAL_SECONDS = 5
HEARTBEAT_INTERVAL_SECONDS = 30


# ──────────────────────────────────────────────
# WebSocket endpoint
# ──────────────────────────────────────────────

@router.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Primary WebSocket endpoint.
    Mount in main app:
        from app.streaming import stream_router
        app.include_router(stream_router)
    """
    client_id = websocket.headers.get("x-client-id", str(id(websocket)))
    await connection_manager.connect(websocket, client_id=client_id)

    # Start background tasks for this connection
    poll_task      = asyncio.create_task(_poll_loop(websocket))
    heartbeat_task = asyncio.create_task(_heartbeat_loop(websocket))

    try:
        while True:
            raw = await websocket.receive_json()
            await _handle_client_message(websocket, raw)

    except WebSocketDisconnect:
        logger.info(f"[WS] client_id={client_id} disconnected normally.")
    except Exception as exc:
        logger.exception(f"[WS] Unexpected error for client_id={client_id}: {exc}")
    finally:
        poll_task.cancel()
        heartbeat_task.cancel()
        connection_manager.disconnect(websocket)


# ──────────────────────────────────────────────
# Message handler
# ──────────────────────────────────────────────

async def _handle_client_message(websocket: WebSocket, msg: dict) -> None:
    action = msg.get("action", "").lower()

    if action == "subscribe":
        symbols  = [s.upper() for s in msg.get("symbols", [])]
        market   = Market(msg.get("market", "US"))
        exchange = msg.get("exchange", "NSE_EQ")
        interval = msg.get("interval", "1min")

        await connection_manager.subscribe(websocket, symbols, market, exchange, interval)

        await websocket.send_json({
            "type": "info",
            "message": f"Subscribed to {symbols}",
            "stats": connection_manager.stats(),
        })

    elif action == "unsubscribe":
        symbols = [s.upper() for s in msg.get("symbols", [])]
        await connection_manager.unsubscribe(websocket, symbols)
        await websocket.send_json({
            "type": "info",
            "message": f"Unsubscribed from {symbols}",
        })

    elif action == "ping":
        await websocket.send_json({
            "type": "pong",
            "timestamp": datetime.utcnow().isoformat(),
        })

    else:
        await websocket.send_json({
            "type": "error",
            "message": f"Unknown action '{action}'. Valid: subscribe, unsubscribe, ping",
        })


# ──────────────────────────────────────────────
# Background poll loop (per connection)
# ──────────────────────────────────────────────

async def _poll_loop(websocket: WebSocket) -> None:
    """
    Periodically fetches quotes for all symbols this connection watches
    and pushes them as 'quote' messages.
    """
    while True:
        await asyncio.sleep(POLL_INTERVAL_SECONDS)

        sub = connection_manager.get_subscriptions(websocket)
        if not sub or not sub.symbols:
            continue

        for symbol in sub.symbols:
            try:
                quote = await _dispatcher.get_quote(symbol, sub.market, sub.exchange)
                if quote:
                    await websocket.send_json({
                        "type": "quote",
                        "data": quote.model_dump(),
                    })
            except Exception as exc:
                logger.warning(f"[WS poll] Error fetching {symbol}: {exc}")
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Failed to fetch quote for {symbol}",
                    })
                except Exception:
                    return  # connection is dead


# ──────────────────────────────────────────────
# Heartbeat loop (per connection)
# ──────────────────────────────────────────────

async def _heartbeat_loop(websocket: WebSocket) -> None:
    """
    Sends a heartbeat every N seconds to keep the connection alive
    and let the client detect stale connections.
    """
    while True:
        await asyncio.sleep(HEARTBEAT_INTERVAL_SECONDS)
        try:
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat(),
                "connections": connection_manager.total_connections(),
            })
        except Exception:
            return  # connection closed
