import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Maximize2, Activity, TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import PriceChart from '../components/PriceChart';
import CountChart from '../components/CountChart';
import UpdatesTable from '../components/UpdatesTable';

// ─── Coin Config ────────────────────────────────────────────────────────────
const COINS = [
  {
    id: 'BTC-USD',
    label: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    color: '#f59e0b',
    gradient: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/40',
    glow: 'shadow-amber-500/20',
    activeGradient: 'from-amber-500 to-orange-500',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  },
  {
    id: 'ETH-USD',
    label: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    color: '#8b5cf6',
    gradient: 'from-violet-500/20 to-purple-500/10',
    border: 'border-violet-500/40',
    glow: 'shadow-violet-500/20',
    activeGradient: 'from-violet-500 to-purple-500',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  },
  {
    id: 'SOL-USD',
    label: 'SOL',
    name: 'Solana',
    icon: '◎',
    color: '#10b981',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/40',
    glow: 'shadow-emerald-500/20',
    activeGradient: 'from-emerald-500 to-teal-500',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  },
  {
    id: 'DOGE-USD',
    label: 'DOGE',
    name: 'Dogecoin',
    icon: 'Ð',
    color: '#eab308',
    gradient: 'from-yellow-500/20 to-lime-500/10',
    border: 'border-yellow-500/40',
    glow: 'shadow-yellow-500/20',
    activeGradient: 'from-yellow-500 to-lime-500',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatPrice = (price, coinId) => {
  if (!price && price !== 0) return '—';
  // DOGE has low price, show more decimals
  const decimals = coinId === 'DOGE-USD' ? 4 : 2;
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

const formatTime = (timestamp) => {
  if (!timestamp) return '—';
  try {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '—';
  }
};

// ─── Signal Badge ────────────────────────────────────────────────────────────
const SignalCard = ({ signal, coin }) => {
  if (!signal) return null;
  const isHold = signal.signal === 'HOLD';
  const isBuy  = signal.signal === 'BUY';

  const cfg = isBuy
    ? { bg: 'from-emerald-500/10 to-green-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '📈', action: 'Consider a long position' }
    : isHold
    ? { bg: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-500/30', text: 'text-amber-400', icon: '⏸️', action: 'Monitor for trend confirmation' }
    : { bg: 'from-rose-500/10 to-red-500/5', border: 'border-rose-500/30', text: 'text-rose-400', icon: '📉', action: 'Consider reducing exposure' };

  return (
    <div className={`rounded-2xl border bg-gradient-to-r ${cfg.bg} ${cfg.border} backdrop-blur-sm transition-all duration-500 hover:shadow-lg`}>
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-800/60 border ${cfg.border}`}>
            <span className="text-2xl">{cfg.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-xl font-bold tracking-tight ${cfg.text}`}>{signal.signal}</span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                signal.confidence === 'High' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : signal.confidence === 'Medium' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
              }`}>{signal.confidence} Confidence</span>
            </div>
            <p className="text-slate-300 text-sm">{signal.reason}</p>
            <div className="flex gap-5 mt-2 text-xs text-slate-400">
              <span>MA(5m): <span className="text-slate-200 font-medium">{formatPrice(signal.ma5min, coin.id)}</span></span>
              <span>MA(15m): <span className="text-slate-200 font-medium">{formatPrice(signal.ma15min, coin.id)}</span></span>
              <span>Now: <span className="font-medium" style={{ color: coin.color }}>{formatPrice(signal.currentPrice, coin.id)}</span></span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1">
          <p className="text-xs text-slate-500">Market Suggestion</p>
          <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.action}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Stat Card Enhanced ───────────────────────────────────────────────────────
const EnhancedStatCard = ({ title, value, subtitle, trend, coin, icon }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-5 group hover:border-opacity-80 transition-all duration-300 hover:shadow-xl`}
    style={{ '--coin-color': coin.color }}>
    {/* Subtle glow on hover */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
      style={{ background: `radial-gradient(circle at top left, ${coin.color}10, transparent 70%)` }} />

    <div className="relative">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-widest text-slate-500">{title}</span>
        <span className="text-lg opacity-60">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
      {trend !== undefined && trend !== null && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(2)}%` : 'Flat'}
        </div>
      )}
    </div>
  </div>
);

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const [selectedCoinId, setSelectedCoinId] = useState('BTC-USD');
  const [summary, setSummary]       = useState(null);
  const [recentData, setRecentData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [signal, setSignal]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const coin = COINS.find(c => c.id === selectedCoinId) || COINS[0];

  const fetchData = useCallback(async (sym = selectedCoinId, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [summaryRes, recentRes, hourlyRes, signalRes] = await Promise.all([
        analyticsAPI.getSummary(sym),
        analyticsAPI.getRecent(sym, 30),
        analyticsAPI.getHourly(sym, 1),
        analyticsAPI.getTradingSignal(sym),
      ]);

      setSummary(summaryRes.data);
      const recentArr = Array.isArray(recentRes.data) ? recentRes.data : [];
      setRecentData(recentArr.reverse());
      const hourlyArr = Array.isArray(hourlyRes.data) ? hourlyRes.data : [];
      setHourlyData(hourlyArr);
      setSignal(signalRes.data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Make sure the backend is running on :8080.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCoinId]);

  // Re-fetch immediately when coin changes
  useEffect(() => {
    setLoading(true);
    setSummary(null);
    setRecentData([]);
    setHourlyData([]);
    setSignal(null);
    fetchData(selectedCoinId);
  }, [selectedCoinId]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(selectedCoinId), 5000);
    return () => clearInterval(interval);
  }, [selectedCoinId, fetchData]);

  // Compute price trend % from last two records
  const priceTrend = recentData.length >= 2
    ? ((recentData[recentData.length - 1].avgPrice - recentData[0].avgPrice) / recentData[0].avgPrice) * 100
    : null;

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${coin.color}30, ${coin.color}10)`, border: `1px solid ${coin.color}40` }}>
            <span className="text-2xl">{coin.icon}</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Activity className="w-4 h-4 animate-pulse" style={{ color: coin.color }} />
            <p className="text-slate-400 text-sm">Loading live market data…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100" style={{ background: 'linear-gradient(135deg, #0a0f1a 0%, #0d1424 50%, #0a0f1a 100%)' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 backdrop-blur-xl bg-slate-900/70">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center text-lg">
              📊
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">Crypto Analytics</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Real-Time Dashboard</div>
            </div>
          </div>

          {/* ── Coin Selector Tabs ── */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm">
            {COINS.map((c) => {
              const isActive = c.id === selectedCoinId;
              return (
                <button
                  key={c.id}
                  id={`coin-tab-${c.label.toLowerCase()}`}
                  onClick={() => setSelectedCoinId(c.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                  }`}
                  style={isActive ? {
                    background: `linear-gradient(135deg, ${c.color}25, ${c.color}10)`,
                    border: `1px solid ${c.color}50`,
                    boxShadow: `0 0 20px ${c.color}15`,
                  } : {}}
                >
                  <span className="text-base leading-none">{c.icon}</span>
                  <span>{c.label}</span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md"
                      style={{ background: `${c.color}20`, color: c.color }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: c.color }} />
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="manual-refresh-btn"
              onClick={() => fetchData(selectedCoinId, true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700/50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {formatTime(lastUpdate)}
            </button>
            {!error && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: coin.color }} />
                Streaming
              </div>
            )}
            <div className="w-px h-5 bg-slate-700" />
            <Bell className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
            <Maximize2 className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
          </div>
        </div>
      </header>

      {/* ── Error Banner ── */}
      {error && (
        <div className="max-w-[1800px] mx-auto px-6 mt-4">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-6">

        {/* Coin Identity Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold border"
              style={{
                background: `linear-gradient(135deg, ${coin.color}25, ${coin.color}08)`,
                borderColor: `${coin.color}50`,
                color: coin.color,
              }}>
              {coin.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{coin.name}</h1>
              <p className="text-sm text-slate-400">{coin.id} · 10-second aggregation windows</p>
            </div>
          </div>
          {summary?.avgPrice && (
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold tabular-nums" style={{ color: coin.color }}>
                {formatPrice(summary.avgPrice, coin.id)}
              </div>
              <div className="text-xs text-slate-500">Avg Price (10s window)</div>
            </div>
          )}
        </div>

        {/* ── Trading Signal ── */}
        <SignalCard signal={signal} coin={coin} />

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EnhancedStatCard
            title="Avg. Price"
            value={formatPrice(summary?.avgPrice, coin.id)}
            subtitle={`${coin.name} · Recent 10-sec window`}
            trend={priceTrend}
            coin={coin}
            icon={coin.icon}
          />
          <EnhancedStatCard
            title="Updates (10s)"
            value={summary?.totalUpdates?.toLocaleString() || '0'}
            subtitle="Trades aggregated in window"
            coin={coin}
            icon="⚡"
          />
          <EnhancedStatCard
            title="Last Update"
            value={summary?.timestamp ? formatTime(summary.timestamp) : '—'}
            subtitle="Real-time from Coinbase WS"
            coin={coin}
            icon="🕐"
          />
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceChart
            data={recentData}
            title={`${coin.name} Price · Real-Time (10s intervals)`}
            color={coin.color}
            coinId={coin.id}
          />
          <CountChart
            data={hourlyData}
            title={`${coin.name} Update Frequency · Last Hour (5-min intervals)`}
            color={coin.color}
          />
        </div>

        {/* ── Updates Table ── */}
        <UpdatesTable
          data={recentData.slice().reverse().slice(0, 10)}
          title={`Latest ${coin.name} Updates`}
          coin={coin}
        />
      </main>
    </div>
  );
};

export default Dashboard;
