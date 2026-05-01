import React from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import InfoTooltip from './InfoTooltip';

const PriceChart = ({ data, title, color = '#34d399', coinId = 'BTC-USD' }) => {
  const fmtTime = (ts) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const dec = coinId === 'DOGE-USD' ? 4 : 2;
  const fmtPrice = (v) =>
    v != null ? `$${v.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}` : '—';

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs min-w-[140px]">
        <p className="text-slate-400 mb-2 font-medium">{fmtTime(d?.timestamp)}</p>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-6">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 rounded inline-block" style={{ background: color }} />
              Price
            </span>
            <span className="font-semibold" style={{ color }}>{fmtPrice(d?.avgPrice)}</span>
          </div>
          {d?.ema != null && d.ema > 0 && (
            <div className="flex justify-between gap-6">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-px inline-block border-t-2 border-dashed border-slate-400" />
                EMA-14
              </span>
              <span className="font-semibold text-slate-200">{fmtPrice(d?.ema)}</span>
            </div>
          )}
          {d?.count != null && (
            <div className="flex justify-between gap-6">
              <span className="text-slate-400">Trades</span>
              <span className="text-slate-300">{d.count}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const chartData = data.filter(item => item?.avgPrice > 0);
  const hasEma = chartData.some(d => d.ema != null && d.ema > 0);
  const prices = chartData.flatMap(d => [d.avgPrice, d.ema].filter(Boolean));
  const minP = prices.length ? Math.min(...prices) * 0.9994 : 0;
  const maxP = prices.length ? Math.max(...prices) * 1.0006 : 100;

  const yFmt = (v) => {
    if (coinId === 'DOGE-USD') return `$${v.toFixed(3)}`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(2)}`;
  };

  const gradId = `pg-${coinId.replace('-', '')}`;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 hover:border-slate-600/50 transition-all duration-300 animate-fade-in stagger-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="flex items-center">
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            <InfoTooltip text="Real-time price averaged over 10-second windows. The dashed line is EMA — a smoothed trend that ignores short-term noise." />
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Live price · updated every 10 seconds</p>
        </div>
        {hasEma && (
          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 rounded inline-block" style={{ background: color }} />
              Price
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-px border-t-2 border-dashed border-slate-400 inline-block" />
              EMA-14
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" vertical={false} />
          <XAxis dataKey="timestamp" tickFormatter={fmtTime} stroke="transparent"
            tick={{ fill: '#475569', fontSize: 10 }} interval="preserveStartEnd"
            minTickGap={50} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={yFmt} stroke="transparent"
            tick={{ fill: '#475569', fontSize: 10 }} domain={[minP, maxP]}
            axisLine={false} tickLine={false} width={58} />
          <Tooltip content={<CustomTooltip />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 3', strokeOpacity: 0.5 }} />
          <Area type="monotone" dataKey="avgPrice" stroke={color} strokeWidth={2}
            fill={`url(#${gradId})`} dot={false} connectNulls
            activeDot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }} />
          {hasEma && (
            <Line type="monotone" dataKey="ema" stroke="#64748b" strokeWidth={1.5}
              strokeDasharray="5 3" dot={false} connectNulls
              activeDot={{ r: 3, fill: '#94a3b8', stroke: '#0f172a', strokeWidth: 1.5 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
