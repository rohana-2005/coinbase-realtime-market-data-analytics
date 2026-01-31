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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch all data
  const fetchData = async () => {
    try {
      const [summaryRes, recentRes] = await Promise.all([
        analyticsAPI.getSummary(),
        analyticsAPI.getRecent('BTC-USD', 30)
      ]);

      setSummary(summaryRes.data);
      // Ensure recentRes.data is an array before calling reverse
      const recentDataArray = Array.isArray(recentRes.data) ? recentRes.data : [];
      setRecentData(recentDataArray.reverse()); // Reverse to show oldest first for charts
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
              title="BTC-USD Average Price (10s)"
            />
            <CountChart 
              data={recentData} 
              title="BTC Price Updates (10s)"
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
