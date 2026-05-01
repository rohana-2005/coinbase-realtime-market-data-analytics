import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PriceChart = ({ data, title, color = '#34d399', coinId = 'BTC-USD' }) => {
  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const decimals = coinId === 'DOGE-USD' ? 4 : 2;
  const formatPrice = (v) =>
    `$${v?.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800/95 border border-slate-600/60 rounded-xl p-3 shadow-2xl backdrop-blur-sm">
        <p className="text-slate-400 text-xs mb-1">{formatTime(payload[0].payload.timestamp)}</p>
        <p className="font-bold text-base" style={{ color }}>{formatPrice(payload[0].value)}</p>
        {payload[0].payload.count && (
          <p className="text-slate-400 text-xs mt-1">Trades: {payload[0].payload.count}</p>
        )}
      </div>
    );
  };

  const chartData = data.filter(item => item?.avgPrice > 0);
  const prices = chartData.map(d => d.avgPrice).filter(Boolean);
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
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full bg-slate-700/60 text-slate-400">
          Avg Price
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
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
          <Area type="monotone" dataKey="avgPrice" stroke={color} strokeWidth={2}
            fill={`url(#${gradId})`} dot={false} connectNulls
            activeDot={{ r: 4, fill: color, stroke: '#0f172a', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
