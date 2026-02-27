/**
 * src/services/marketService.js
 * 
 * Unified API client for all market data endpoints.
 * Connects to FastAPI backend shown in Swagger screenshot.
 * Handles retries, error formatting, and response normalization.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ────────────────────────────────────────────────────────────────────────────
// Core fetch wrapper with retry logic
// ────────────────────────────────────────────────────────────────────────────

async function fetchWithRetry(url, options = {}, maxRetries = 2) {
  const token = localStorage.getItem('access_token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, config);
      
      // Handle 429 (rate limit) - backend will auto-rotate keys
      if (response.status === 429) {
        if (attempt < maxRetries) {
          await sleep(1000 * (attempt + 1)); // exponential backoff
          continue;
        }
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          detail: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new ApiError(error.detail || 'Request failed', response.status);
      }

      return await response.json();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && err.name === 'TypeError') {
        // Network error - retry
        await sleep(1000 * (attempt + 1));
        continue;
      }
      break;
    }
  }
  
  throw lastError;
}

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ────────────────────────────────────────────────────────────────────────────
// Market Data API Methods
// ────────────────────────────────────────────────────────────────────────────

export const marketService = {
  
  /**
   * GET /api/v1/market/quote
   * Fetch single stock quote
   */
  async getQuote(symbol, market = 'US', exchange = 'NSE_EQ') {
    const params = new URLSearchParams({ symbol, market, exchange });
    return fetchWithRetry(`${API_BASE}/api/v1/market/quote?${params}`);
  },

  /**
   * POST /api/v1/market/chart
   * Fetch OHLCV chart data
   */
  async getChart(payload) {
    return fetchWithRetry(`${API_BASE}/api/v1/market/chart`, {
      method: 'POST',
      body: JSON.stringify({
        symbol: payload.symbol,
        market: payload.market || 'US',
        interval: payload.interval || '5min',
        outputsize: payload.outputsize || 100,
        exchange: payload.exchange || 'NSE_EQ',
        from_date: payload.from_date,
        to_date: payload.to_date,
      }),
    });
  },

  /**
   * POST /api/v1/market/watchlist
   * Fetch batch quotes for multiple symbols
   */
  async getWatchlistQuotes(symbols, market = 'US', exchange = 'NSE_EQ') {
    return fetchWithRetry(`${API_BASE}/api/v1/market/watchlist`, {
      method: 'POST',
      body: JSON.stringify({ symbols, market, exchange }),
    });
  },

  /**
   * POST /api/v1/market/depth
   * Fetch market depth (order book) - India only
   */
  async getMarketDepth(symbol, exchange = 'NSE_EQ') {
    return fetchWithRetry(`${API_BASE}/api/v1/market/depth`, {
      method: 'POST',
      body: JSON.stringify({ symbol, exchange }),
    });
  },

  /**
   * GET /api/v1/market/detail/{symbol}
   * Fetch complete stock detail (quote + chart + fundamentals + depth)
   * This is the MAIN endpoint for the smart search - returns everything at once
   */
  async getStockDetail(symbol, market = 'US', exchange = 'NSE_EQ', interval = '5min') {
    const params = new URLSearchParams({ market, exchange, interval });
    return fetchWithRetry(`${API_BASE}/api/v1/market/detail/${symbol}?${params}`);
  },

  /**
   * GET /api/v1/market/usage
   * Get API key usage statistics (admin)
   */
  async getApiUsage() {
    return fetchWithRetry(`${API_BASE}/api/v1/market/usage`);
  },

  // ────────────────────────────────────────────────────────────────────────
  // Symbol Search & Normalization
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Smart symbol resolver
   * Input: "AAPL", "Apple", "HINDCOPPER", "Hindustan Copper"
   * Output: { symbol, market, exchange }
   */
  async searchSymbol(query) {
    // Try exact symbol match first
    const upperQuery = query.toUpperCase().trim();
    
    // US symbols (simple alphanumeric check)
    if (/^[A-Z]{1,5}$/.test(upperQuery)) {
      try {
        const quote = await this.getQuote(upperQuery, 'US');
        if (quote) {
          return {
            symbol: upperQuery,
            market: 'US',
            exchange: 'NASDAQ',
            name: upperQuery,
            found: true,
          };
        }
      } catch {
        // Try India next
      }
    }

    // Indian symbols - try NSE
    try {
      const quote = await this.getQuote(upperQuery, 'INDIA', 'NSE_EQ');
      if (quote) {
        return {
          symbol: upperQuery,
          market: 'INDIA',
          exchange: 'NSE_EQ',
          name: upperQuery,
          found: true,
        };
      }
    } catch {
      // Symbol not found
    }

    // Fallback: use common name mappings
    const mapped = this._mapCommonNames(query);
    if (mapped) return { ...mapped, found: true };

    return {
      symbol: upperQuery,
      market: 'US',
      exchange: 'NASDAQ',
      name: upperQuery,
      found: false,
    };
  },

  /**
   * Map common company names to ticker symbols
   * (Extend this with a proper symbol database in production)
   */
  _mapCommonNames(query) {
    const map = {
      // US
      'apple': { symbol: 'AAPL', market: 'US', exchange: 'NASDAQ', name: 'Apple Inc.' },
      'microsoft': { symbol: 'MSFT', market: 'US', exchange: 'NASDAQ', name: 'Microsoft Corporation' },
      'google': { symbol: 'GOOGL', market: 'US', exchange: 'NASDAQ', name: 'Alphabet Inc.' },
      'amazon': { symbol: 'AMZN', market: 'US', exchange: 'NASDAQ', name: 'Amazon.com Inc.' },
      'tesla': { symbol: 'TSLA', market: 'US', exchange: 'NASDAQ', name: 'Tesla, Inc.' },
      'nvidia': { symbol: 'NVDA', market: 'US', exchange: 'NASDAQ', name: 'NVIDIA Corporation' },
      'meta': { symbol: 'META', market: 'US', exchange: 'NASDAQ', name: 'Meta Platforms, Inc.' },
      'netflix': { symbol: 'NFLX', market: 'US', exchange: 'NASDAQ', name: 'Netflix, Inc.' },
      'oracle': { symbol: 'ORCL', market: 'US', exchange: 'NYSE', name: 'Oracle Corporation' },
      
      // India
      'reliance': { symbol: 'RELIANCE', market: 'INDIA', exchange: 'NSE_EQ', name: 'Reliance Industries Ltd.' },
      'tcs': { symbol: 'TCS', market: 'INDIA', exchange: 'NSE_EQ', name: 'Tata Consultancy Services Ltd.' },
      'infosys': { symbol: 'INFY', market: 'INDIA', exchange: 'NSE_EQ', name: 'Infosys Ltd.' },
      'hdfc': { symbol: 'HDFCBANK', market: 'INDIA', exchange: 'NSE_EQ', name: 'HDFC Bank Ltd.' },
      'icici': { symbol: 'ICICIBANK', market: 'INDIA', exchange: 'NSE_EQ', name: 'ICICI Bank Ltd.' },
      'bharti': { symbol: 'BHARTIARTL', market: 'INDIA', exchange: 'NSE_EQ', name: 'Bharti Airtel Ltd.' },
      'hindustan copper': { symbol: 'HINDCOPPER', market: 'INDIA', exchange: 'NSE_EQ', name: 'Hindustan Copper Ltd.' },
      'hindcopper': { symbol: 'HINDCOPPER', market: 'INDIA', exchange: 'NSE_EQ', name: 'Hindustan Copper Ltd.' },
    };

    const key = query.toLowerCase().trim();
    return map[key] || null;
  },

  // ────────────────────────────────────────────────────────────────────────
  // Batch operations for efficiency
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Fetch complete data for multiple symbols in parallel
   * Used by watchlist to minimize API calls
   */
  async batchFetchDetails(symbolConfigs) {
    const promises = symbolConfigs.map(({ symbol, market, exchange }) =>
      this.getStockDetail(symbol, market, exchange).catch(err => ({
        error: err.message,
        symbol,
      }))
    );
    return Promise.all(promises);
  },
};

export { ApiError };
