/**
 * src/api/market.js  ← NEW file
 * Drop alongside existing auth.js and search.js — do not modify those.
 *
 * Handles all market data HTTP calls to the backend.
 * WebSocket streaming is handled separately in src/websocket/
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API  = `${BASE}/api/v1/market`;

// ─── generic fetch wrapper ───────────────────────────────────────────────────

async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(err.detail ?? 'API error'), { status: res.status });
  }

  return res.json();
}

// ─── Quote ───────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/market/quote
 * @param {string} symbol   e.g. "AAPL" | "HINDCOPPER"
 * @param {string} market   "US" | "INDIA"
 * @param {string} exchange "NSE_EQ" | "BSE_EQ" | "NYSE" | "NASDAQ"
 */
export async function fetchQuote(symbol, market = 'US', exchange = 'NSE_EQ') {
  const params = new URLSearchParams({ symbol, market, exchange });
  return apiFetch(`${API}/quote?${params}`);
}

// ─── Chart / OHLCV ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/market/chart
 * @param {Object} opts
 * @param {string} opts.symbol
 * @param {string} opts.market      "US" | "INDIA"
 * @param {string} opts.interval    "1min" | "5min" | "15min" | "30min" | "1h" | "1day"
 * @param {number} opts.outputsize  number of candles (default 100)
 * @param {string} opts.exchange
 * @param {string} opts.from_date   ISO date string (optional)
 * @param {string} opts.to_date     ISO date string (optional)
 */
export async function fetchChart({
  symbol,
  market = 'US',
  interval = '5min',
  outputsize = 100,
  exchange = 'NSE_EQ',
  from_date,
  to_date,
}) {
  return apiFetch(`${API}/chart`, {
    method: 'POST',
    body: JSON.stringify({ symbol, market, interval, outputsize, exchange, from_date, to_date }),
  });
}

// ─── Watchlist batch quotes ───────────────────────────────────────────────────

/**
 * POST /api/v1/market/watchlist
 * @param {string[]} symbols
 * @param {string}   market   "US" | "INDIA"
 */
export async function fetchWatchlistQuotes(symbols, market = 'US', exchange = 'NSE_EQ') {
  return apiFetch(`${API}/watchlist`, {
    method: 'POST',
    body: JSON.stringify({ symbols, market, exchange }),
  });
}

// ─── Market Depth (India only) ────────────────────────────────────────────────

/**
 * POST /api/v1/market/depth
 * @param {string} symbol
 * @param {string} exchange "NSE_EQ" | "BSE_EQ"
 */
export async function fetchMarketDepth(symbol, exchange = 'NSE_EQ') {
  return apiFetch(`${API}/depth`, {
    method: 'POST',
    body: JSON.stringify({ symbol, exchange }),
  });
}

// ─── Full stock detail (quote + chart + fundamentals + depth) ─────────────────

/**
 * GET /api/v1/market/detail/:symbol
 * Returns StockDetail: { quote, performance, fundamentals, depth, chart }
 */
export async function fetchStockDetail(symbol, market = 'US', exchange = 'NSE_EQ', interval = '5min') {
  const params = new URLSearchParams({ market, exchange, interval });
  return apiFetch(`${API}/detail/${symbol}?${params}`);
}

// ─── API key usage stats ──────────────────────────────────────────────────────

export async function fetchApiUsage() {
  return apiFetch(`${API}/usage`);
}
