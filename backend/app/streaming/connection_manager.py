"""
app/streaming/connection_manager.py

Manages all active WebSocket connections and their subscriptions.
Thread-safe, supports multiple concurrent subscribers per symbol.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

from fastapi import WebSocket

from app.schemas.market import Market

logger = logging.getLogger(__name__)


@dataclass
class Subscription:
    """What a single WebSocket connection is watching."""
    websocket:  WebSocket
    symbols:    List[str]       = field(default_factory=list)
    market:     Market          = Market.US
    exchange:   str             = "NSE_EQ"
    interval:   str             = "1min"
    client_id:  Optional[str]  = None


class ConnectionManager:
    """
    Singleton that tracks every live WebSocket and its subscriptions.

    Usage in streaming loop:
        manager = ConnectionManager()
        await manager.connect(ws)
        await manager.subscribe(ws, ["AAPL", "MSFT"], Market.US)
        await manager.broadcast_quote(quote_obj)
        manager.disconnect(ws)
    """

    def __init__(self):
        # ws → Subscription
        self._connections: Dict[WebSocket, Subscription] = {}
        # symbol → set of websockets watching it
        self._symbol_index: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    # ──────────────────────────────────────────
    # Lifecycle
    # ──────────────────────────────────────────

    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[websocket] = Subscription(
                websocket=websocket,
                client_id=client_id,
            )
        logger.info(
            f"[WS] Client connected. client_id={client_id}  "
            f"total={len(self._connections)}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        sub = self._connections.pop(websocket, None)
        if sub:
            for symbol in sub.symbols:
                self._symbol_index.get(symbol, set()).discard(websocket)
        logger.info(f"[WS] Client disconnected. total={len(self._connections)}")

    # ──────────────────────────────────────────
    # Subscription management
    # ──────────────────────────────────────────

    async def subscribe(
        self,
        websocket: WebSocket,
        symbols: List[str],
        market: Market = Market.US,
        exchange: str = "NSE_EQ",
        interval: str = "1min",
    ) -> None:
        async with self._lock:
            sub = self._connections.get(websocket)
            if not sub:
                return

            # Remove old symbol index entries
            for old_sym in sub.symbols:
                self._symbol_index.get(old_sym, set()).discard(websocket)

            # Update subscription
            sub.symbols  = [s.upper() for s in symbols]
            sub.market   = market
            sub.exchange = exchange
            sub.interval = interval

            # Build new index entries
            for sym in sub.symbols:
                self._symbol_index.setdefault(sym, set()).add(websocket)

        logger.info(
            f"[WS] client_id={sub.client_id} subscribed → {sub.symbols} "
            f"market={market} exchange={exchange}"
        )

    async def unsubscribe(self, websocket: WebSocket, symbols: List[str]) -> None:
        async with self._lock:
            sub = self._connections.get(websocket)
            if not sub:
                return
            for sym in symbols:
                sym = sym.upper()
                if sym in sub.symbols:
                    sub.symbols.remove(sym)
                self._symbol_index.get(sym, set()).discard(websocket)

    # ──────────────────────────────────────────
    # Broadcast helpers
    # ──────────────────────────────────────────

    async def broadcast_to_symbol(self, symbol: str, payload: dict) -> None:
        """Send payload to all WebSockets subscribed to this symbol."""
        symbol = symbol.upper()
        watchers = list(self._symbol_index.get(symbol, set()))
        dead: List[WebSocket] = []

        for ws in watchers:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            self.disconnect(ws)

    async def broadcast_all(self, payload: dict) -> None:
        """Send to every connected WebSocket (e.g. heartbeat)."""
        dead: List[WebSocket] = []
        for ws in list(self._connections):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    # ──────────────────────────────────────────
    # Introspection
    # ──────────────────────────────────────────

    def get_subscriptions(self, websocket: WebSocket) -> Optional[Subscription]:
        return self._connections.get(websocket)

    def active_symbols(self) -> List[str]:
        return list(self._symbol_index.keys())

    def total_connections(self) -> int:
        return len(self._connections)

    def stats(self) -> dict:
        return {
            "total_connections": self.total_connections(),
            "active_symbols":    self.active_symbols(),
            "symbol_watcher_count": {
                sym: len(ws_set)
                for sym, ws_set in self._symbol_index.items()
            },
        }


# App-wide singleton
connection_manager = ConnectionManager()
