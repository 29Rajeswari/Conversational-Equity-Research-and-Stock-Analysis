/**
 * src/components/MarketSelector.jsx  ← NEW component
 *
 * Market toggle (US ↔ INDIA) + Exchange dropdown.
 * Wires directly to MarketContext — no props needed.
 *
 * Usage:
 *   <MarketSelector />
 */

import { useMarket } from '@/context/MarketContext';

const EXCHANGES = {
  INDIA: [
    { label: 'NSE', value: 'NSE_EQ' },
    { label: 'BSE', value: 'BSE_EQ' },
  ],
  US: [
    { label: 'NASDAQ', value: 'NASDAQ' },
    { label: 'NYSE',   value: 'NYSE' },
  ],
};

export default function MarketSelector() {
  const { market, exchange, setMarket, setExchange } = useMarket();

  const handleMarketChange = (m) => {
    setMarket(m);
    setExchange(EXCHANGES[m][0].value);
  };

  return (
    <div className="market-selector">
      {/* Market toggle */}
      <div className="market-selector__toggle">
        {['US', 'INDIA'].map(m => (
          <button
            key={m}
            onClick={() => handleMarketChange(m)}
            className={`market-selector__btn ${market === m ? 'market-selector__btn--active' : ''}`}
          >
            {m === 'US' ? '🇺🇸 US' : '🇮🇳 India'}
          </button>
        ))}
      </div>

      {/* Exchange dropdown */}
      <select
        value={exchange}
        onChange={e => setExchange(e.target.value)}
        className="market-selector__exchange"
      >
        {(EXCHANGES[market] ?? []).map(ex => (
          <option key={ex.value} value={ex.value}>{ex.label}</option>
        ))}
      </select>
    </div>
  );
}
