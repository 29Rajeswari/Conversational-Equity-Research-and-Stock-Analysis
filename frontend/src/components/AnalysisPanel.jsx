// src/components/AnalysisPanel.jsx
import React, { useState } from 'react';
import FinancialCharts from './FinancialCharts';
import LivePriceChart from './LivePriceChart';

const buildChartData = (financial) => {
  const reports =
    financial?.financials?.income_statement?.annualReports;

  if (!Array.isArray(reports)) return [];

  return reports
    .slice(0, 5)
    .reverse()
    .map((r) => ({
      year: r.fiscalDateEnding?.slice(0, 4),
      revenue: Number(r.totalRevenue),
      profit: Number(r.operatingIncome || r.grossProfit),
    }));
};

const AnalysisPanel = ({ data }) => {
  const [tab, setTab] = useState('quote');

  if (!data) {
    return (
      <div className="p-4 bg-surface rounded-lg">
        <p className="text-textMuted text-sm">
          Search a stock to view analysis
        </p>
      </div>
    );
  }

  // Handle both unified search format and old format
  const symbol = data.symbol || data.resolved?.symbol;
  const quote = data.quote;
  const fundamentals = data.fundamentals;
  const chart = data.chart || [];
  const chartData = buildChartData(data.financial);

  const isPositive = quote?.change_percent >= 0;

  return (
    <div className="p-6 bg-surface rounded-lg">
      <h2 className="text-lg font-semibold mb-3">Stock Analysis</h2>
      <p className="text-xs text-textMuted mb-4">
        Symbol: {symbol}
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {['quote', 'chart', 'fundamentals'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded text-sm ${
              tab === t
                ? 'bg-primary text-black'
                : 'bg-background text-textMuted'
            }`}
          >
            {t === 'quote' && '💰 Quote'}
            {t === 'chart' && '📊 Chart'}
            {t === 'fundamentals' && '📈 Fundamentals'}
          </button>
        ))}
      </div>

      {/* LIVE CHART — FULL WIDTH */}
      <div className="mb-6 bg-background rounded-lg p-4 border border-textMuted/10">
        <LivePriceChart 
          symbol={symbol} 
          market={data.market || data.resolved?.market || 'US'} 
          exchange={data.exchange || data.resolved?.exchange || 'NASDAQ'}
        />
      </div>

      {/* DATA TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* LEFT → QUOTE SUMMARY */}
       <div className="bg-background rounded p-4 border border-textMuted/10">
          {quote ? (
            <>
              <div className="text-3xl font-bold mb-2">
                ${quote.price?.toFixed(2)}
              </div>
              <div className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.change_percent).toFixed(2)}%)
              </div>
              <div className="text-xs text-textMuted mt-4 space-y-2">
                <p>High: ${quote.high?.toFixed(2)}</p>
                <p>Low: ${quote.low?.toFixed(2)}</p>
                <p>Open: ${quote.open?.toFixed(2)}</p>
                <p>Volume: {quote.volume?.toLocaleString()}</p>
              </div>
            </>
          ) : (
            <p className="text-textMuted">No quote data available</p>
          )}
        </div>

        {/* RIGHT → TAB CONTENT */}
        <div className="text-sm">

          {tab === 'quote' && (
            <div className="bg-background rounded p-4 border border-textMuted/10">
              <pre className="whitespace-pre-wrap text-xs overflow-y-auto max-h-60">
                {JSON.stringify(quote, null, 2)}
              </pre>
            </div>
          )}

          {tab === 'chart' && (
            <div className="bg-background rounded p-4 border border-textMuted/10">
              <p className="text-textMuted text-xs">Live chart displayed above ↑</p>
            </div>
          )}

          {tab === 'fundamentals' && (
            <div className="bg-background rounded p-4 border border-textMuted/10">
              {fundamentals ? (
                <pre className="whitespace-pre-wrap text-xs overflow-y-auto max-h-60">
                  {JSON.stringify(fundamentals, null, 2)}
                </pre>
              ) : (
                <p className="text-textMuted">No fundamentals available</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
