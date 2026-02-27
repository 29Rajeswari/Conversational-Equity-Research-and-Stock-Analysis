/**
 * src/hooks/useStockQuote.js
 * 
 * Returns live quote for a symbol.
 * Priority: WebSocket (real-time) → HTTP fallback → mock data.
 *
 * Usage:
 *   const { quote, loading, error, isLive } = useStockQuote('AAPL', 'US')
 */

import { useCallback, useEffect, useState } from 'react';
import { streamClient } from '@/websocket/streamClient';

const REFRESH_INTERVAL_MS = 15_000; // fallback poll when WS quote is stale

export function useStockQuote(symbol, market = 'US', exchange = 'NASDAQ') {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!symbol) return;

    setLoading(true);
    setError(null);

    // Connect to WebSocket
    streamClient.connect();

    // Subscribe to quote updates
    streamClient.subscribe([symbol], market, '1min', exchange);

    // Listen for quote messages
    const unsubQuote = streamClient.on('quote', (msg) => {
      if (msg.data?.symbol === symbol) {
        setQuote(msg.data);
        setIsLive(true);
        setLoading(false);
      }
    });

    // Listen for status changes
    const unsubStatus = streamClient.on('status', (msg) => {
      setIsLive(msg.status === 'connected');
    });

    // Listen for errors
    const unsubError = streamClient.on('error', (msg) => {
      setError(msg.message);
      setLoading(false);
    });

    // Cleanup
    return () => {
      unsubQuote();
      unsubStatus();
      unsubError();
      streamClient.unsubscribe([symbol]);
    };
  }, [symbol, market, exchange]);

  return { quote, loading: loading && !quote, error, isLive };
}
