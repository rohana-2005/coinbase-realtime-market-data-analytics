import React, { useState, useEffect } from 'react';
import { Bell, Maximize2, Activity } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import PriceChart from '../components/PriceChart';
import CountChart from '../components/CountChart';
import UpdatesTable from '../components/UpdatesTable';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [recentData, setRecentData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [signal, setSignal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch all data
  const fetchData = async () => {
    try {
      const [summaryRes, recentRes, hourlyRes, signalRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getRecent('BTC-USD', 30),  // Last 30 records (10s intervals)
        analyticsAPI.getHourly('BTC-USD', 1),    // Last 1 hour aggregated by 5-min intervals
        analyticsAPI.getTradingSignal()
      ]);

      setSummary(summaryRes.data);
      
      // Recent data for real-time 10s updates
      const recentDataArray = Array.isArray(recentRes.data) ? recentRes.data : [];
      setRecentData(recentDataArray.reverse());
      
      // Hourly data from backend (already aggregated)
      const hourlyDataArray = Array.isArray(hourlyRes.data) ? hourlyRes.data : [];
      setHourlyData(hourlyDataArray);
      
      setSignal(signalRes.data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and set up polling
  useEffect(() => {
    fetchData();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    return price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      // Handle both ISO string and epoch milliseconds
      const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-green-500 animate-pulse mx-auto mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-800/50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-xl font-bold">🪙 Crypto Market Dashboard</div>
              {!error && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">
                Last update: {formatTime(lastUpdate)}
              </span>
              <Bell className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition-colors" />
              <Maximize2 className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-[1800px] mx-auto px-6 mt-6">
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Trading Signal Card - Refined Design */}
          {signal && (
            <div className={`rounded-xl border backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
              signal.signal === 'BUY' 
                ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 hover:border-green-500/50' 
                : signal.signal === 'SELL' 
                ? 'bg-gradient-to-r from-red-500/10 to-rose-500/10 border-red-500/30 hover:border-red-500/50' 
                : 'bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30 hover:border-yellow-500/50'
            }`}>
              <div className="flex items-center justify-between p-5">
                {/* Left: Signal Indicator */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    signal.signal === 'BUY' 
                      ? 'bg-green-500/20 border border-green-500/50' 
                      : signal.signal === 'SELL' 
                      ? 'bg-red-500/20 border border-red-500/50' 
                      : 'bg-yellow-500/20 border border-yellow-500/50'
                  }`}>
                    <span className="text-2xl">
                      {signal.signal === 'BUY' ? '📈' : signal.signal === 'SELL' ? '📉' : '⏸️'}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`text-xl font-bold ${
                        signal.signal === 'BUY' ? 'text-green-400' : 
                        signal.signal === 'SELL' ? 'text-red-400' : 
                        'text-yellow-400'
                      }`}>
                        {signal.signal}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        signal.confidence === 'High' 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : signal.confidence === 'Medium'
                          ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}>
                        {signal.confidence} Confidence
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm max-w-xl leading-relaxed">
                      {signal.reason}
                    </p>
                    <div className="flex gap-5 mt-2 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="text-slate-500">MA(5min):</span>
                        <span className="text-slate-300 font-medium">${signal.ma5min?.toFixed(2)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-500">MA(15min):</span>
                        <span className="text-slate-300 font-medium">${signal.ma15min?.toFixed(2)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Quick Action Hint */}
                <div className="hidden lg:block text-right">
                  <p className="text-xs text-slate-400 mb-1">Market Suggestion</p>
                  <p className={`text-sm font-medium ${
                    signal.signal === 'BUY' ? 'text-green-400' : 
                    signal.signal === 'SELL' ? 'text-red-400' : 
                    'text-yellow-400'
                  }`}>
                    {signal.signal === 'BUY' 
                      ? 'Consider buying position' 
                      : signal.signal === 'SELL' 
                      ? 'Consider selling position' 
                      : 'Monitor for changes'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard 
              title="Avg. Price" 
              value={formatPrice(summary?.avgPrice)}
              subtitle="BTC-USD"
            />
            <StatCard 
              title="Updates (10s)" 
              value={summary?.totalUpdates?.toLocaleString() || '0'}
              subtitle="Live updates"
            />
            <StatCard 
              title="Last Update" 
              value={summary?.timestamp ? formatTime(summary.timestamp) : 'N/A'}
              subtitle="Real-time"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PriceChart 
              data={recentData} 
              title="BTC-USD Price - Real-Time (10s intervals)"
            />
            <CountChart 
              data={hourlyData} 
              title="BTC-USD Price Updates - Last Hour (5-min intervals)"
            />
          </div>

          {/* Updates Table */}
          <UpdatesTable 
            data={recentData.slice().reverse().slice(0, 10)} 
            title="Latest Updates (10s)"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
