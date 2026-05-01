import React, { useState, useCallback, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceArea,
} from 'recharts';
import { CalendarDays, Search, ZoomIn, ZoomOut, ArrowLeft, RefreshCw } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import InfoTooltip from '../components/InfoTooltip';

// ── Time range presets ─────────────────────────────────────────────────────
const PRESETS = [
  { label: '1H',  ms: 60 * 60_000 },
  { label: '24H', ms: 24 * 60 * 60_000 },
  { label: '7D',  ms: 7  * 24 * 60 * 60_000 },
  { label: '1M',  ms: 30 * 24 * 60 * 60_000 },
  { label: '1Y',  ms: 365 * 24 * 60 * 60_000 },
];

const fmtTs = (ts, rangeMs) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (rangeMs <= 60 * 60_000)       return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (rangeMs <= 24 * 60 * 60_000)  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtPrice = (v, coinId) => {
  if (v == null || v === 0) return '—';
  const d = coinId === 'DOGE-USD' ? 4 : 2;
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};

// ── OHLC Summary Panel ───────────────────────────────────────────────────────
const OHLCPanel = ({ summary, coin, rangeLabel }) => {
  if (!summary || summary.message) return null;
  const isUp = summary.change >= 0;

  const items = [
    { label: 'Open',       value: fmtPrice(summary.open, coin.id),       tip: 'First price recorded in this period' },
    { label: 'Close',      value: fmtPrice(summary.close, coin.id),      tip: 'Last price recorded in this period' },
    { label: 'High',       value: fmtPrice(summary.high, coin.id),       tip: 'Highest price in this period' },
    { label: 'Low',        value: fmtPrice(summary.low, coin.id),        tip: 'Lowest price in this period' },
    { label: 'Total Trades',value: summary.totalTrades?.toLocaleString() ?? '—', tip: 'Total number of individual trade ticks in this period' },
    { label: 'Volatility', value: summary.volatility != null ? `${summary.volatility.toFixed(2)}%` : '—', tip: 'Price swing as % of the high. Higher = more movement' },
  ];

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Period Summary</h3>
            <InfoTooltip text="OHLC breakdown for your selected time range" />
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">{rangeLabel}</p>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          <span>{isUp ? '+' : ''}{summary.change?.toFixed(2)}%</span>
          <span className="text-[10px] font-normal text-slate-500">period change</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map(item => (
          <div key={item.label} className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/30">
            <div className="flex items-center mb-1.5">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{item.label}</span>
              <InfoTooltip text={item.tip} />
            </div>
            <div className="text-sm font-bold text-white tabular-nums">{item.value}</div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-600 mt-3">
        Based on {summary.dataPoints?.toLocaleString()} data points collected by Flink
      </p>
    </div>
  );
};

// ── Main Historical Chart ────────────────────────────────────────────────────
const HistoricalChart = ({ coin, onBack }) => {
  const [chartData,    setChartData]    = useState([]);
  const [summary,      setSummary]      = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [customStart,  setCustomStart]  = useState(null);
  const [customEnd,    setCustomEnd]    = useState(null);
  const [rangeMs,      setRangeMs]      = useState(0);
  const [rangeLabel,   setRangeLabel]   = useState('');
  const [hasData,      setHasData]      = useState(false);

  // Drag-to-zoom state
  const [refAreaLeft,  setRefAreaLeft]  = useState('');
  const [refAreaRight, setRefAreaRight] = useState('');
  const [isZooming,    setIsZooming]    = useState(false);
  const [zoomedData,   setZoomedData]   = useState(null);
  const isSelecting = useRef(false);

  const color = coin?.color || '#34d399';

  const fetchRange = useCallback(async (start, end, label) => {
    setLoading(true);
    setError(null);
    setZoomedData(null);
    setRefAreaLeft('');
    setRefAreaRight('');
    try {
      const [chartRes, sumRes] = await Promise.all([
        analyticsAPI.getHistorical(coin.id, start, end),
        analyticsAPI.getRangeSummary(coin.id, start, end),
      ]);
      const data = Array.isArray(chartRes.data) ? chartRes.data : [];
      setChartData(data);
      setSummary(sumRes.data);
      setRangeMs(end - start);
      setRangeLabel(label);
      setHasData(data.length > 0);
    } catch {
      setError('Failed to load historical data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, [coin.id]);

  const handlePreset = (preset) => {
    setActivePreset(preset.label);
    setCustomStart(null);
    setCustomEnd(null);
    const end   = Date.now();
    const start = end - preset.ms;
    const label = `Last ${preset.label}`;
    fetchRange(start, end, label);
  };

  const handleCustomRange = () => {
    if (!customStart || !customEnd) return;
    setActivePreset(null);
    const start = customStart.getTime();
    const end   = customEnd.getTime();
    if (end <= start) { setError('End date must be after start date.'); return; }
    const label = `${customStart.toLocaleDateString()} → ${customEnd.toLocaleDateString()}`;
    fetchRange(start, end, label);
  };

  // Drag-to-zoom handlers
  const onMouseDown  = (e) => { if (e?.activeLabel) { isSelecting.current = true; setRefAreaLeft(e.activeLabel); setRefAreaRight(''); } };
  const onMouseMove  = (e) => { if (isSelecting.current && e?.activeLabel) setRefAreaRight(e.activeLabel); };
  const onMouseUp    = () => {
    if (!isSelecting.current || !refAreaLeft || !refAreaRight) { isSelecting.current = false; return; }
    isSelecting.current = false;
    const display = zoomedData ?? chartData;
    let l = Math.min(Number(refAreaLeft), Number(refAreaRight));
    let r = Math.max(Number(refAreaLeft), Number(refAreaRight));
    const zoomed = display.filter(d => d.timestamp >= l && d.timestamp <= r);
    if (zoomed.length > 1) setZoomedData(zoomed);
    setRefAreaLeft('');
    setRefAreaRight('');
  };

  const displayData = zoomedData ?? chartData;
  const prices = displayData.flatMap(d => [d.avgPrice, d.ema].filter(Boolean));
  const minP = prices.length ? Math.min(...prices) * 0.9994 : 0;
  const maxP = prices.length ? Math.max(...prices) * 1.0006 : 100;
  const hasEma = displayData.some(d => d.ema != null && d.ema > 0);
  const gradId = `hist-${coin.id.replace('-', '')}`;

  const yFmt = (v) => {
    if (!v) return '';
    if (coin.id === 'DOGE-USD') return `$${v.toFixed(3)}`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs min-w-[140px]">
        <p className="text-slate-400 mb-2">{new Date(d?.timestamp).toLocaleString()}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Price</span>
            <span className="font-bold" style={{ color }}>{fmtPrice(d?.avgPrice, coin.id)}</span>
          </div>
          {d?.ema > 0 && (
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">EMA</span>
              <span className="font-bold text-slate-200">{fmtPrice(d?.ema, coin.id)}</span>
            </div>
          )}
          <div className="flex justify-between gap-6">
            <span className="text-slate-400">Trades</span>
            <span className="text-slate-300">{d?.count?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-slate-600/60 hover:bg-slate-800/40">
            <ArrowLeft className="w-3.5 h-3.5" />
            Live Dashboard
          </button>
          <div>
            <h2 className="text-base font-bold text-white">Historical Analysis</h2>
            <p className="text-[11px] text-slate-500">Query any time range from your collected data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: coin.color }} />
          <span className="text-sm font-semibold text-white">{coin.name}</span>
          <span className="text-xs text-slate-500">{coin.id}</span>
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
        <div className="flex flex-wrap items-end gap-4">

          {/* Preset buttons */}
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-2">Quick Range</p>
            <div className="flex gap-1.5">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => handlePreset(p)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activePreset === p.label
                      ? 'text-white border'
                      : 'text-slate-400 bg-slate-900/50 border border-slate-700/50 hover:text-slate-200 hover:bg-slate-700/40'
                  }`}
                  style={activePreset === p.label ? {
                    background: `linear-gradient(135deg, ${color}25, ${color}08)`,
                    borderColor: `${color}50`,
                  } : {}}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-8 bg-slate-700/60 hidden sm:block" />

          {/* Custom date range */}
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-2">From</p>
              <DatePicker
                selected={customStart}
                onChange={setCustomStart}
                selectsStart
                startDate={customStart}
                endDate={customEnd}
                maxDate={new Date()}
                placeholderText="Select start"
                className="bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-2 w-36 focus:outline-none focus:border-slate-500 cursor-pointer"
                calendarClassName="!bg-slate-800 !border-slate-700 !text-slate-200"
              />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mb-2">To</p>
              <DatePicker
                selected={customEnd}
                onChange={setCustomEnd}
                selectsEnd
                startDate={customStart}
                endDate={customEnd}
                minDate={customStart}
                maxDate={new Date()}
                placeholderText="Select end"
                className="bg-slate-900/80 border border-slate-700/60 text-slate-200 text-xs rounded-lg px-3 py-2 w-36 focus:outline-none focus:border-slate-500 cursor-pointer"
              />
            </div>
            <button onClick={handleCustomRange}
              disabled={!customStart || !customEnd || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: `linear-gradient(135deg, ${color}50, ${color}25)`, border: `1px solid ${color}40` }}>
              <Search className="w-3.5 h-3.5" />
              Analyse
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-10 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" style={{ color }} />
            Querying historical data...
          </div>
        </div>
      )}

      {!loading && hasData && (
        <>
          {/* ── Chart ── */}
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-200">Price History</h3>
                  {zoomedData && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 flex items-center gap-1">
                      <ZoomIn className="w-2.5 h-2.5" />
                      Zoomed
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {zoomedData
                    ? 'Drag on chart to zoom further · '
                    : 'Drag on chart to zoom into a section · '}
                  {zoomedData && (
                    <button onClick={() => setZoomedData(null)}
                      className="text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-0.5">
                      <ZoomOut className="w-3 h-3" />Reset zoom
                    </button>
                  )}
                  {!zoomedData && <span className="text-slate-600">Click reset to return</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: color }} />
                  Price
                </span>
                {hasEma && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-px border-t-2 border-dashed border-slate-500 inline-block" />
                    EMA-14
                  </span>
                )}
              </div>
            </div>

            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart
                data={displayData}
                margin={{ top: 8, right: 4, left: -8, bottom: 0 }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
              >
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" vertical={false} />
                <XAxis dataKey="timestamp"
                  tickFormatter={(t) => fmtTs(t, rangeMs)}
                  stroke="transparent" tick={{ fill: '#475569', fontSize: 10 }}
                  interval="preserveStartEnd" minTickGap={60} />
                <YAxis tickFormatter={yFmt} stroke="transparent"
                  tick={{ fill: '#475569', fontSize: 10 }}
                  domain={[minP, maxP]} width={60} />
                <Tooltip content={<CustomTooltip />}
                  cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 3', strokeOpacity: 0.5 }} />
                <Area type="monotone" dataKey="avgPrice" stroke={color} strokeWidth={2}
                  fill={`url(#${gradId})`} dot={false} connectNulls
                  activeDot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }} />
                {hasEma && (
                  <Line type="monotone" dataKey="ema" stroke="#64748b" strokeWidth={1.5}
                    strokeDasharray="5 3" dot={false} connectNulls />
                )}
                {refAreaLeft && refAreaRight && (
                  <ReferenceArea x1={refAreaLeft} x2={refAreaRight} fill={color} fillOpacity={0.08} stroke={color} strokeOpacity={0.3} />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* ── OHLC Summary Panel ── */}
          <OHLCPanel summary={summary} coin={coin} rangeLabel={rangeLabel} />
        </>
      )}

      {!loading && !hasData && activePreset && (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 p-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-700/40 mx-auto flex items-center justify-center mb-3">
            <CalendarDays className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-slate-400 text-sm font-medium">No data for this range</p>
          <p className="text-slate-600 text-xs mt-1">
            The system only has data from when Flink started streaming. Try a shorter range like 1H or 24H.
          </p>
        </div>
      )}

      {!loading && !hasData && !activePreset && !customStart && (
        <div className="rounded-2xl border border-slate-700/40 border-dashed bg-transparent p-12 text-center">
          <div className="w-10 h-10 rounded-xl bg-slate-800/60 mx-auto flex items-center justify-center mb-3">
            <CalendarDays className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">Select a time range above to explore historical data</p>
          <p className="text-slate-600 text-xs mt-1">Use quick presets or pick a custom From → To date range</p>
        </div>
      )}
    </div>
  );
};

export default HistoricalChart;
