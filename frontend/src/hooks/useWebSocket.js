/**
 * src/hooks/useWebSocket.js  ← NEW hook
 *
 * Exposes WebSocket connection status and subscribe/unsubscribe controls.
 * Wraps streamClient so components stay decoupled from the WS implementation.
 *
 * Usage:
 *   const { status, subscribe, unsubscribe, isConnected } = useWebSocket()
 */

import { useCallback, useEffect, useState } from 'react';
import { streamClient } from '@/websocket/streamClient';

export function useWebSocket() {
  const [status, setStatus] = useState(streamClient.status);

  useEffect(() => {
    const unsub = streamClient.on('status', ({ status }) => setStatus(status));
    return unsub;
  }, []);

  const subscribe = useCallback((symbols, market = 'US', interval = '1min', exchange = 'NSE_EQ') => {
    streamClient.subscribe(symbols, market, interval, exchange);
  }, []);

  const unsubscribe = useCallback((symbols) => {
    streamClient.unsubscribe(symbols);
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    subscribe,
    unsubscribe,
  };
}
