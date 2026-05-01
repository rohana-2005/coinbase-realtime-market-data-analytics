import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import InfoTooltip from './InfoTooltip';

const CountChart = ({ data, title, color = '#34d399' }) => {
  const fmtTime = (ts) => {
    if (!ts) return '';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }
    catch { return ''; }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div className="bg-slate-800 border border-slate-700/80 rounded-xl p-3 shadow-2xl text-xs min-w-[130px]">
        <p className="text-slate-400 mb-2 font-medium">{fmtTime(d?.timestamp)}</p>
        <div className="flex justify-between gap-6">
          <span className="text-slate-400">Updates</span>
          <span className="font-semibold" style={{ color }}>{payload[0].value?.toLocaleString()}</span>
        </div>
        {d?.avgPrice != null && (
          <div className="flex justify-between gap-6 mt-1">
            <span className="text-slate-400">Avg Price</span>
            <span className="text-slate-300">${d.avgPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>
    );
  };

  const chartData = data.filter(item => item?.count > 0);
  const maxCount = chartData.length ? Math.max(...chartData.map(d => d.count)) : 1;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 hover:border-slate-600/50 transition-all duration-300 animate-fade-in stagger-3">
      {/* Header */}
      <div className="mb-1">
        <div className="flex items-center">
          <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
          <InfoTooltip text="Number of trade updates received in each 5-minute interval. A tall bar means heavy trading activity during that period." />
        </div>
        <p className="text-[11px] text-slate-500 mt-0.5">Trade frequency · 5-minute windows · last 1 hour</p>
      </div>

      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2d40" vertical={false} />
          <XAxis dataKey="timestamp" tickFormatter={fmtTime} stroke="transparent"
            tick={{ fill: '#475569', fontSize: 10 }} interval="preserveStartEnd"
            minTickGap={50} axisLine={false} tickLine={false} />
          <YAxis stroke="transparent" tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false} tickLine={false} width={36} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: `${color}09` }} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} minPointSize={2}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={color} fillOpacity={0.35 + 0.65 * (entry.count / maxCount)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CountChart;
