/**
 * src/pages/UnifiedDashboard.jsx
 * 
 * Example dashboard using the unified search API
 */

import { useState } from 'react';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';

export default function UnifiedDashboard() {
  const [query, setQuery] = useState('');
  const { loading, error, results, executeSearch } = useUnifiedSearch();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    await executeSearch({
      query: query.trim(),
      // Omit 'market' to auto-detect
      // Omit 'include' to get all data (quote, chart, fundamentals, depth)
    });
  };

  const handleQuickSearch = async (symbol) => {
    setQuery(symbol);
    await executeSearch({ query: symbol });
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>Unified Stock Search</h1>
        <p>One search, complete data</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Symbol or company name (AAPL, Apple, Oracle, HINDCOPPER...)"
          className="search-input"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Quick Actions */}
      <div className="quick-actions">
        <span>Quick:</span>
        {['AAPL', 'MSFT', 'TSLA', 'HINDCOPPER', 'RELIANCE'].map((sym) => (
          <button
            key={sym}
            onClick={() => handleQuickSearch(sym)}
            className="quick-btn"
          >
            {sym}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      <div className="results">
        {results.map((stock) => (
          <StockCard key={stock.symbol} stock={stock} />
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Stock Card Component
// ────────────────────────────────────────────────────────────────────────────

function StockCard({ stock }) {
  if (stock.error) {
    return (
      <div className="stock-card stock-card--error">
        <h3>{stock.symbol}</h3>
        <p>Error: {stock.error}</p>
      </div>
    );
  }

  const { symbol, name, market, quote, chart, fundamentals, depth } = stock;
  const isPositive = quote?.change_percent >= 0;

  return (
    <div className="stock-card">
      {/* Header */}
      <div className="stock-card__header">
        <div>
          <h3>{symbol}</h3>
          <p className="stock-card__name">{name}</p>
          <span className="stock-card__market">
            {market === 'INDIA' ? '🇮🇳 India' : '🇺🇸 US'}
          </span>
        </div>
      </div>

      {/* Quote */}
      {quote && (
        <div className="stock-card__quote">
          <div className="stock-card__price">
            {market === 'INDIA' ? '₹' : '$'}
            {quote.price.toFixed(2)}
          </div>
          <div
            className={`stock-card__change ${isPositive ? 'positive' : 'negative'}`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(quote.change).toFixed(2)} (
            {Math.abs(quote.change_percent).toFixed(2)}%)
          </div>
          <div className="stock-card__meta">
            Vol: {quote.volume.toLocaleString()} | High: {quote.high} | Low:{' '}
            {quote.low}
          </div>
        </div>
      )}

      {/* Chart Data Available */}
      {chart && chart.length > 0 && (
        <div className="stock-card__section">
          <strong>Chart:</strong> {chart.length} candles
        </div>
      )}

      {/* Fundamentals */}
      {fundamentals && (
        <div className="stock-card__section">
          <strong>Fundamentals:</strong>
          {fundamentals.pe_ratio && <span>P/E: {fundamentals.pe_ratio}</span>}
          {fundamentals.market_cap && (
            <span>
              Mkt Cap:{' '}
              {(fundamentals.market_cap / 1e9).toFixed(2)}B
            </span>
          )}
        </div>
      )}

      {/* Market Depth (India only) */}
      {depth && (
        <div className="stock-card__section">
          <strong>Market Depth:</strong>
          <div className="depth-bar">
            <div
              className="depth-bar__buy"
              style={{ width: `${depth.buy_percentage}%` }}
            >
              {depth.buy_percentage.toFixed(1)}% Buy
            </div>
            <div
              className="depth-bar__sell"
              style={{ width: `${depth.sell_percentage}%` }}
            >
              {depth.sell_percentage.toFixed(1)}% Sell
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="stock-card__footer">
        <small>Source: {stock.data_source}</small>
        <small>{new Date(stock.timestamp).toLocaleTimeString()}</small>
      </div>
    </div>
  );
}
