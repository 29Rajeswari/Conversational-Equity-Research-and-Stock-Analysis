"""
app/utils/market_utils.py

Utility functions for market operations.
"""

from datetime import datetime, time, timedelta
import pytz
from app.schemas.market import Market


def get_market_status(market: Market) -> dict:
    """
    Determine if a market is currently open or closed.
    
    Returns:
        {
            "status": "open" | "closed",
            "is_open": bool,
            "open_time": "09:30",  # in market timezone
            "close_time": "16:00",
            "timezone": "America/New_York" | "Asia/Kolkata",
        }
    """
    if market == Market.US:
        tz = pytz.timezone("America/New_York")
        now = datetime.now(tz)
        
        # US market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
        market_open = time(9, 30)
        market_close = time(16, 0)
        
        # Check if today is a weekday (0=Monday, 6=Sunday)
        is_weekday = now.weekday() < 5
        
        # Check if within trading hours
        is_open = (
            is_weekday
            and market_open <= now.time() < market_close
        )
        
        return {
            "status": "open" if is_open else "closed",
            "is_open": is_open,
            "open_time": "09:30",
            "close_time": "16:00",
            "timezone": "America/New_York",
        }
    
    elif market == Market.INDIA:
        tz = pytz.timezone("Asia/Kolkata")
        now = datetime.now(tz)
        
        # NSE market hours: 9:15 AM - 3:30 PM IST, Monday-Friday
        market_open = time(9, 15)
        market_close = time(15, 30)
        
        # Check if today is a weekday
        is_weekday = now.weekday() < 5
        
        # Check if within trading hours
        is_open = (
            is_weekday
            and market_open <= now.time() < market_close
        )
        
        return {
            "status": "open" if is_open else "closed",
            "is_open": is_open,
            "open_time": "09:15",
            "close_time": "15:30",
            "timezone": "Asia/Kolkata",
        }
    
    # Unknown market
    return {
        "status": "unknown",
        "is_open": False,
        "open_time": None,
        "close_time": None,
        "timezone": None,
    }
