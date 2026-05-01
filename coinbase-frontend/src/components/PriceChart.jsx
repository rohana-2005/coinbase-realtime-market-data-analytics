import React from 'react';
import {
  AreaChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Legend,
} from 'recharts';

const PriceChart = ({ data, title, color = '#34d399', coinId = 'BTC-USD' }) => {
  const formatTime = (ts) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const decimals = coinId === 'DOGE-USD' ? 4 : 2;
  const fmt = (v) =>
    v != null ? `$${v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : '—';

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-slate-800/95 border border-slate-600/60 rounded-xl p-3 shadow-2xl backdrop-blur-sm min-w-[140px]">
        <p className="text-slate-400 text-xs mb-2">{formatTime(d?.timestamp)}</p>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <span className="w-2 h-0.5 rounded inline-block" style={{ background: color }}/>Price
            </span>
            <span className="text-xs font-bold" style={{ color }}>{fmt(d?.avgPrice)}</span>
          </div>
          {d?.ema != null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-0.5 rounded inline-block border-t-2 border-dashed border-slate-300"/>EMA
              </span>
              <span className="text-xs font-bold text-slate-200">{fmt(d?.ema)}</span>
            </div>
          )}
          {d?.count && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500">Trades</span>
              <span className="text-xs text-slate-300">{d.count}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const chartData = data.filter(item => item?.avgPrice > 0);
  const hasEma = chartData.some(d => d.ema != null && d.ema > 0);

  const prices = chartData.flatMap(d => [d.avgPrice, d.ema].filter(Boolean));
  const minP = prices.length ? Math.min(...prices) * 0.9995 : 0;
  const maxP = prices.length ? Math.max(...prices) * 1.0005 : 100;

  const yFmt = (v) => {
    if (coinId === 'DOGE-USD') return `$${v.toFixed(3)}`;
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
    return `$${v.toFixed(2)}`;
  };

  const gradId = `pg-${coinId.replace('-', '')}`;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 hover:border-slate-600/60 transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <span className="w-3 h-0.5 rounded inline-block" style={{ background: color }}/>Price
          </span>
          {hasEma && (
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-3 h-px border-t border-dashed border-slate-300 inline-block"/>EMA-14
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd"
            minTickGap={40} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={yFmt} stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 10 }} domain={[minP, maxP]}
            axisLine={false} tickLine={false} width={62} />
          <Tooltip content={<CustomTooltip />}
            cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4' }} />

          {/* Price filled area */}
          <Area type="monotone" dataKey="avgPrice" stroke={color} strokeWidth={2}
            fill={`url(#${gradId})`} dot={false} connectNulls
            activeDot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }} />

          {/* EMA dashed line — only rendered once data is available */}
          {hasEma && (
            <Line type="monotone" dataKey="ema" stroke="#94a3b8" strokeWidth={1.5}
              strokeDasharray="5 4" dot={false} connectNulls
              activeDot={{ r: 3, fill: '#94a3b8', stroke: '#0f172a', strokeWidth: 2 }} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
