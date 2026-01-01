import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CountChart = ({ data, title }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-slate-400 text-xs mb-1">
            {formatTime(payload[0].payload.timestamp)}
          </p>
          <p className="text-white font-semibold">
            Updates: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTime}
            stroke="#64748b"
            style={{ fontSize: '11px' }}
          />
          <YAxis 
            stroke="#64748b"
            style={{ fontSize: '11px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CountChart;
