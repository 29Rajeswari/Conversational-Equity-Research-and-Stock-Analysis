"""
app/services/symbol_resolver.py  ← NEW service

Intelligent symbol resolution:
- Input: "AAPL", "Apple", "MSFT", "Microsoft", "HINDCOPPER", "Reliance"
- Output: { symbol, company_name, market, exchange, confidence }

Uses:
1. Exact symbol match (AAPL → AAPL)
2. Built-in name database (Apple → AAPL)
3. Fuzzy matching (Microsft → MSFT)
4. API verification (checks if symbol exists)
"""

import re
from typing import Dict, List, Tuple
from difflib import SequenceMatcher

from app.market_data.dispatcher import MarketDataDispatcher


class SymbolResolverService:
    """
    Resolves user queries to stock symbols with market detection.
    
    Resolution priority:
    1. Exact symbol match (AAPL, HINDCOPPER)
    2. Company name lookup (Apple, Microsoft)
    3. Fuzzy matching (Microsft → MSFT)
    4. API verification (try US, then India)
    """
    
    def __init__(self):
        self.dispatcher = MarketDataDispatcher()
        self._load_symbol_database()
    
    def _load_symbol_database(self):
        """Load symbol mappings (extend with external DB in production)"""
        self.symbol_db = {
            # US Tech
            'AAPL': {'name': 'Apple Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            'MSFT': {'name': 'Microsoft Corporation', 'market': 'US', 'exchange': 'NASDAQ'},
            'GOOGL': {'name': 'Alphabet Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            'GOOG': {'name': 'Alphabet Inc. (Class C)', 'market': 'US', 'exchange': 'NASDAQ'},
            'AMZN': {'name': 'Amazon.com Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            'META': {'name': 'Meta Platforms Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            'TSLA': {'name': 'Tesla Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            'NVDA': {'name': 'NVIDIA Corporation', 'market': 'US', 'exchange': 'NASDAQ'},
            'NFLX': {'name': 'Netflix Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            'ORCL': {'name': 'Oracle Corporation', 'market': 'US', 'exchange': 'NYSE'},
            'INTC': {'name': 'Intel Corporation', 'market': 'US', 'exchange': 'NASDAQ'},
            'AMD': {'name': 'Advanced Micro Devices Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            'CRM': {'name': 'Salesforce Inc.', 'market': 'US', 'exchange': 'NYSE'},
            'ADBE': {'name': 'Adobe Inc.', 'market': 'US', 'exchange': 'NASDAQ'},
            
            # US Finance
            'JPM': {'name': 'JPMorgan Chase & Co.', 'market': 'US', 'exchange': 'NYSE'},
            'BAC': {'name': 'Bank of America Corp.', 'market': 'US', 'exchange': 'NYSE'},
            'WFC': {'name': 'Wells Fargo & Company', 'market': 'US', 'exchange': 'NYSE'},
            'GS': {'name': 'Goldman Sachs Group Inc.', 'market': 'US', 'exchange': 'NYSE'},
            'MS': {'name': 'Morgan Stanley', 'market': 'US', 'exchange': 'NYSE'},
            
            # US Consumer
            'WMT': {'name': 'Walmart Inc.', 'market': 'US', 'exchange': 'NYSE'},
            'HD': {'name': 'Home Depot Inc.', 'market': 'US', 'exchange': 'NYSE'},
            'MCD': {'name': "McDonald's Corporation", 'market': 'US', 'exchange': 'NYSE'},
            'NKE': {'name': 'Nike Inc.', 'market': 'US', 'exchange': 'NYSE'},
            'SBUX': {'name': 'Starbucks Corporation', 'market': 'US', 'exchange': 'NASDAQ'},
            
            # India
            'RELIANCE': {'name': 'Reliance Industries Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'TCS': {'name': 'Tata Consultancy Services Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'HDFCBANK': {'name': 'HDFC Bank Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'INFY': {'name': 'Infosys Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'ICICIBANK': {'name': 'ICICI Bank Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'HINDUNILVR': {'name': 'Hindustan Unilever Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'BHARTIARTL': {'name': 'Bharti Airtel Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'SBIN': {'name': 'State Bank of India', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'HINDCOPPER': {'name': 'Hindustan Copper Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'ITC': {'name': 'ITC Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'KOTAKBANK': {'name': 'Kotak Mahindra Bank Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'LT': {'name': 'Larsen & Toubro Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'ASIANPAINT': {'name': 'Asian Paints Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'MARUTI': {'name': 'Maruti Suzuki India Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'WIPRO': {'name': 'Wipro Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'ONGC': {'name': 'Oil & Natural Gas Corporation Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
            'NTPC': {'name': 'NTPC Ltd.', 'market': 'INDIA', 'exchange': 'NSE_EQ'},
        }
        
        # Build reverse lookup: name → symbol
        self.name_to_symbol = {}
        for symbol, data in self.symbol_db.items():
            # Full name
            name_lower = data['name'].lower()
            self.name_to_symbol[name_lower] = symbol
            
            # Short name (before first comma/period)
            short_name = re.split(r'[,\.]', data['name'])[0].lower()
            if short_name not in self.name_to_symbol:
                self.name_to_symbol[short_name] = symbol
            
            # Remove suffixes (Inc., Ltd., Corporation, etc.)
            clean_name = re.sub(r'\s+(Inc|Ltd|Corporation|Corp|Co|Company|Group)\.?$', '', short_name, flags=re.IGNORECASE)
            if clean_name not in self.name_to_symbol:
                self.name_to_symbol[clean_name] = symbol
    
    # ────────────────────────────────────────────────────────────────────────
    # Main resolution method
    # ────────────────────────────────────────────────────────────────────────
    
    async def resolve(self, query: str) -> Dict:
        """
        Resolve query to symbol with metadata.
        
        Returns:
            {
                "original_query": str,
                "resolved_symbol": str,
                "company_name": str,
                "market": "US" | "INDIA",
                "exchange": str,
                "confidence": float  # 0.0 - 1.0
            }
        
        Raises:
            ValueError: If symbol cannot be resolved
        """
        query = query.strip()
        upper_query = query.upper()
        lower_query = query.lower()
        
        # ─── Strategy 1: Exact symbol match ─────────────────────────────────
        if upper_query in self.symbol_db:
            data = self.symbol_db[upper_query]
            return {
                "original_query": query,
                "resolved_symbol": upper_query,
                "company_name": data['name'],
                "market": data['market'],
                "exchange": data['exchange'],
                "confidence": 1.0
            }
        
        # ─── Strategy 2: Company name lookup ────────────────────────────────
        if lower_query in self.name_to_symbol:
            symbol = self.name_to_symbol[lower_query]
            data = self.symbol_db[symbol]
            return {
                "original_query": query,
                "resolved_symbol": symbol,
                "company_name": data['name'],
                "market": data['market'],
                "exchange": data['exchange'],
                "confidence": 1.0
            }
        
        # ─── Strategy 3: Fuzzy matching ─────────────────────────────────────
        fuzzy_result = self._fuzzy_match(lower_query)
        if fuzzy_result:
            symbol, confidence = fuzzy_result
            data = self.symbol_db[symbol]
            if confidence > 0.8:  # High confidence threshold
                return {
                    "original_query": query,
                    "resolved_symbol": symbol,
                    "company_name": data['name'],
                    "market": data['market'],
                    "exchange": data['exchange'],
                    "confidence": confidence
                }
        
        # ─── Strategy 4: API verification (try both markets) ───────────────
        # Check if it's a valid symbol by querying the API
        verified = await self._verify_symbol_via_api(upper_query)
        if verified:
            return {
                "original_query": query,
                "resolved_symbol": upper_query,
                "company_name": upper_query,  # Use symbol as name
                "market": verified['market'],
                "exchange": verified['exchange'],
                "confidence": 0.7  # Lower confidence (not in DB)
            }
        
        # ─── Failed to resolve ──────────────────────────────────────────────
        raise ValueError(f"Could not resolve '{query}' to a valid stock symbol")
    
    # ────────────────────────────────────────────────────────────────────────
    # Helper methods
    # ────────────────────────────────────────────────────────────────────────
    
    def _fuzzy_match(self, query: str) -> Tuple[str, float]:
        """
        Find closest matching company name using fuzzy string matching.
        Returns: (symbol, confidence_score) or None
        """
        best_match = None
        best_score = 0.0
        
        for name, symbol in self.name_to_symbol.items():
            score = SequenceMatcher(None, query, name).ratio()
            if score > best_score:
                best_score = score
                best_match = symbol
        
        if best_match and best_score > 0.6:  # Minimum threshold
            return (best_match, best_score)
        
        return None
    
    async def _verify_symbol_via_api(self, symbol: str) -> Dict:
        """
        Verify if symbol exists by querying providers.
        Returns: {market, exchange} or None
        """
        # Try US first (more common)
        try:
            quote = await self.dispatcher.get_quote(symbol, "US", "NASDAQ")
            if quote:
                return {"market": "US", "exchange": "NASDAQ"}
        except:
            pass
        
        # Try India
        try:
            quote = await self.dispatcher.get_quote(symbol, "INDIA", "NSE_EQ")
            if quote:
                return {"market": "INDIA", "exchange": "NSE_EQ"}
        except:
            pass
        
        return None
    
    # ────────────────────────────────────────────────────────────────────────
    # Autocomplete suggestions
    # ────────────────────────────────────────────────────────────────────────
    
    def suggest(self, query: str, limit: int = 10) -> List[Dict]:
        """
        Generate autocomplete suggestions.
        
        Returns:
            [
                {
                    "symbol": "AAPL",
                    "name": "Apple Inc.",
                    "market": "US",
                    "exchange": "NASDAQ"
                },
                ...
            ]
        """
        query_lower = query.lower()
        suggestions = []
        
        for symbol, data in self.symbol_db.items():
            # Match symbol
            if symbol.lower().startswith(query_lower):
                suggestions.append({
                    "symbol": symbol,
                    "name": data['name'],
                    "market": data['market'],
                    "exchange": data['exchange'],
                    "match_type": "symbol"
                })
            # Match company name
            elif query_lower in data['name'].lower():
                suggestions.append({
                    "symbol": symbol,
                    "name": data['name'],
                    "market": data['market'],
                    "exchange": data['exchange'],
                    "match_type": "name"
                })
        
        # Sort: exact symbol matches first, then name matches
        suggestions.sort(key=lambda x: (x['match_type'] != 'symbol', x['symbol']))
        
        return suggestions[:limit]
