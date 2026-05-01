import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PriceChart = ({ data, title }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatPrice = (value) => {
    return `$${value?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
          <p className="text-slate-400 text-xs mb-1">
            {formatTime(payload[0].payload.timestamp)}
          </p>
          <p className="text-emerald-400 font-semibold text-base">
            {formatPrice(payload[0].value)}
          </p>
          {payload[0].payload.count && (
            <p className="text-slate-300 text-xs mt-1">
              Updates: {payload[0].payload.count}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Filter data to only include valid entries with price values
  const chartData = data.filter(item => item && item.avgPrice != null && item.avgPrice > 0);

  return (
    <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={formatTime}
            stroke="#64748b"
            style={{ fontSize: '10px' }}
            interval="preserveStartEnd"
            minTickGap={10}
          />
          <YAxis 
            tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
            stroke="#64748b"
            style={{ fontSize: '11px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="avgPrice" 
            stroke="#34d399" 
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceChart;
