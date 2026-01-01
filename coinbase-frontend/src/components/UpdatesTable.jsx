import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const UpdatesTable = ({ data, title }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  const formatPrice = (price) => {
    return `$${price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-5 border border-slate-700">
      <h3 className="text-sm font-medium text-slate-300 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-4 text-slate-400 font-medium">Time</th>
              <th className="text-right py-3 px-4 text-slate-400 font-medium">Price</th>
              <th className="text-right py-3 px-4 text-slate-400 font-medium">Count</th>
              <th className="text-center py-3 px-4 text-slate-400 font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, index) => {
                const prevPrice = index < data.length - 1 ? data[index + 1].avgPrice : item.avgPrice;
                const trend = item.avgPrice - prevPrice;
                
                return (
                  <tr key={item.id || index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-slate-300">
                      {formatTime(item.timestamp)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-white">
                      {formatPrice(item.avgPrice)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {item.count?.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {trend > 0 ? (
                        <TrendingUp className="inline-block w-4 h-4 text-green-400" />
                      ) : trend < 0 ? (
                        <TrendingDown className="inline-block w-4 h-4 text-red-400" />
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="4" className="py-8 text-center text-slate-500">
                  No data available
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
