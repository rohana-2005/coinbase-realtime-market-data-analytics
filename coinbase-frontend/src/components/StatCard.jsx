import React from 'react';
import InfoTooltip from './InfoTooltip';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, helper, tooltip, trend, coin, delay = '' }) => {
  const color = coin?.color || '#64748b';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 group cursor-default transition-all duration-300 hover:border-slate-600/60 hover:bg-slate-800/50 hover:shadow-xl animate-fade-in ${delay}`}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 30%, ${color}0d, transparent 65%)` }}
      />

      {/* Accent line on left */}
      <div
        className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full opacity-40 group-hover:opacity-80 transition-opacity duration-300"
        style={{ background: color }}
      />

      <div className="relative pl-3">
        {/* Title row */}
        <div className="flex items-center mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</span>
          {tooltip && <InfoTooltip text={tooltip} />}
        </div>

        {/* Value */}
        <div className="text-2xl font-bold text-white tabular-nums leading-none mb-2">
          {value ?? '—'}
        </div>

        {/* Helper text */}
        {helper && (
          <div className="text-xs text-slate-500 leading-snug">{helper}</div>
        )}

        {/* Trend indicator */}
        {trend != null && (
          <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
            trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-600'
          }`}>
            {trend > 0
              ? <TrendingUp className="w-3 h-3" />
              : trend < 0
              ? <TrendingDown className="w-3 h-3" />
              : <Minus className="w-3 h-3" />}
            {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(2)}%` : 'No change'}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
