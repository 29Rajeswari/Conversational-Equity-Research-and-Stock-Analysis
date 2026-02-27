import { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { streamClient } from "@/websocket/streamClient";

const TIMEFRAMES = {
  "1D": "1min",
  "1W": "5min",
  "1M": "15min",
  "3M": "1h",
  "1Y": "1day",
};

export default function TradingChart({ symbol, market = "US", exchange }) {
  const chartRef = useRef();
  const containerRef = useRef();
  const candleSeriesRef = useRef();
  const lineSeriesRef = useRef();
  const volumeSeriesRef = useRef();

  const [chartType, setChartType] = useState("candle");
  const [timeframe, setTimeframe] = useState("1D");
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  // 🟢 Market Open Detector
  useEffect(() => {
    const hour = new Date().getHours();
    setIsMarketOpen(hour >= 9 && hour <= 16);
  }, []);

  useEffect(() => {
    const chart = createChart(containerRef.current, {
      height: 420,
      layout: {
        background: { color: "#0f172a" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderVisible: false },
      timeScale: { timeVisible: true },
    });

    chartRef.current = chart;

    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    lineSeriesRef.current = chart.addLineSeries({
      color: "#3DD9D0",
      lineWidth: 2,
      visible: false,
    });

    volumeSeriesRef.current = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    return () => chart.remove();
  }, []);

  // 🔥 WebSocket Streaming
  useEffect(() => {
    if (!symbol) return;

    streamClient.connect();
    streamClient.subscribe([symbol], market, TIMEFRAMES[timeframe], exchange);

    const unsub = streamClient.on("candle", (msg) => {
      if (msg.data.symbol !== symbol) return;

      const candle = {
        time: Math.floor(new Date(msg.data.timestamp).getTime() / 1000),
        open: msg.data.open,
        high: msg.data.high,
        low: msg.data.low,
        close: msg.data.close,
      };

      candleSeriesRef.current.update(candle);
      lineSeriesRef.current.update({
        time: candle.time,
        value: candle.close,
      });

      volumeSeriesRef.current.update({
        time: candle.time,
        value: msg.data.volume,
        color: candle.close >= candle.open ? "#26a69a" : "#ef5350",
      });
    });

    return () => unsub();
  }, [symbol, timeframe]);

  // 🔄 Toggle Chart Type
  useEffect(() => {
    candleSeriesRef.current.applyOptions({ visible: chartType === "candle" });
    lineSeriesRef.current.applyOptions({ visible: chartType === "line" });
  }, [chartType]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <strong>{symbol}</strong>
          <span style={{ marginLeft: 10 }}>
            {isMarketOpen ? "🟢 Market Open" : "🔴 Market Closed"}
          </span>
        </div>

        {/* Chart Toggle */}
        <div>
          <button onClick={() => setChartType("line")}>📈</button>
          <button onClick={() => setChartType("candle")}>🕯</button>
        </div>
      </div>

      {/* Timeframes */}
      <div style={{ marginTop: 10 }}>
        {Object.keys(TIMEFRAMES).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            style={{
              marginRight: 8,
              background: timeframe === tf ? "#1e293b" : "transparent",
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      <div ref={containerRef} />
    </div>
  );
}
