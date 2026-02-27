/**
 * src/hooks/useSmartSearch.js
 * 
 * Smart search hook with:
 * - Debounced input
 * - Auto-symbol resolution
 * - Instant data fetching on valid symbol
 * - Search history
 * - Loading states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { marketService } from '@/services/marketService';

const DEBOUNCE_MS = 400;
const MAX_HISTORY = 10;

export function useSmartSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  const debounceTimer = useRef(null);

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('eq_search_history') || '[]');
      setHistory(saved.slice(0, MAX_HISTORY));
    } catch {
      setHistory([]);
    }
  }, []);

  // Debounce query input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  // Generate suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 1) {
      setSuggestions([]);
      return;
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    
    // Combine history + built-in suggestions
    const allSuggestions = [
      ...history,
      ...COMMON_SYMBOLS.filter(s => 
        s.symbol.toLowerCase().includes(lowerQuery) ||
        s.name.toLowerCase().includes(lowerQuery)
      ),
    ];

    // Deduplicate by symbol
    const unique = Array.from(
      new Map(allSuggestions.map(s => [s.symbol, s])).values()
    ).slice(0, 8);

    setSuggestions(unique);
  }, [debouncedQuery, history]);

  // ──────────────────────────────────────────────────────────────────────
  // Main search action - resolve symbol and return full details
  // ──────────────────────────────────────────────────────────────────────

  const executeSearch = useCallback(async (symbolOrQuery) => {
    if (!symbolOrQuery?.trim()) return null;

    setIsSearching(true);
    setError(null);

    try {
      // Step 1: Resolve symbol
      const resolved = await marketService.searchSymbol(symbolOrQuery);
      
      if (!resolved.found) {
        throw new Error(`Symbol "${symbolOrQuery}" not found. Try AAPL, MSFT, HINDCOPPER, etc.`);
      }

      // Step 2: Fetch complete stock detail
      const details = await marketService.getStockDetail(
        resolved.symbol,
        resolved.market,
        resolved.exchange
      );

      // Step 3: Add to history
      const historyEntry = {
        symbol: resolved.symbol,
        name: resolved.name,
        market: resolved.market,
        exchange: resolved.exchange,
        timestamp: Date.now(),
      };

      const newHistory = [
        historyEntry,
        ...history.filter(h => h.symbol !== resolved.symbol),
      ].slice(0, MAX_HISTORY);

      setHistory(newHistory);
      localStorage.setItem('eq_search_history', JSON.stringify(newHistory));

      return {
        ...details,
        resolvedSymbol: resolved,
      };

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsSearching(false);
    }
  }, [history]);

  // ──────────────────────────────────────────────────────────────────────
  // Quick actions
  // ──────────────────────────────────────────────────────────────────────

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('eq_search_history');
  }, []);

  const selectSuggestion = useCallback((suggestion) => {
    setQuery(suggestion.symbol);
    setSuggestions([]);
    return executeSearch(suggestion.symbol);
  }, [executeSearch]);

  return {
    query,
    setQuery,
    suggestions,
    history,
    isSearching,
    error,
    executeSearch,
    selectSuggestion,
    clearHistory,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Built-in symbol database (subset - extend in production)
// ────────────────────────────────────────────────────────────────────────────

const COMMON_SYMBOLS = [
  // US - Tech
  { symbol: 'AAPL',  name: 'Apple Inc.',                 market: 'US', exchange: 'NASDAQ' },
  { symbol: 'MSFT',  name: 'Microsoft Corporation',      market: 'US', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.',              market: 'US', exchange: 'NASDAQ' },
  { symbol: 'AMZN',  name: 'Amazon.com Inc.',            market: 'US', exchange: 'NASDAQ' },
  { symbol: 'META',  name: 'Meta Platforms Inc.',        market: 'US', exchange: 'NASDAQ' },
  { symbol: 'NVDA',  name: 'NVIDIA Corporation',         market: 'US', exchange: 'NASDAQ' },
  { symbol: 'TSLA',  name: 'Tesla Inc.',                 market: 'US', exchange: 'NASDAQ' },
  { symbol: 'NFLX',  name: 'Netflix Inc.',               market: 'US', exchange: 'NASDAQ' },
  { symbol: 'ORCL',  name: 'Oracle Corporation',         market: 'US', exchange: 'NYSE' },
  { symbol: 'INTC',  name: 'Intel Corporation',          market: 'US', exchange: 'NASDAQ' },
  { symbol: 'AMD',   name: 'Advanced Micro Devices',     market: 'US', exchange: 'NASDAQ' },
  { symbol: 'CRM',   name: 'Salesforce Inc.',            market: 'US', exchange: 'NYSE' },
  
  // US - Finance
  { symbol: 'JPM',   name: 'JPMorgan Chase & Co.',       market: 'US', exchange: 'NYSE' },
  { symbol: 'BAC',   name: 'Bank of America Corp.',      market: 'US', exchange: 'NYSE' },
  { symbol: 'WFC',   name: 'Wells Fargo & Company',      market: 'US', exchange: 'NYSE' },
  { symbol: 'GS',    name: 'Goldman Sachs Group Inc.',   market: 'US', exchange: 'NYSE' },
  
  // US - Consumer
  { symbol: 'WMT',   name: 'Walmart Inc.',               market: 'US', exchange: 'NYSE' },
  { symbol: 'HD',    name: 'Home Depot Inc.',            market: 'US', exchange: 'NYSE' },
  { symbol: 'MCD',   name: 'McDonald\'s Corporation',    market: 'US', exchange: 'NYSE' },
  { symbol: 'NKE',   name: 'Nike Inc.',                  market: 'US', exchange: 'NYSE' },
  
  // India - Top stocks
  { symbol: 'RELIANCE',    name: 'Reliance Industries Ltd.',      market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'TCS',         name: 'Tata Consultancy Services',     market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'HDFCBANK',    name: 'HDFC Bank Ltd.',                market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'INFY',        name: 'Infosys Ltd.',                  market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'ICICIBANK',   name: 'ICICI Bank Ltd.',               market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'HINDUNILVR',  name: 'Hindustan Unilever Ltd.',       market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'BHARTIARTL',  name: 'Bharti Airtel Ltd.',            market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'SBIN',        name: 'State Bank of India',           market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'HINDCOPPER',  name: 'Hindustan Copper Ltd.',         market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'ITC',         name: 'ITC Ltd.',                      market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'KOTAKBANK',   name: 'Kotak Mahindra Bank Ltd.',      market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'LT',          name: 'Larsen & Toubro Ltd.',          market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'ASIANPAINT',  name: 'Asian Paints Ltd.',             market: 'INDIA', exchange: 'NSE_EQ' },
  { symbol: 'MARUTI',      name: 'Maruti Suzuki India Ltd.',      market: 'INDIA', exchange: 'NSE_EQ' },
];
