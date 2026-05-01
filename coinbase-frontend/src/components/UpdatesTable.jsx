import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const UpdatesTable = ({ data, title, coin }) => {
  const color = coin?.color || '#34d399';
  const coinId = coin?.id || 'BTC-USD';
  const decimals = coinId === 'DOGE-USD' ? 4 : 2;

  const formatTime = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch { return '—'; }
  };

  const formatPrice = (price) =>
    price != null
      ? `$${price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
      : '—';

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden hover:border-slate-600/60 transition-all duration-300">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
        <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full bg-slate-700/60 text-slate-400">
          Live Feed
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/40">
              <th className="text-left py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Time</th>
              <th className="text-right py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Avg Price</th>
              <th className="text-right py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Updates</th>
              <th className="text-center py-3 px-5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, index) => {
                const prevPrice = index < data.length - 1 ? data[index + 1]?.avgPrice : item.avgPrice;
                const diff = item.avgPrice - prevPrice;
                const isUp   = diff > 0;
                const isDown = diff < 0;

                return (
                  <tr
                    key={item.id || index}
                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors group"
                  >
                    <td className="py-3 px-5 text-slate-400 tabular-nums text-xs">{formatTime(item.timestamp)}</td>
                    <td className="py-3 px-5 text-right font-mono font-semibold text-white tabular-nums">
                      {formatPrice(item.avgPrice)}
                    </td>
                    <td className="py-3 px-5 text-right text-slate-400 tabular-nums">
                      {item.count?.toLocaleString() || '—'}
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center justify-center gap-1">
                        {isUp ? (
                          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">+{diff.toFixed(decimals)}</span>
                          </span>
                        ) : isDown ? (
                          <span className="flex items-center gap-1 text-rose-400 text-xs font-medium">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{diff.toFixed(decimals)}</span>
                          </span>
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-12 text-center text-slate-500 text-sm">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl opacity-40">📭</span>
                    <span>Waiting for live data…</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UpdatesTable;
