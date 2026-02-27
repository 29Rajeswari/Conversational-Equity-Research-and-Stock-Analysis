"""
app/streaming/__init__.py

Real-time WebSocket streaming layer.
Sits on top of the existing market_data module.
"""

from .connection_manager import ConnectionManager
from .stream_router import router as stream_router

__all__ = ["ConnectionManager", "stream_router"]
