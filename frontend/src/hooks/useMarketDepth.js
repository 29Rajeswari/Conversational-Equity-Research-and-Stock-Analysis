/**
 * src/hooks/useMarketDepth.js  ← NEW hook
 *
 * Fetches + auto-refreshes the order book (bid/ask depth).
 * Only meaningful for Indian markets via Upstox.
 *
 * Usage:
 *   const { depth, loading, error } = useMarketDepth('HINDCOPPER', 'NSE_EQ')
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchMarketDepth } from '@/api/market';

const REFRESH_MS = 5_000; // refresh order book every 5 seconds

export function useMarketDepth(symbol, exchange = 'NSE_EQ', enabled = true) {
  const [depth,   setDepth]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!symbol || !enabled) return;
    setLoading(prev => !depth && !prev ? true : prev); // only show spinner first time
    try {
      const data = await fetchMarketDepth(symbol, exchange);
      setDepth(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [symbol, exchange, enabled]);

  useEffect(() => {
    if (!enabled) return;
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load, enabled]);

  return { depth, loading, error, refresh: load };
}
