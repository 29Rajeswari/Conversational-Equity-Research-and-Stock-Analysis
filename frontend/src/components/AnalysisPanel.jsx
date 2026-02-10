import React, { useState } from 'react';
import FinancialCharts from './FinancialCharts';

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
  const [tab, setTab] = useState('thesis');

  if (!data) {
    return (
      <div className="p-4 bg-surface rounded-lg">
        <p className="text-textMuted text-sm">
          Search a stock to view analysis
        </p>
      </div>
    );
  }

  const chartData = buildChartData(data.financial);

  return (
    <div className="p-4 bg-surface rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Analysis</h2>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        {['thesis', 'data', 'risk'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1 rounded text-sm ${
              tab === t ? 'bg-primary text-black' : 'bg-muted'
            }`}
          >
            {t === 'thesis' && '💡 Thesis'}
            {t === 'data' && '📊 Data'}
            {t === 'risk' && '⚠️ Risk'}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {tab === 'thesis' && (
        <p className="text-sm whitespace-pre-line">
          {data.chat?.answer || 'No thesis available'}
        </p>
      )}

      {tab === 'data' && <FinancialCharts chartData={chartData} />}

      {tab === 'risk' && (
        <p className="text-sm text-textMuted">
          {data.research?.risk || 'Risk analysis not available'}
        </p>
      )}
    </div>
  );
};

export default AnalysisPanel;
