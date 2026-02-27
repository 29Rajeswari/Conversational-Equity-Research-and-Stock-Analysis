"""
app/streaming/external_feeds.py

Background connectors to external market data WebSocket feeds.
The goal is to bridge provider streams (TwelveData, Upstox) into our
internal /ws/stream broadcast mechanism.

Architecture:
    TwelveData WS → Backend (this module) → connection_manager → clients
    Upstox WS    → Backend (this module) → connection_manager → clients

This is intentionally lightweight: we subscribe to symbols that any
client has asked for (via connection_manager.active_symbols()) and forward
any incoming messages to the appropriate watchers.  The provider message
format may vary but we assume there is a `symbol` field and `timestamp` etc.

To activate, call `init_external_streams()` from your app startup.
"""

import asyncio
import json
import logging
from typing import Set

import websockets

from app.config_market import market_settings
from app.streaming.connection_manager import connection_manager

logger = logging.getLogger(__name__)


class ProviderConnector:
    def __init__(self, name: str, url: str):
        self.name = name
        self.url = url
        self._ws = None  # websockets.asyncio.client.ClientConnection
        self._subs: Set[str] = set()
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        """Keep a websocket connection open and forward messages."""
        attempt_count = 0
        max_silent_attempts = 3  # Only log errors after N attempts to reduce noise
        
        while True:
            try:
                # Only log first attempt and every 10th retry to reduce noise
                should_log = attempt_count == 0 or (attempt_count % 10 == 0)
                if should_log:
                    logger.info(f"[ExternalFeed] Attempting to connect to {self.name} ({self.url})")
                
                async with websockets.connect(self.url, close_timeout=5) as ws:
                    attempt_count = 0  # Reset on successful connection
                    logger.info(f"[ExternalFeed] ✓ Connected to {self.name}")
                    self._ws = ws
                    await self._sync_subs()

                    async for msg in ws:
                        # ws library yields text messages already
                        try:
                            data = json.loads(msg)
                        except Exception:
                            continue

                        # determine symbol from payload; providers differ
                        sym = data.get('symbol') or data.get('s') or data.get('name')
                        if sym:
                            payload = {"type": data.get('type', 'candle'), "data": data}
                            await connection_manager.broadcast_to_symbol(sym, payload)
            except Exception as exc:
                attempt_count += 1
                # Only log errors after silent_attempts to reduce noise during startup/offline periods
                if attempt_count > max_silent_attempts:
                    logger.debug(f"[ExternalFeed] {self.name} connection attempt #{attempt_count} failed: {type(exc).__name__}: {exc}")
            
            # Backoff: start at 5s, increase after multiple failures
            backoff_delay = min(5 + (attempt_count // 5) * 5, 60)  # Cap at 60 seconds
            await asyncio.sleep(backoff_delay)

    async def update_subscriptions(self, symbols: Set[str]) -> None:
        """Synchronise provider subscriptions with the given set."""
        async with self._lock:
            new_syms = {s.upper() for s in symbols}
            added = new_syms - self._subs
            removed = self._subs - new_syms
            self._subs = new_syms

        for sym in added:
            await self._send_subscribe(sym)
        for sym in removed:
            await self._send_unsubscribe(sym)

    async def _sync_subs(self) -> None:
        async with self._lock:
            for sym in self._subs:
                await self._send_subscribe(sym)

    async def _send_subscribe(self, symbol: str) -> None:
        if not self._ws:
            return
        try:
            await self._ws.send(json.dumps({"action": "subscribe", "symbol": symbol}))
        except Exception as e:
            logger.warning(f"[{self.name}] failed to send subscribe {symbol}: {e}")

    async def _send_unsubscribe(self, symbol: str) -> None:
        if not self._ws:
            return
        try:
            await self._ws.send(json.dumps({"action": "unsubscribe", "symbol": symbol}))
        except Exception as e:
            logger.warning(f"[{self.name}] failed to send unsubscribe {symbol}: {e}")


class ExternalStreamManager:
    def __init__(self):
        self._twelve = ProviderConnector("TwelveData", market_settings.TWELVE_DATA_WS_URL)
        self._upstox = ProviderConnector("Upstox", market_settings.UPSTOX_WS_URL)
        # remember last-known symbol set to avoid unnecessary updates
        self._last_symbols: Set[str] = set()

    async def start(self) -> None:
        # launch provider loops
        asyncio.create_task(self._twelve.start())
        asyncio.create_task(self._upstox.start())
        # start polling connection_manager for subscription changes
        asyncio.create_task(self._poller())

    async def _poller(self) -> None:
        while True:
            await asyncio.sleep(5)
            symbols = set(connection_manager.active_symbols())
            if symbols != self._last_symbols:
                self._last_symbols = symbols
                await self._twelve.update_subscriptions(symbols)
                await self._upstox.update_subscriptions(symbols)


# module-level singleton
external_streamer = ExternalStreamManager()


async def init_external_streams() -> None:
    """Start the background tasks.  Call from application startup."""
    await external_streamer.start()
