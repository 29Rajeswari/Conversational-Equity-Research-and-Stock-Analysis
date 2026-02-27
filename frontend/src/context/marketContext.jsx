/**
 * src/context/MarketContext.jsx  ← NEW file
 * Drop alongside your existing context files — do not modify those.
 *
 * Provides:
 *   - Live quote state keyed by symbol
 *   - WebSocket connection lifecycle
 *   - Watchlist symbol management
 *   - Market / exchange selection
 */

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import { streamClient } from '@/websocket/streamClient';
import { fetchWatchlistQuotes } from '@/api/market';

// ─── State shape ──────────────────────────────────────────────────────────────

const initialState = {
  quotes:       {},          // { [symbol]: StockQuote }
  watchlist:    [],          // string[]
  market:       'US',        // 'US' | 'INDIA'
  exchange:     'NSE_EQ',
  interval:     '5min',
  wsStatus:     'disconnected',
  loading:      {},          // { [symbol]: boolean }
  errors:       {},          // { [symbol]: string }
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    case 'SET_QUOTE':
      return {
        ...state,
        quotes:  { ...state.quotes,  [action.symbol]: action.quote },
        loading: { ...state.loading, [action.symbol]: false },
        errors:  { ...state.errors,  [action.symbol]: null },
      };

    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, [action.symbol]: action.value } };

    case 'SET_ERROR':
      return {
        ...state,
        errors:  { ...state.errors,  [action.symbol]: action.message },
        loading: { ...state.loading, [action.symbol]: false },
      };

    case 'SET_WATCHLIST':
      return { ...state, watchlist: action.symbols };

    case 'ADD_TO_WATCHLIST':
      if (state.watchlist.includes(action.symbol)) return state;
      return { ...state, watchlist: [...state.watchlist, action.symbol] };

    case 'REMOVE_FROM_WATCHLIST':
      return { ...state, watchlist: state.watchlist.filter(s => s !== action.symbol) };

    case 'SET_MARKET':
      return { ...state, market: action.market, quotes: {}, errors: {} };

    case 'SET_EXCHANGE':
      return { ...state, exchange: action.exchange };

    case 'SET_INTERVAL':
      return { ...state, interval: action.interval };

    case 'SET_WS_STATUS':
      return { ...state, wsStatus: action.status };

    case 'BATCH_QUOTES':
      const quoteMap = {};
      action.quotes.forEach(q => { if (q) quoteMap[q.symbol] = q; });
      return { ...state, quotes: { ...state.quotes, ...quoteMap } };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Persist watchlist to localStorage
  const { watchlist, market, exchange, interval } = state;
  const prevWatchlistRef = useRef(watchlist);

  // Load persisted watchlist on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('eq_watchlist') ?? '[]');
      if (Array.isArray(saved) && saved.length) {
        dispatch({ type: 'SET_WATCHLIST', symbols: saved });
      }
    } catch { /* ignore */ }
  }, []);

  // Persist watchlist on change
  useEffect(() => {
    if (watchlist !== prevWatchlistRef.current) {
      localStorage.setItem('eq_watchlist', JSON.stringify(watchlist));
      prevWatchlistRef.current = watchlist;
    }
  }, [watchlist]);

  // ── WebSocket lifecycle ──────────────────────────────────────────────────

  useEffect(() => {
    streamClient.connect();

    const unsubStatus = streamClient.on('status', ({ status }) => {
      dispatch({ type: 'SET_WS_STATUS', status });
    });

    const unsubQuote = streamClient.on('quote', (msg) => {
      if (msg?.data?.symbol) {
        dispatch({ type: 'SET_QUOTE', symbol: msg.data.symbol, quote: msg.data });
      }
    });

    const unsubError = streamClient.on('error', (msg) => {
      console.warn('[MarketContext] WS error:', msg.message);
    });

    return () => {
      unsubStatus();
      unsubQuote();
      unsubError();
    };
  }, []);

  // ── Re-subscribe when watchlist / market changes ─────────────────────────

  useEffect(() => {
    if (watchlist.length === 0 || state.wsStatus !== 'connected') return;
    streamClient.subscribe(watchlist, market, interval, exchange);
  }, [watchlist, market, exchange, interval, state.wsStatus]);

  // ── Initial batch HTTP fetch for watchlist ───────────────────────────────

  useEffect(() => {
    if (watchlist.length === 0) return;
    let cancelled = false;

    fetchWatchlistQuotes(watchlist, market, exchange)
      .then(quotes => {
        if (!cancelled) dispatch({ type: 'BATCH_QUOTES', quotes });
      })
      .catch(console.error);

    return () => { cancelled = true; };
  }, [watchlist, market, exchange]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const addToWatchlist = useCallback((symbol) => {
    dispatch({ type: 'ADD_TO_WATCHLIST', symbol: symbol.toUpperCase() });
  }, []);

  const removeFromWatchlist = useCallback((symbol) => {
    dispatch({ type: 'REMOVE_FROM_WATCHLIST', symbol: symbol.toUpperCase() });
  }, []);

  const setMarket = useCallback((market) => {
    dispatch({ type: 'SET_MARKET', market });
  }, []);

  const setExchange = useCallback((exchange) => {
    dispatch({ type: 'SET_EXCHANGE', exchange });
  }, []);

  const setInterval = useCallback((interval) => {
    dispatch({ type: 'SET_INTERVAL', interval });
  }, []);

  const value = {
    ...state,
    addToWatchlist,
    removeFromWatchlist,
    setMarket,
    setExchange,
    setInterval,
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used inside <MarketProvider>');
  return ctx;
}
