//scr/hooks/useUnifiedSearch.js
import { useState, useCallback } from 'react';
import { unifiedSearchService } from '@/services/unifiedSearchService';

export function useUnifiedSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const executeSearch = useCallback(async (opts = {}) => {
    const query = opts.query || opts.symbol;
    if (!query) {
      setError('query is required');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const resp = await unifiedSearchService.search(query, opts);
      console.log('🔍 API Response:', resp); // Debug: check response structure

      // Map single unified response into array of stocks expected by dashboard
      // Fallback to both resp and resp.resolved for flexibility
      const stock = {
        symbol: resp.symbol || resp.resolved?.symbol,
        name: resp.name || resp.resolved?.name,
        market: resp.market || resp.resolved?.market,
        quote: resp.quote || null,
        chart: resp.chart || [],
        fundamentals: resp.fundamentals || null,
        depth: resp.depth || null,
        data_source: resp.quote?.source || 'market',
        timestamp: new Date().toISOString(),
      };

      setResults([stock]);
      return [stock];
    } catch (err) {
      const msg = err?.message || String(err);
      setError(msg);
      setResults([]);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, results, executeSearch };
}

export default useUnifiedSearch;
