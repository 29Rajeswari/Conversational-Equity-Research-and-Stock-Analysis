/**
 * src/pages/SmartStockSearchPage.jsx
 * 
 * Main page that combines:
 * - Smart search bar (auto-complete, history)
 * - Auto-populated stock display (quote, chart, depth, fundamentals)
 * - Real-time WebSocket updates
 * - Error handling
 * 
 * Route: /search  or  /
 */

import { useState } from 'react';
import SmartSearchBar from '@/components/SmartSearchBar';
import StockDataDisplay from '@/components/StockDataDisplay';
import { AlertCircle, TrendingUp, Clock, BarChart3 } from 'lucide-react';

export default function SmartStockSearchPage() {
  const [stockData, setStockData] = useState(null);
  const [searchError, setSearchError] = useState(null);

  const handleSearchComplete = (data) => {
    setStockData(data);
    setSearchError(null);
  };

  const handleRefresh = async () => {
    if (!stockData?.resolvedSymbol) return;
    
    // Re-fetch with same symbol
    // The SmartSearchBar's executeSearch will handle this
    // For now, just trigger a new search
    try {
      const { marketService } = await import('@/services/marketService');
      const refreshed = await marketService.getStockDetail(
        stockData.resolvedSymbol.symbol,
        stockData.resolvedSymbol.market,
        stockData.resolvedSymbol.exchange
      );
      setStockData({ ...refreshed, resolvedSymbol: stockData.resolvedSymbol });
    } catch (err) {
      setSearchError(err.message);
    }
  };

  return (
    <div className="smart-stock-page">
      {/* Hero section */}
      <div className="smart-stock-page__hero">
        <div className="smart-stock-page__hero-content">
          <h1 className="smart-stock-page__title">
            Smart Stock Search
          </h1>
          <p className="smart-stock-page__subtitle">
            Search any stock by symbol or company name. Get real-time quotes, charts,
            fundamentals, and market depth — all in one place.
          </p>

          {/* Search bar */}
          <div className="smart-stock-page__search-wrap">
            <SmartSearchBar onSearchComplete={handleSearchComplete} />
          </div>

          {/* Quick links */}
          <div className="smart-stock-page__quick-links">
            <span className="smart-stock-page__quick-label">Popular:</span>
            {POPULAR_SYMBOLS.map(sym => (
              <button
                key={sym}
                onClick={() => {
                  // Trigger search programmatically
                  const event = new CustomEvent('smart-search', { detail: sym });
                  window.dispatchEvent(event);
                }}
                className="smart-stock-page__quick-btn"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="smart-stock-page__content">
        {searchError && (
          <div className="smart-stock-page__error">
            <AlertCircle size={20} />
            <span>{searchError}</span>
          </div>
        )}

        {stockData ? (
          <StockDataDisplay stockData={stockData} onRefresh={handleRefresh} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Empty state (before first search)
// ────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__content">
        <div className="empty-state__icon">
          <TrendingUp size={48} strokeWidth={1.5} />
        </div>
        <h2 className="empty-state__title">Search for a Stock</h2>
        <p className="empty-state__text">
          Enter a stock symbol (AAPL, MSFT) or company name (Apple, Microsoft)
          to see detailed analysis, live quotes, and market data.
        </p>

        {/* Feature cards */}
        <div className="empty-state__features">
          <FeatureCard
            icon={<Clock size={20} />}
            title="Real-Time Data"
            description="Live quotes via WebSocket with automatic updates"
          />
          <FeatureCard
            icon={<BarChart3 size={20} />}
            title="Complete Analysis"
            description="Chart, fundamentals, market depth in one view"
          />
          <FeatureCard
            icon={<TrendingUp size={20} />}
            title="Multi-Market"
            description="US (Twelve Data) and India (Upstox) support"
          />
        </div>

        {/* Example searches */}
        <div className="empty-state__examples">
          <p className="empty-state__examples-label">Try searching:</p>
          <div className="empty-state__examples-list">
            <span>🇺🇸 AAPL</span>
            <span>🇺🇸 Tesla</span>
            <span>🇺🇸 ORCL</span>
            <span>🇮🇳 HINDCOPPER</span>
            <span>🇮🇳 Reliance</span>
            <span>🇮🇳 TCS</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="feature-card">
      <div className="feature-card__icon">{icon}</div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__desc">{description}</p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────────────────

const POPULAR_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'HINDCOPPER', 'RELIANCE', 'TCS'];
