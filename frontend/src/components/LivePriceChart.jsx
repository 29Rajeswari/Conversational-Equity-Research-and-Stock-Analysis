/**
 * src/components/LivePriceChart.jsx  ← NEW component
 * Drop alongside existing FinancialCharts.jsx — do not modify it.
 *
 * Real-time candlestick + line chart powered by Recharts.
 * Consumes useStockChart + live quote from useStockQuote.
 * Interval switcher built-in (1min → 1day).
 */

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useStockChart } from '@/hooks/useStockChart';
import { useStockQuote } from '@/hooks/useStockQuote';
import LiveBadge from './LiveBadge';

const INTERVALS = [
  { label: '1D',  value: '1min'  },
  { label: '1W',  value: '5min'  },
  { label: '1M',  value: '15min' },
  { label: '3M',  value: '30min' },
  { label: '6M',  value: '1h'    },
  { label: '1Y',  value: '1day'  },
  { label: 'All', value: '1day'  },
];

export default function LivePriceChart({ symbol, market = 'US', exchange = 'NSE_EQ' }) {
  const [activeInterval, setActiveInterval] = useState('5min');

  const { candles, loading, error, setInterval } = useStockChart(symbol, market, exchange, activeInterval);
  const { quote, isLive } = useStockQuote(symbol, market, exchange);

  const handleIntervalChange = (iv) => {
    setActiveInterval(iv);
    setInterval(iv);
  };

  const isDown = quote ? quote.change_percent < 0 : false;
  const lineColor = isDown ? '#FF5C5C' : '#3DD9D0';

  if (error) {
    return (
      <div className="chart-error">
        <p>Chart unavailable: {error}</p>
      </div>
    );
  }

  return (
    <div className="live-chart">
      {/* Header row */}
      <div className="live-chart__header">
        <div className="live-chart__price-block">
          <span className="live-chart__symbol">{symbol}</span>
          {quote && (
            <>
              <span className="live-chart__price">
                {quote.market === 'INDIA' ? '₹' : '$'}
                {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`live-chart__change ${isDown ? 'live-chart__change--down' : 'live-chart__change--up'}`}>
                {isDown ? '▼' : '▲'} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.change_percent).toFixed(2)}%)
              </span>
            </>
          )}
          <LiveBadge live={isLive} />
        </div>

        {/* Interval buttons */}
        <div className="live-chart__intervals">
          {INTERVALS.map(iv => (
            <button
              key={iv.label}
              onClick={() => handleIntervalChange(iv.value)}
              className={`live-chart__interval-btn ${activeInterval === iv.value ? 'live-chart__interval-btn--active' : ''}`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="live-chart__canvas" style={{ height: 320 }}>
        {loading && candles.length === 0 ? (
          <div className="live-chart__skeleton" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={candles} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis
                dataKey="timestamp"
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                tickFormatter={formatTimestamp}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                width={55}
                tickFormatter={v => v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              />
              <Tooltip
                content={<ChartTooltip market={quote?.market} />}
                cursor={{ stroke: 'rgba(61,217,208,0.3)', strokeWidth: 1 }}
              />
              {quote?.prev_close && (
                <ReferenceLine
                  y={quote.prev_close}
                  stroke="#9CA3AF"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />
              )}
              <Bar dataKey="volume" fill="rgba(61,217,208,0.08)" yAxisId={0} />
              <Line
                type="monotone"
                dataKey="close"
                stroke={lineColor}
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 3, fill: lineColor }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label, market }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload ?? {};
  const currency = market === 'INDIA' ? '₹' : '$';
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__time">{label}</p>
      {d.open  !== undefined && <p>O: {currency}{d.open.toFixed(2)}</p>}
      {d.high  !== undefined && <p>H: {currency}{d.high.toFixed(2)}</p>}
      {d.low   !== undefined && <p>L: {currency}{d.low.toFixed(2)}</p>}
      {d.close !== undefined && <p>C: {currency}{d.close.toFixed(2)}</p>}
      {d.volume !== undefined && <p className="chart-tooltip__vol">Vol: {Number(d.volume).toLocaleString()}</p>}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return ts;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
