// src/components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import AnalysisPanel from './AnalysisPanel';
import TradingChart from './TradingChart';
import FundamentalsGrid from './FundamentalsGrid';
import MarketDepthPanel from './MarketDepthPanel';

const Dashboard = () => {
  const [query, setQuery] = useState('');
  const [resolved, setResolved] = useState(null);
  const [stockDetail, setStockDetail] = useState(null);

  // when user submits a symbol/query, resolve it via marketService
  useEffect(() => {
    if (!query) return;
    let active = true;
    (async () => {
      try {
        const { marketService } = await import('@/services/marketService');
        const r = await marketService.searchSymbol(query);
        if (active && r?.found) {
          setResolved(r);
        }
      } catch (e) {
        console.error('searchSymbol failed', e);
      }
    })();
    return () => { active = false; };
  }, [query]);

  // fetch full stock detail when resolved symbol changes
  useEffect(() => {
    if (!resolved) {
      setStockDetail(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { marketService } = await import('@/services/marketService');
        const detail = await marketService.getStockDetail(
          resolved.symbol,
          resolved.market,
          resolved.exchange
        );
        if (active) setStockDetail(detail);
      } catch (e) {
        console.error('getStockDetail failed', e);
      }
    })();
    return () => { active = false; };
  }, [resolved]);

  return (
    <div className="space-y-8">

      {/* ONLY SEARCH BAR IN ENTIRE DASHBOARD */}
      <SearchBar onSearch={setQuery} />

      {resolved && (
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-3">
            <TradingChart
              symbol={resolved.symbol}
              market={resolved.market}
              exchange={resolved.exchange}
            />
          </div>
          <div className="col-span-1 space-y-4">
            <FundamentalsGrid
              fundamentals={stockDetail?.fundamentals}
              market={resolved.market}
            />
            <MarketDepthPanel
              symbol={resolved.symbol}
              exchange={resolved.exchange}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Market Overview */}
        

        {/* Analysis */}
        <AnalysisPanel data={null} />
      </div>
    </div>
  );
};

export default Dashboard;
