/**
 * src/services/unifiedMarketService.js
 * 
 * ONE function for all market data: search()
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function search({
  query,
  market = null,
  exchange = 'NSE_EQ',
  include = null,
  interval = '5min',
  chartSize = 100,
}) {
  const token = localStorage.getItem('access_token');

  const response = await fetch(`${API_BASE}/api/v1/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({
      query,
      market,
      exchange,
      include,
      interval,
      chart_size: chartSize,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || 'Search failed');
  }

  return response.json();
}

// Convenience wrappers
export const getQuote = (symbol, market) => 
  search({ query: symbol, market, include: ['quote'] }).then(r => r.results[0]?.quote);

export const getChart = (symbol, market, interval, size) => 
  search({ query: symbol, market, interval, chartSize: size, include: ['chart'] }).then(r => r.results[0]?.chart || []);

export const getWatchlist = (symbols, market) => 
  search({ query: symbols, market, include: ['quote'] }).then(r => r.results.map(x => x.quote).filter(Boolean));

export const getStockDetail = (symbol, market) => 
  search({ query: symbol, market }).then(r => r.results[0]);

export async function getApiUsage() {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}/api/v1/search/usage`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.json();
}

export default { search, getQuote, getChart, getWatchlist, getStockDetail, getApiUsage };
