/**
 * src/components/MarketDepthPanel.jsx  ← NEW component
 * Drop alongside existing RiskIndicator.jsx — do not modify it.
 *
 * Renders the bid/ask order book exactly as seen in the screenshots:
 * - Buy % vs Sell % bar
 * - Top 5 bid prices (green qty) + ask prices (red qty)
 * Auto-refreshes every 5 seconds via useMarketDepth.
 */

import { useMarketDepth } from '@/hooks/useMarketDepth';

export default function MarketDepthPanel({ symbol, exchange = 'NSE_EQ', enabled = true }) {
  const { depth, loading, error } = useMarketDepth(symbol, exchange, enabled);

  if (!enabled) return null;

  if (error) {
    return (
      <div className="depth-panel depth-panel--error">
        <p>Market depth unavailable</p>
      </div>
    );
  }

  return (
    <section className="depth-panel">
      <div className="depth-panel__header">
        <h3 className="depth-panel__title">Market Depth</h3>
        {loading && <span className="depth-panel__spinner" />}
      </div>

      {depth && (
        <>
          {/* Buy / Sell % bar */}
          <div className="depth-panel__ratio">
            <span className="depth-panel__ratio-label depth-panel__ratio-label--buy">
              Buy orders <strong>{depth.buy_percentage.toFixed(2)}%</strong>
            </span>
            <span className="depth-panel__ratio-label depth-panel__ratio-label--sell">
              Sell orders <strong>{depth.sell_percentage.toFixed(2)}%</strong>
            </span>
            <div className="depth-panel__bar">
              <div
                className="depth-panel__bar-fill depth-panel__bar-fill--buy"
                style={{ width: `${depth.buy_percentage}%` }}
              />
              <div
                className="depth-panel__bar-fill depth-panel__bar-fill--sell"
                style={{ width: `${depth.sell_percentage}%` }}
              />
            </div>
          </div>

          {/* Order table */}
          <div className="depth-table">
            <div className="depth-table__head">
              <span>Bid Price</span>
              <span>Qty</span>
              <span>Ask Price</span>
              <span>Qty</span>
            </div>

            {Array.from({ length: 5 }).map((_, i) => {
              const bid = depth.buy_orders[i]  ?? {};
              const ask = depth.sell_orders[i] ?? {};
              return (
                <div key={i} className="depth-table__row">
                  <span className="depth-table__bid-price">{bid.price ?? '—'}</span>
                  <span className="depth-table__bid-qty">{formatQty(bid.quantity)}</span>
                  <span className="depth-table__ask-price">{ask.price ?? '—'}</span>
                  <span className="depth-table__ask-qty">{formatQty(ask.quantity)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!depth && !loading && (
        <p className="depth-panel__empty">No order book data</p>
      )}
    </section>
  );
}

function formatQty(qty) {
  if (qty == null) return '—';
  return Number(qty).toLocaleString();
}
