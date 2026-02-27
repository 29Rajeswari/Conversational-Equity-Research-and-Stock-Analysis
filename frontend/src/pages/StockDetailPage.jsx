/**
 * src/pages/StockDetailPage.jsx  ← NEW page
 * Drop alongside your existing pages — do not modify those.
 *
 * Full stock detail page:
 * Chart → Performance bar → Fundamentals → Market Depth (India only)
 *
 * Route: /stock/:symbol?market=US&exchange=NSE_EQ
 *
 * Add to your existing router:
 *   <Route path="/stock/:symbol" element={<StockDetailPage />} />
 */

import { useParams, useSearchParams } from 'react-router-dom';
import LivePriceChart    from '@/components/LivePriceChart';
import PerformanceBar    from '@/components/PerformanceBar';
import FundamentalsGrid  from '@/components/FundamentalsGrid';
import MarketDepthPanel  from '@/components/MarketDepthPanel';
import MarketSelector    from '@/components/MarketSelector';
import { useMarket }     from '@/context/MarketContext';
import { useEffect, useState } from 'react';
import { fetchStockDetail } from '@/api/market';

export default function StockDetailPage() {
  const { symbol }              = useParams();
  const [searchParams]          = useSearchParams();
  const { market, exchange }    = useMarket();

  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const isIndia = market === 'INDIA';
  const symUpper = symbol?.toUpperCase() ?? '';

  useEffect(() => {
    if (!symUpper) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchStockDetail(symUpper, market, exchange)
      .then(d  => { if (!cancelled) setDetail(d); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [symUpper, market, exchange]);

  if (error) {
    return (
      <div className="stock-detail stock-detail--error">
        <p>Could not load data for <strong>{symUpper}</strong>: {error}</p>
      </div>
    );
  }

  return (
    <div className="stock-detail">
      {/* Top controls */}
      <div className="stock-detail__toolbar">
        <div className="stock-detail__breadcrumb">
          <span className="stock-detail__symbol">{symUpper}</span>
          {detail?.quote && (
            <span className="stock-detail__exchange">
              {isIndia ? 'NSE' : 'NASDAQ'} · {market}
            </span>
          )}
        </div>
        <MarketSelector />
      </div>

      {/* Live Chart */}
      <div className="stock-detail__chart">
        <LivePriceChart symbol={symUpper} market={market} exchange={exchange} />
      </div>

      {/* Three-column layout below the chart */}
      <div className="stock-detail__body">
        {/* Left — Performance + Fundamentals */}
        <div className="stock-detail__main">
          {loading ? (
            <SkeletonBlock height={200} />
          ) : (
            <PerformanceBar performance={detail?.performance} market={market} />
          )}

          {loading ? (
            <SkeletonBlock height={260} />
          ) : (
            <FundamentalsGrid fundamentals={detail?.fundamentals} market={market} />
          )}
        </div>

        {/* Right — Market Depth (India only) */}
        {isIndia && (
          <div className="stock-detail__sidebar">
            <MarketDepthPanel symbol={symUpper} exchange={exchange} enabled={isIndia} />
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonBlock({ height }) {
  return (
    <div
      className="skeleton-block"
      style={{ height, borderRadius: 12, marginBottom: 16 }}
    />
  );
}
