import React from 'react';

const StatCard = ({ title, value, subtitle, trend }) => {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
      <div className="text-sm text-slate-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-1">
        {value}
      </div>
      {subtitle && (
        <div className="text-xs text-slate-500">{subtitle}</div>
      )}
      {trend && (
        <div className={`text-xs mt-1 ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default StatCard;
