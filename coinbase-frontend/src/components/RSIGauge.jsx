import React from 'react';
import InfoTooltip from './InfoTooltip';

const RSIGauge = ({ rsi, coin }) => {
  const color = coin?.color || '#34d399';
  const value = rsi != null ? Math.max(0, Math.min(100, rsi)) : null;

  const cx = 100, cy = 96, r = 68;
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Needle: 0 RSI = -180deg (left), 100 RSI = 0deg (right)
  const needleAngle = value != null ? -180 + (value / 100) * 180 : -90;
  const nRad = toRad(needleAngle);
  const nx = cx + r * 0.68 * Math.cos(nRad);
  const ny = cy + r * 0.68 * Math.sin(nRad);

  const arcPath = (s, e) => {
    const sr = toRad(s), er = toRad(e);
    const x1 = cx + r * Math.cos(sr), y1 = cy + r * Math.sin(sr);
    const x2 = cx + r * Math.cos(er), y2 = cy + r * Math.sin(er);
    const large = Math.abs(e - s) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Zone config
  const zone = value == null ? null
    : value < 30  ? { label: 'Oversold',   sub: 'Price may be below fair value — could be a buying opportunity', color: '#34d399' }
    : value > 70  ? { label: 'Overbought', sub: 'Price may be above fair value — selling pressure may increase',  color: '#f87171' }
    :               { label: 'Neutral',     sub: 'Normal trading range — no strong signal in either direction',    color: '#fbbf24' };

  const warmingUp = value == null;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 flex flex-col hover:border-slate-600/50 transition-all duration-300 animate-fade-in stagger-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">RSI · 14-period</span>
          <InfoTooltip text="RSI (Relative Strength Index) is a 0–100 momentum meter. Below 30 = possibly underpriced. Above 70 = possibly overpriced. Near 50 = neutral." />
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 uppercase tracking-wider">
          Momentum
        </span>
      </div>

      {/* SVG gauge */}
      <svg viewBox="0 0 200 102" className="w-full max-w-[230px] mx-auto">
        {/* Background track arcs */}
        <path d={arcPath(-180, -126)} stroke="#34d399" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d={arcPath(-126, -54)}  stroke="#fbbf24" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.15" />
        <path d={arcPath(-54,  0)}    stroke="#f87171" strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.15" />

        {/* Filled arc to current RSI */}
        {value != null && value > 0 && (
          <path
            d={arcPath(-180, -180 + (value / 100) * 180)}
            stroke={zone?.color ?? color}
            strokeWidth="9" fill="none" strokeLinecap="round" opacity="0.85"
          />
        )}

        {/* Zone boundary ticks at 30 and 70 */}
        {[30, 70].map(tick => {
          const a = toRad(-180 + (tick / 100) * 180);
          const x1 = cx + (r - 13) * Math.cos(a), y1 = cy + (r - 13) * Math.sin(a);
          const x2 = cx + (r + 1)  * Math.cos(a), y2 = cy + (r + 1)  * Math.sin(a);
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#334155" strokeWidth="1.5" strokeLinecap="round" />;
        })}

        {/* Needle */}
        {value != null && (
          <>
            <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
            <circle cx={cx} cy={cy} r="3.5" fill="white" opacity="0.85" />
          </>
        )}

        {/* RSI value */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill={warmingUp ? '#475569' : (zone?.color ?? 'white')}
          fontSize="24" fontWeight="700" fontFamily="Inter, monospace">
          {value != null ? value.toFixed(1) : '—'}
        </text>

        {/* Axis labels */}
        <text x="13"  y={cy + 16} fill="#475569" fontSize="8.5" textAnchor="middle">0</text>
        <text x="54"  y={cy - 62} fill="#34d399" fontSize="8" textAnchor="middle">30</text>
        <text x="146" y={cy - 62} fill="#f87171" fontSize="8" textAnchor="middle">70</text>
        <text x="187" y={cy + 16} fill="#475569" fontSize="8.5" textAnchor="middle">100</text>
      </svg>

      {/* Zone label */}
      <div className="text-center mt-1">
        {warmingUp ? (
          <div>
            <p className="text-xs font-semibold text-slate-500">Warming up</p>
            <p className="text-[11px] text-slate-600 mt-0.5">Collecting data — ready in ~2 minutes</p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-bold tracking-wide" style={{ color: zone?.color }}>{zone?.label}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug max-w-[220px] mx-auto">{zone?.sub}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RSIGauge;
