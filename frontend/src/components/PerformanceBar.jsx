/**
 * src/components/PerformanceBar.jsx  ← NEW component
 *
 * Renders the price range bar section shown in screenshots:
 * - Today's Low ───●────── Today's High
 * - 52 Week Low ────────●─ 52 Week High
 * - Open, Prev Close, Volume, Circuit limits
 */

export default function PerformanceBar({ performance, market = 'INDIA' }) {
  if (!performance) return null;

  const currency = market === 'INDIA' ? '₹' : '$';
  const {
    today_low, today_high, week52_low, week52_high,
    current, open, prev_close, volume,
    lower_circuit, upper_circuit,
  } = performance;

  const todayPct  = rangePct(current, today_low, today_high);
  const week52Pct = week52_high > week52_low
    ? rangePct(current, week52_low, week52_high)
    : null;

  return (
    <section className="perf-bar">
      <div className="perf-bar__header">
        <h3>Performance</h3>
      </div>

      {/* Intraday range */}
      <RangeSlider
        label="Today"
        low={today_low}
        high={today_high}
        pct={todayPct}
        currency={currency}
      />

      {/* 52-week range */}
      {week52Pct !== null && (
        <RangeSlider
          label="52 Week"
          low={week52_low}
          high={week52_high}
          pct={week52Pct}
          currency={currency}
        />
      )}

      {/* Stats grid */}
      <div className="perf-bar__grid">
        <StatCell label="Open"        value={`${currency}${fmt(open)}`} />
        <StatCell label="Prev. Close" value={`${currency}${fmt(prev_close)}`} />
        <StatCell label="Volume"      value={Number(volume).toLocaleString()} />
        {lower_circuit && <StatCell label="Lower Circuit" value={`${currency}${fmt(lower_circuit)}`} dim />}
        {upper_circuit && <StatCell label="Upper Circuit" value={`${currency}${fmt(upper_circuit)}`} dim />}
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RangeSlider({ label, low, high, pct, currency }) {
  return (
    <div className="range-slider">
      <div className="range-slider__labels">
        <span>
          <em>{label}&apos;s Low</em>
          <strong>{currency}{fmt(low)}</strong>
        </span>
        <span>
          <em>{label === 'Today' ? "Today's" : '52 Week'} High</em>
          <strong>{currency}{fmt(high)}</strong>
        </span>
      </div>
      <div className="range-slider__track">
        <div className="range-slider__fill" style={{ width: `${pct}%` }} />
        <div className="range-slider__thumb" style={{ left: `${pct}%` }} />
      </div>
    </div>
  );
}

function StatCell({ label, value, dim }) {
  return (
    <div className={`perf-bar__stat ${dim ? 'perf-bar__stat--dim' : ''}`}>
      <span className="perf-bar__stat-label">{label}</span>
      <strong className="perf-bar__stat-value">{value}</strong>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function rangePct(current, low, high) {
  if (high === low) return 50;
  return Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100));
}

function fmt(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
