/**
 * src/services/unifiedSearchService.js
 * 
 * REPLACES: marketService.js with 6 separate API calls
 * 
 * Single service: ONE method call → complete stock data
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const SEARCH_ENDPOINT = `${API_BASE}/api/v1/search`;

// Core fetch wrapper
async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }

  return res.json();
}

// ────────────────────────────────────────────────────────────────────────────
// Unified Search Service
// ────────────────────────────────────────────────────────────────────────────

export const unifiedSearchService = {
  
  /**
   * Search stock - ONE call gets everything
   * 
   * @param {string} query - Symbol or company name (AAPL, Apple, HINDCOPPER, Oracle)
   * @param {Object} options - Optional overrides
   * @returns {Promise<Object>} Complete stock data
   * 
   * Response structure:
   * {
   *   resolved: { symbol, name, market, exchange, confidence },
   *   quote: { price, change, change_percent, volume, high, low, ... },
   *   performance: { today_low, today_high, current, open, prev_close, volume },
   *   chart: [{ timestamp, open, high, low, close, volume }, ...],
   *   fundamentals: { market_cap, pe_ratio, roe, eps, ... },
   *   depth: { buy_orders, sell_orders, buy_percentage, sell_percentage },
   *   processing_time_ms: 234
   * }
   */
  async search(query, options = {}) {
    const payload = {
      query,
      market: options.market,              // Optional: 'US' | 'INDIA'
      exchange: options.exchange,          // Optional: 'NSE_EQ' | 'NASDAQ' | 'NYSE'
      interval: options.interval || '5min', // Chart interval
      chart_size: options.chart_size || 100,
      include_depth: options.include_depth !== false,
      include_fundamentals: options.include_fundamentals !== false,
      include_chart: options.include_chart !== false,
    };

    return apiFetch(`${SEARCH_ENDPOINT}/stock`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Batch search for watchlist/portfolio
   * 
   * @param {string[]} queries - Array of symbols/names
   * @param {string} market - Optional market filter
   * @returns {Promise<Object>} { results: [...], total: N }
   */
  async searchBatch(queries, market = null) {
    return apiFetch(`${SEARCH_ENDPOINT}/batch`, {
      method: 'POST',
      body: JSON.stringify({ queries, market }),
    });
  },

  /**
   * Get API key usage stats
   */
  async getStats() {
    return apiFetch(`${SEARCH_ENDPOINT}/stats`);
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Comparison: OLD vs NEW
// ────────────────────────────────────────────────────────────────────────────

/*
OLD WAY (6 API calls):
  const quote = await marketService.getQuote('AAPL', 'US');
  const chart = await marketService.getChart({symbol: 'AAPL', market: 'US'});
  const depth = await marketService.getMarketDepth('AAPL', 'NSE_EQ');
  const detail = await marketService.getStockDetail('AAPL', 'US');
  const fundamentals = await marketService.getFundamentals('AAPL');
  const watchlist = await marketService.getWatchlistQuotes(['AAPL', 'MSFT']);

NEW WAY (1 API call):
  const data = await unifiedSearchService.search('AAPL');
  // Returns: quote, chart, depth, fundamentals, performance — all in one response!

Batch OLD (N separate calls):
  const results = await Promise.all(
    symbols.map(s => marketService.getQuote(s))
  );

Batch NEW (1 call):
  const { results } = await unifiedSearchService.searchBatch(['AAPL', 'MSFT', 'GOOGL']);
*/
