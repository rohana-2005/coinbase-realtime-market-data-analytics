import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CountChart = ({ data, title, color = '#34d399' }) => {
  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-slate-800/95 border border-slate-600/60 rounded-xl p-3 shadow-2xl backdrop-blur-sm">
        <p className="text-slate-400 text-xs mb-1">{formatTime(payload[0].payload.timestamp)}</p>
        <p className="font-bold text-base" style={{ color }}>
          {payload[0].value?.toLocaleString()} updates
        </p>
        {payload[0].payload.avgPrice && (
          <p className="text-slate-400 text-xs mt-1">
            Avg: ${payload[0].payload.avgPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        )}
      </div>
    );
  };

  const chartData = data.filter(item => item?.count > 0);
  const maxCount = chartData.length ? Math.max(...chartData.map(d => d.count)) : 1;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 hover:border-slate-600/60 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full bg-slate-700/60 text-slate-400">
          Updates / 5m
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#334155"
            tick={{ fill: '#64748b', fontSize: 10 }} interval="preserveStartEnd"
            minTickGap={40} axisLine={false} tickLine={false} />
          <YAxis stroke="#334155" tick={{ fill: '#64748b', fontSize: 10 }}
            axisLine={false} tickLine={false} width={40} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: `${color}08` }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={2}>
            {chartData.map((entry, index) => {
              // Brightest bar = highest count, others fade slightly
              const opacity = 0.4 + 0.6 * (entry.count / maxCount);
              return <Cell key={index} fill={color} fillOpacity={opacity} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CountChart;
