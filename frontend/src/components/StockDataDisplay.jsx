/**
 * src/components/StockDataDisplay.jsx
 * 
 * Comprehensive stock data display that auto-populates from search results.
 * Shows all sections: Quote, Chart, Performance, Fundamentals, Market Depth.
 * Handles real-time WebSocket updates for live quotes.
 */

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import TradingChart from './TradingChart';
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { streamClient } from '@/websocket/streamClient';

export default function StockDataDisplay({ stockData, onRefresh }) {
  const [liveQuote, setLiveQuote] = useState(stockData?.quote || null);
  const [wsConnected, setWsConnected] = useState(false);

  const { quote, chart, performance, fundamentals, depth, resolvedSymbol } = stockData || {};
  const isIndia = resolvedSymbol?.market === 'INDIA';
  const currency = isIndia ? '₹' : '$';

  // ──────────────────────────────────────────────────────────────────────
  // WebSocket real-time updates
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!resolvedSymbol) return;

    // Subscribe to live quotes
    streamClient.connect();
    streamClient.subscribe(
      [resolvedSymbol.symbol],
      resolvedSymbol.market,
      '1min',
      resolvedSymbol.exchange
    );

    const unsubStatus = streamClient.on('status', ({ status }) => {
      setWsConnected(status === 'connected');
    });

    const unsubQuote = streamClient.on('quote', (msg) => {
      if (msg.data?.symbol === resolvedSymbol.symbol) {
        setLiveQuote(msg.data);
      }
    });

    return () => {
      unsubStatus();
      unsubQuote();
      if (resolvedSymbol.symbol) {
        streamClient.unsubscribe([resolvedSymbol.symbol]);
      }
    };
  }, [resolvedSymbol]);

  // Use live quote if available, fallback to initial quote
  const displayQuote = liveQuote || quote;
  if (!displayQuote) return null;

  const isPositive = displayQuote.change_percent >= 0;
  const changeColor = isPositive ? '#3DD9D0' : '#FF5C5C';

  // ──────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────

  return (
    <div className="stock-display">
      {/* Header with live quote */}
      <div className="stock-display__header">
        <div className="stock-display__title-row">
          <div>
            <h1 className="stock-display__symbol">{displayQuote.symbol}</h1>
            <div className="stock-display__meta">
              <span className="stock-display__market">
                {isIndia ? '🇮🇳 India' : '🇺🇸 US'} · {resolvedSymbol.exchange}
              </span>
              {wsConnected && (
                <span className="stock-display__live-badge">
                  <span className="stock-display__live-dot" />
                  LIVE
                </span>
              )}
            </div>
          </div>

          <button onClick={onRefresh} className="stock-display__refresh" title="Refresh data">
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="stock-display__price-row">
          <div className="stock-display__price">
            {currency}{displayQuote.price.toFixed(2)}
          </div>
          <div className="stock-display__change" style={{ color: changeColor }}>
            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            <span>
              {currency}{Math.abs(displayQuote.change).toFixed(2)} (
              {isPositive ? '+' : ''}{displayQuote.change_percent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Today's range */}
        <div className="stock-display__range">
          <span>Day Range: {currency}{displayQuote.low} - {currency}{displayQuote.high}</span>
          <span className="stock-display__range-sep">|</span>
          <span>Volume: {displayQuote.volume.toLocaleString()}</span>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="stock-display__grid">
        {/* Column 1: Chart */}
        <div className="stock-display__section stock-display__section--chart">
          <h3 className="stock-display__section-title">Price Chart</h3>
          {resolvedSymbol?.symbol ? (
            <div style={{ height: 420 }}>
              <TradingChart
                symbol={resolvedSymbol.symbol}
                market={resolvedSymbol.market}
                exchange={resolvedSymbol.exchange}
              />
            </div>
          ) : (
            <div className="stock-display__no-data">Chart data unavailable</div>
          )}
        </div>

        {/* Column 2: Performance & Fundamentals */}
        <div className="stock-display__section">
          {/* Performance metrics */}
          {performance && (
            <>
              <h3 className="stock-display__section-title">Performance</h3>
              <div className="stock-display__metrics">
                <MetricRow label="Open" value={`${currency}${performance.open}`} />
                <MetricRow label="Prev Close" value={`${currency}${performance.prev_close}`} />
                <MetricRow label="Volume" value={performance.volume.toLocaleString()} />
                {performance.lower_circuit && (
                  <MetricRow label="Lower Circuit" value={`${currency}${performance.lower_circuit}`} />
                )}
                {performance.upper_circuit && (
                  <MetricRow label="Upper Circuit" value={`${currency}${performance.upper_circuit}`} />
                )}
              </div>
            </>
          )}

          {/* Fundamentals */}
          {fundamentals && (
            <>
              <h3 className="stock-display__section-title">Fundamentals</h3>
              <div className="stock-display__metrics">
                {fundamentals.market_cap && (
                  <MetricRow label="Market Cap" value={formatCap(fundamentals.market_cap, currency)} />
                )}
                {fundamentals.pe_ratio && (
                  <MetricRow label="P/E Ratio" value={fundamentals.pe_ratio.toFixed(2)} />
                )}
                {fundamentals.pb_ratio && (
                  <MetricRow label="P/B Ratio" value={fundamentals.pb_ratio.toFixed(2)} />
                )}
                {fundamentals.eps && (
                  <MetricRow label="EPS" value={fundamentals.eps.toFixed(2)} />
                )}
                {fundamentals.roe && (
                  <MetricRow label="ROE" value={`${fundamentals.roe.toFixed(2)}%`} />
                )}
                {fundamentals.div_yield && (
                  <MetricRow label="Div Yield" value={`${fundamentals.div_yield.toFixed(2)}%`} />
                )}
              </div>
            </>
          )}
        </div>

        {/* Column 3: Market Depth (India only) */}
        {isIndia && depth && (
          <div className="stock-display__section">
            <h3 className="stock-display__section-title">Market Depth</h3>
            
            {/* Buy/Sell ratio bar */}
            <div className="stock-display__depth-bar">
              <div className="stock-display__depth-labels">
                <span>Buy {depth.buy_percentage.toFixed(1)}%</span>
                <span>Sell {depth.sell_percentage.toFixed(1)}%</span>
              </div>
              <div className="stock-display__depth-track">
                <div
                  className="stock-display__depth-fill stock-display__depth-fill--buy"
                  style={{ width: `${depth.buy_percentage}%` }}
                />
                <div
                  className="stock-display__depth-fill stock-display__depth-fill--sell"
                  style={{ width: `${depth.sell_percentage}%` }}
                />
              </div>
            </div>

            {/* Order book table */}
            <div className="stock-display__depth-table">
              <div className="stock-display__depth-row stock-display__depth-row--header">
                <span>Bid</span>
                <span>Qty</span>
                <span>Ask</span>
                <span>Qty</span>
              </div>
              {Array.from({ length: 5 }).map((_, i) => {
                const bid = depth.buy_orders?.[i] || {};
                const ask = depth.sell_orders?.[i] || {};
                return (
                  <div key={i} className="stock-display__depth-row">
                    <span className="stock-display__depth-bid">{bid.price || '—'}</span>
                    <span className="stock-display__depth-bid-qty">{bid.quantity?.toLocaleString() || '—'}</span>
                    <span className="stock-display__depth-ask">{ask.price || '—'}</span>
                    <span className="stock-display__depth-ask-qty">{ask.quantity?.toLocaleString() || '—'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="stock-display__footer">
        <button className="stock-display__action">
          Add to Watchlist
        </button>
        <a
          href={`https://www.google.com/finance/quote/${displayQuote.symbol}:${isIndia ? 'NSE' : 'NASDAQ'}`}
          target="_blank"
          rel="noopener noreferrer"
          className="stock-display__action stock-display__action--link"
        >
          View on Google Finance <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function MetricRow({ label, value }) {
  return (
    <div className="stock-display__metric">
      <span className="stock-display__metric-label">{label}</span>
      <strong className="stock-display__metric-value">{value}</strong>
    </div>
  );
}

function ChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="stock-display__tooltip">
      <div className="stock-display__tooltip-time">{label}</div>
      <div className="stock-display__tooltip-price">
        {currency}{data.close?.toFixed(2)}
      </div>
      {data.volume && (
        <div className="stock-display__tooltip-vol">Vol: {data.volume.toLocaleString()}</div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatCap(n, currency) {
  if (n >= 1e12) return `${currency}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${currency}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e7) return `${currency}${(n / 1e7).toFixed(2)}Cr`;
  return `${currency}${n.toLocaleString()}`;
}
