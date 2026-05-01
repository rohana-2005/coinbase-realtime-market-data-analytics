import React from 'react';

// Semi-circle RSI gauge using pure SVG.
// 0-30 = oversold (green, potential BUY zone)
// 30-70 = neutral (amber)
// 70-100 = overbought (red, potential SELL zone)
const RSIGauge = ({ rsi, coin }) => {
  const color = coin?.color || '#34d399';
  const value = rsi != null ? Math.max(0, Math.min(100, rsi)) : null;
  const isWarmingUp = value == null || value === 50;

  // SVG arc math — the gauge sweeps 180° (left → right)
  const cx = 100, cy = 95, r = 70;
  const toRad = (deg) => (deg * Math.PI) / 180;

  // Needle angle: 0 RSI = -180° (left), 100 RSI = 0° (right), via -180 + (value/100)*180
  const needleAngle = value != null ? -180 + (value / 100) * 180 : -90;
  const needleRad = toRad(needleAngle);
  const needleX = cx + r * 0.72 * Math.cos(needleRad);
  const needleY = cy + r * 0.72 * Math.sin(needleRad);

  const arcPath = (startDeg, endDeg) => {
    const s = toRad(startDeg);
    const e = toRad(endDeg);
    const x1 = cx + r * Math.cos(s), y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e), y2 = cy + r * Math.sin(e);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  // Gauge label
  const label = value == null ? 'Warming up…'
    : value < 30  ? 'OVERSOLD'
    : value > 70  ? 'OVERBOUGHT'
    : 'NEUTRAL';
  const labelColor = value == null ? '#64748b'
    : value < 30  ? '#34d399'
    : value > 70  ? '#f87171'
    : '#fbbf24';

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 flex flex-col items-center justify-between hover:border-slate-600/60 transition-all duration-300">
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">RSI (14)</span>
        <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full bg-slate-700/60 text-slate-400">
          Momentum
        </span>
      </div>

      <svg viewBox="0 0 200 100" className="w-full max-w-[220px]">
        {/* Track arcs: green (oversold 0-30), amber (30-70), red (overbought 70-100) */}
        <path d={arcPath(-180, -126)} stroke="#34d399" strokeWidth="10"
          fill="none" strokeLinecap="round" opacity="0.25"/>
        <path d={arcPath(-126, -54)}  stroke="#fbbf24" strokeWidth="10"
          fill="none" strokeLinecap="round" opacity="0.25"/>
        <path d={arcPath(-54, 0)}     stroke="#f87171" strokeWidth="10"
          fill="none" strokeLinecap="round" opacity="0.25"/>

        {/* Active arc from start to current value */}
        {value != null && value > 0 && (
          <path d={arcPath(-180, -180 + (value / 100) * 180)}
            stroke={value < 30 ? '#34d399' : value > 70 ? '#f87171' : '#fbbf24'}
            strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.9"/>
        )}

        {/* Tick marks at 0, 30, 70, 100 */}
        {[0, 30, 70, 100].map(tick => {
          const angle = toRad(-180 + (tick / 100) * 180);
          const x1 = cx + (r - 14) * Math.cos(angle);
          const y1 = cy + (r - 14) * Math.sin(angle);
          const x2 = cx + (r + 2)  * Math.cos(angle);
          const y2 = cy + (r + 2)  * Math.sin(angle);
          return <line key={tick} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>;
        })}

        {/* Needle */}
        {value != null && (
          <line x1={cx} y1={cy} x2={needleX} y2={needleY}
            stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
        )}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="4" fill="white" opacity="0.8"/>

        {/* RSI value text */}
        <text x={cx} y={cy - 14} textAnchor="middle"
          fill={isWarmingUp ? '#64748b' : labelColor}
          fontSize="22" fontWeight="700" fontFamily="monospace">
          {value != null ? value.toFixed(1) : '—'}
        </text>

        {/* Axis labels */}
        <text x="14"  y={cy + 18} fill="#64748b" fontSize="8" textAnchor="middle">0</text>
        <text x="186" y={cy + 18} fill="#64748b" fontSize="8" textAnchor="middle">100</text>
        <text x="56"  y={cy - 58} fill="#34d399" fontSize="7" textAnchor="middle">30</text>
        <text x="144" y={cy - 58} fill="#f87171" fontSize="7" textAnchor="middle">70</text>
      </svg>

      <div className="text-center mt-1">
        <div className="text-xs font-bold tracking-widest" style={{ color: labelColor }}>
          {label}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          {value != null && value < 30  ? 'Possible buy zone'
         : value != null && value > 70  ? 'Possible sell zone'
         : value != null               ? 'Normal trading range'
         : 'Needs ~2 min of data'}
        </div>
      </div>
    </div>
  );
};

export default RSIGauge;
