"""
app/cache/store.py

Redis-first cache with automatic in-memory fallback.
Import the singleton `cache` wherever you need caching.

Usage:
    from app.cache import cache

    await cache.set("quote:AAPL", quote_json, ttl=15)
    data = await cache.get("quote:AAPL")
    await cache.delete("quote:AAPL")
    await cache.clear_prefix("quote:")
"""

import asyncio
import json
import logging
import time
from typing import Any, Dict, Optional, Tuple

logger = logging.getLogger(__name__)


# ──────────────────────────────────────────────
# In-memory backend (fallback)
# ──────────────────────────────────────────────

class _MemoryBackend:
    """Simple TTL-aware dict. Used when Redis is unavailable."""

    def __init__(self):
        # key → (value_str, expires_at)
        self._store: Dict[str, Tuple[str, float]] = {}

    def get(self, key: str) -> Optional[str]:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if expires_at and time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: str, ttl: int = 60) -> None:
        expires_at = time.monotonic() + ttl if ttl else 0.0
        self._store[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear_prefix(self, prefix: str) -> int:
        to_delete = [k for k in self._store if k.startswith(prefix)]
        for k in to_delete:
            del self._store[k]
        return len(to_delete)

    def stats(self) -> dict:
        now = time.monotonic()
        alive = sum(1 for _, exp in self._store.values() if not exp or exp > now)
        return {"backend": "memory", "total_keys": len(self._store), "alive_keys": alive}


# ──────────────────────────────────────────────
# CacheStore — public interface
# ──────────────────────────────────────────────

class CacheStore:
    """
    Async cache store.
    Tries Redis on first call; falls back to in-memory if unavailable.
    """

    def __init__(self, redis_url: Optional[str] = None, default_ttl: int = 30):
        self._redis_url = redis_url
        self._default_ttl = default_ttl
        self._redis = None
        self._memory = _MemoryBackend()
        self._using_redis = False

    async def _init_redis(self) -> None:
        """Lazy Redis init — called on first cache operation."""
        if self._redis is not None or not self._redis_url:
            return
        try:
            import redis.asyncio as aioredis  # type: ignore
            client = aioredis.from_url(self._redis_url, decode_responses=True)
            await client.ping()
            self._redis = client
            self._using_redis = True
            logger.info("[Cache] Redis connected.")
        except Exception as exc:
            logger.warning(f"[Cache] Redis unavailable ({exc}). Using in-memory cache.")
            self._redis = None

    # ──────────────────────────────────────────
    # Core operations
    # ──────────────────────────────────────────

    async def get(self, key: str) -> Optional[Any]:
        await self._init_redis()
        try:
            if self._using_redis:
                raw = await self._redis.get(key)
            else:
                raw = self._memory.get(key)

            return json.loads(raw) if raw else None
        except Exception as exc:
            logger.warning(f"[Cache] get({key}) failed: {exc}")
            return None

    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        await self._init_redis()
        ttl = ttl if ttl is not None else self._default_ttl
        serialized = json.dumps(value, default=str)
        try:
            if self._using_redis:
                await self._redis.setex(key, ttl, serialized)
            else:
                self._memory.set(key, serialized, ttl)
        except Exception as exc:
            logger.warning(f"[Cache] set({key}) failed: {exc}")

    async def delete(self, key: str) -> None:
        await self._init_redis()
        try:
            if self._using_redis:
                await self._redis.delete(key)
            else:
                self._memory.delete(key)
        except Exception as exc:
            logger.warning(f"[Cache] delete({key}) failed: {exc}")

    async def clear_prefix(self, prefix: str) -> int:
        """Delete all keys with this prefix. Returns count deleted."""
        await self._init_redis()
        try:
            if self._using_redis:
                keys = await self._redis.keys(f"{prefix}*")
                if keys:
                    await self._redis.delete(*keys)
                return len(keys)
            else:
                return self._memory.clear_prefix(prefix)
        except Exception as exc:
            logger.warning(f"[Cache] clear_prefix({prefix}) failed: {exc}")
            return 0

    async def get_or_set(self, key: str, factory, ttl: Optional[int] = None) -> Any:
        """
        Return cached value if it exists, otherwise call factory() to compute,
        cache, and return it.

        Example:
            data = await cache.get_or_set(
                f"quote:{symbol}",
                lambda: dispatcher.get_quote(symbol),
                ttl=10
            )
        """
        cached = await self.get(key)
        if cached is not None:
            return cached

        value = await factory() if asyncio.iscoroutinefunction(factory) else factory()
        if value is not None:
            # Pydantic model → dict before caching
            if hasattr(value, "model_dump"):
                value = value.model_dump()
            await self.set(key, value, ttl)
        return value

    def stats(self) -> dict:
        if self._using_redis:
            return {"backend": "redis", "url": self._redis_url}
        return self._memory.stats()


# ──────────────────────────────────────────────
# App-wide singleton
# ──────────────────────────────────────────────

# Initialised without Redis URL — will use memory by default.
# Override in startup: cache._redis_url = settings.REDIS_URL
cache = CacheStore()
