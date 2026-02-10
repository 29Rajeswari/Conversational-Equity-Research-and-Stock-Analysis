// src/components/Dashboard.jsx
import React, { useState } from 'react';
import SearchBar from './SearchBar';
import AnalysisPanel from './AnalysisPanel';

const Dashboard = () => {
  const [query, setQuery] = useState('');

  return (
    <div className="space-y-8">

      {/* ✅ ONLY SEARCH BAR IN ENTIRE DASHBOARD */}
      <SearchBar onSearch={setQuery} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Market Overview */}
        <div className="lg:col-span-2 p-6 bg-surface rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Market Overview</h2>

          {query ? (
            <p className="text-textMuted">
              Showing market overview for <b>{query}</b>
            </p>
          ) : (
            <p className="text-textMuted">
              Select a stock to view details.
            </p>
          )}
        </div>

        {/* Analysis */}
        <AnalysisPanel query={query} />
      </div>
    </div>
  );
};

export default Dashboard;
