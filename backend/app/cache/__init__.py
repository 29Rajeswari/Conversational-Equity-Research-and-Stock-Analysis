"""
app/cache/__init__.py  ← NEW module

Thin cache layer with Redis primary, in-memory fallback.
Used by API routes to avoid hammering provider APIs.
"""

from .store import CacheStore, cache

__all__ = ["CacheStore", "cache"]
