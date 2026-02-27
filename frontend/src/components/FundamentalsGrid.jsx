/**
 * src/components/FundamentalsGrid.jsx  ← NEW component
 *
 * Renders the Fundamentals section from screenshots:
 * Mkt Cap, P/E, P/B, ROE, EPS, Div Yield, Debt/Equity, Book Value, Face Value
 */

export default function FundamentalsGrid({ fundamentals, market = 'INDIA' }) {
  if (!fundamentals) return null;

  const currency = market === 'INDIA' ? '₹' : '$';

  const metrics = [
    { label: 'Mkt Cap',          value: formatCap(fundamentals.market_cap, currency) },
    { label: 'ROE',              value: pct(fundamentals.roe) },
    { label: 'P/E Ratio (TTM)', value: dec2(fundamentals.pe_ratio) },
    { label: 'EPS (TTM)',        value: dec2(fundamentals.eps) },
    { label: 'P/B Ratio',        value: dec2(fundamentals.pb_ratio) },
    { label: 'Div Yield',        value: pct(fundamentals.div_yield) },
    { label: 'Industry P/E',     value: dec2(fundamentals.industry_pe) },
    { label: 'Book Value',       value: dec2(fundamentals.book_value) },
    { label: 'Debt to Equity',   value: dec2(fundamentals.debt_to_equity) },
    { label: 'Face Value',       value: dec2(fundamentals.face_value) },
  ].filter(m => m.value !== '—');

  return (
    <section className="fundamentals">
      <div className="fundamentals__header">
        <h3>Fundamentals</h3>
      </div>
      <div className="fundamentals__grid">
        {metrics.map(({ label, value }) => (
          <div key={label} className="fundamentals__cell">
            <span className="fundamentals__label">{label}</span>
            <strong className="fundamentals__value">{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function dec2(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function pct(n) {
  if (n == null) return '—';
  return `${Number(n).toFixed(2)}%`;
}

function formatCap(n, currency) {
  if (n == null) return '—';
  if (n >= 1e12) return `${currency}${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9)  return `${currency}${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e7)  return `${currency}${(n / 1e7).toFixed(2)}Cr`;   // Indian convention
  return `${currency}${Number(n).toLocaleString()}`;
}
