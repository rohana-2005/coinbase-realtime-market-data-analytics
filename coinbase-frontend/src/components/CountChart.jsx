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
          {payload[0].payload.price && (
            <p className="text-emerald-400 text-sm font-medium mt-1">
              Price: ${payload[0].payload.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Filter data to only include valid entries with count values
  const chartData = data.filter(item => item && item.count != null && item.count > 0);

  return (
    <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
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
            stroke="#64748b"
            style={{ fontSize: '11px' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="count" 
            fill="#34d399" 
            radius={[4, 4, 0, 0]}
            minPointSize={2}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CountChart;
