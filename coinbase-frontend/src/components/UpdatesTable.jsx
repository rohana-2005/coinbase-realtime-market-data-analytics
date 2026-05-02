import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const UpdatesTable = ({ data, title, coin }) => {
  const color  = coin?.color || '#34d399';
  const coinId = coin?.id || 'BTC-USD';
  const dec    = coinId === 'DOGE-USD' ? 4 : 2;

  const fmtTime = (ts) => {
    if (!ts) return '—';
    try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
    catch { return '—'; }
  };

  const fmtPrice = (p) =>
    p != null
      ? `$${p.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}`
      : '—';

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm overflow-hidden hover:border-slate-600/50 transition-all duration-300 animate-fade-in stagger-4">
      {/* Table header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
        <div>
          <div className="flex items-center">
            <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
            <InfoTooltip text="The most recent 10-second price snapshots from the live stream. Change shows if the price went up or down compared to the previous window." />
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Most recent price snapshots · updates every 10 seconds</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          Live
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/30">
              <th className="text-left py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Time
              </th>
              <th className="text-right py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Avg Price
              </th>
              <th className="text-right py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Updates
                <InfoTooltip text="Number of individual price ticks received in this 10-second window" />
              </th>
              <th className="text-center py-3 px-6 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, idx) => {
                const prev  = data[idx + 1]?.avgPrice ?? item.avgPrice;
                const diff  = item.avgPrice - prev;
                const isUp  = diff > 0.001;
                const isDn  = diff < -0.001;

                return (
                  <tr key={item.id || idx}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors duration-150 group">
                    <td className="py-3 px-6 text-slate-400 tabular-nums text-xs font-medium">
                      {fmtTime(item.timestamp)}
                    </td>
                    <td className="py-3 px-6 text-right font-mono font-semibold text-white tabular-nums">
                      {fmtPrice(item.avgPrice)}
                    </td>
                    <td className="py-3 px-6 text-right tabular-nums text-slate-400">
                      {item.count?.toLocaleString() ?? '—'}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-center">
                        {isUp ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                            <ArrowUp className="w-3 h-3" />
                            <span className="tabular-nums">+{Math.abs(diff).toFixed(dec)}</span>
                          </span>
                        ) : isDn ? (
                          <span className="inline-flex items-center gap-1 text-rose-400 text-xs font-semibold">
                            <ArrowDown className="w-3 h-3" />
                            <span className="tabular-nums">{diff.toFixed(dec)}</span>
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
                <td colSpan={4} className="py-14 text-center">
                  <div className="space-y-1.5">
                    <div className="w-8 h-8 rounded-full bg-slate-700/50 mx-auto flex items-center justify-center">
                      <span className="text-slate-600 text-lg font-bold">-</span>
                    </div>
                    <p className="text-slate-500 text-sm">No data yet</p>
                    <p className="text-slate-600 text-xs">Waiting for live price updates</p>
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
