/**
 * src/components/SmartSearchBar.jsx
 * 
 * Intelligent search input with:
 * - Real-time suggestions dropdown
 * - Search history
 * - Market indicators (US 🇺🇸 / India 🇮🇳)
 * - Loading states
 * - Keyboard navigation (↑↓ Enter Esc)
 */

import { useState, useRef, useEffect } from 'react';
import { Search, Clock, TrendingUp, X, Loader2 } from 'lucide-react';
import { useSmartSearch } from '@/hooks/useSmartSearch';

export default function SmartSearchBar({ onSearchComplete, autoFocus = true }) {
  const {
    query,
    setQuery,
    suggestions,
    history,
    isSearching,
    error,
    executeSearch,
    selectSuggestion,
    clearHistory,
  } = useSmartSearch();

  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ──────────────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowDropdown(true);
    setHighlightIndex(-1);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!query.trim() || isSearching) return;

    setShowDropdown(false);

    try {
      const result = await executeSearch(query);
      if (result && onSearchComplete) {
        onSearchComplete(result);
      }
    } catch (err) {
      // Error is managed by hook
      console.error('Search failed:', err);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    setShowDropdown(false);
    try {
      const result = await selectSuggestion(suggestion);
      if (result && onSearchComplete) {
        onSearchComplete(result);
      }
    } catch (err) {
      console.error('Suggestion select failed:', err);
    }
  };

  const handleKeyDown = (e) => {
    const items = suggestions.length > 0 ? suggestions : history;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowDropdown(true);
      setHighlightIndex(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0 && items[highlightIndex]) {
        e.preventDefault();
        handleSuggestionClick(items[highlightIndex]);
      } else {
        handleSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // ──────────────────────────────────────────────────────────────────────
  // Render logic
  // ──────────────────────────────────────────────────────────────────────

  const displayItems = suggestions.length > 0 ? suggestions : history;
  const showSuggestions = showDropdown && (displayItems.length > 0 || history.length > 0);

  return (
    <div className="smart-search">
      {/* Input container */}
      <form onSubmit={handleSubmit} className="smart-search__form">
        <div className="smart-search__input-wrap">
          <Search className="smart-search__icon" size={20} />
          
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search stocks... (AAPL, Microsoft, HINDCOPPER, etc.)"
            className="smart-search__input"
            disabled={isSearching}
          />

          {/* Right actions */}
          <div className="smart-search__actions">
            {isSearching && <Loader2 className="smart-search__spinner" size={16} />}
            {query && !isSearching && (
              <button
                type="button"
                onClick={handleClear}
                className="smart-search__clear"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="smart-search__submit"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="smart-search__error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div ref={dropdownRef} className="smart-search__dropdown">
          {/* Recent searches header */}
          {suggestions.length === 0 && history.length > 0 && (
            <div className="smart-search__dropdown-header">
              <div className="smart-search__dropdown-title">
                <Clock size={14} />
                Recent Searches
              </div>
              <button
                type="button"
                onClick={clearHistory}
                className="smart-search__clear-history"
              >
                Clear
              </button>
            </div>
          )}

          {/* Suggestions list */}
          <ul className="smart-search__list">
            {displayItems.map((item, idx) => (
              <li
                key={`${item.symbol}-${idx}`}
                className={`smart-search__item ${
                  highlightIndex === idx ? 'smart-search__item--highlighted' : ''
                }`}
                onClick={() => handleSuggestionClick(item)}
              >
                <div className="smart-search__item-icon">
                  {suggestions.length === 0 ? <Clock size={16} /> : <TrendingUp size={16} />}
                </div>
                
                <div className="smart-search__item-content">
                  <div className="smart-search__item-symbol">
                    {item.symbol}
                    <span className="smart-search__item-market">
                      {item.market === 'INDIA' ? '🇮🇳' : '🇺🇸'}
                    </span>
                  </div>
                  <div className="smart-search__item-name">{item.name}</div>
                </div>

                <div className="smart-search__item-exchange">
                  {item.exchange || (item.market === 'INDIA' ? 'NSE' : 'NASDAQ')}
                </div>
              </li>
            ))}
          </ul>

          {/* No results state */}
          {displayItems.length === 0 && history.length === 0 && (
            <div className="smart-search__empty">
              <p>No recent searches</p>
              <p className="smart-search__empty-hint">
                Try: AAPL, Microsoft, ORCL, HINDCOPPER
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
