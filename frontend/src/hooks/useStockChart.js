/**
 * src/hooks/useStockChart.js
 * 
 * Fetches live OHLCV candle data from WebSocket stream.
 *
 * Usage:
 *   const { candles, loading, error } = useStockChart('AAPL', 'US')
 */

import { useCallback, useEffect, useState } from 'react';
import { streamClient } from '@/websocket/streamClient';

export function useStockChart(symbol, market = 'US', exchange = 'NASDAQ', interval = '1min') {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    // Connect to WebSocket
    streamClient.connect();

    // Subscribe to candle updates for this symbol
    streamClient.subscribe([symbol], market, interval, exchange);

    // Listen for candle messages
    const unsubCandle = streamClient.on('candle', (msg) => {
      if (msg.data?.symbol === symbol) {
        setCandles(prev => {
          const updated = [...prev, msg.data];
          // Keep only last 100 candles
          return updated.slice(-100);
        });
        setLoading(false);
      }
    });

    // Listen for errors
    const unsubError = streamClient.on('error', (msg) => {
      setError(msg.message || 'WebSocket error');
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubCandle();
      unsubError();
      streamClient.unsubscribe([symbol]);
    };
  }, [symbol, market, exchange, interval]);

  return {
    candles,
    loading,
    error,
  };
}
