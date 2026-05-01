import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Maximize2, Activity, TrendingUp, TrendingDown, Minus, RefreshCw, X } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import StatCard from '../components/StatCard';
import PriceChart from '../components/PriceChart';
import CountChart from '../components/CountChart';
import UpdatesTable from '../components/UpdatesTable';
import RSIGauge from '../components/RSIGauge';

// ─── Coin Config ─────────────────────────────────────────────────────────────
const COINS = [
  { id: 'BTC-USD',  label: 'BTC',  name: 'Bitcoin',   icon: '₿', color: '#f59e0b' },
  { id: 'ETH-USD',  label: 'ETH',  name: 'Ethereum',  icon: 'Ξ', color: '#8b5cf6' },
  { id: 'SOL-USD',  label: 'SOL',  name: 'Solana',    icon: '◎', color: '#10b981' },
  { id: 'DOGE-USD', label: 'DOGE', name: 'Dogecoin',  icon: 'Ð', color: '#eab308' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (price, coinId) => {
  if (price == null) return '—';
  const d = coinId === 'DOGE-USD' ? 4 : 2;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;
};
const formatTime = (ts) => {
  if (!ts) return '—';
  try { return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return '—'; }
};

// ─── Whale Alert Banner ───────────────────────────────────────────────────────
const WhaleAlertBanner = ({ alerts, onDismiss }) => {
  if (!alerts.length) return null;
  return (
    <div className="space-y-2">
      {alerts.map((a, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3 rounded-2xl border border-blue-500/40 bg-gradient-to-r from-blue-500/10 to-cyan-500/5 backdrop-blur-sm animate-pulse-slow">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🐋</span>
            <div>
              <span className="text-blue-300 font-bold text-sm">WHALE ACTIVITY DETECTED</span>
              <span className="text-slate-400 text-xs ml-3">{a.coin} — {a.reason}</span>
            </div>
          </div>
          <button onClick={() => onDismiss(i)} className="text-slate-500 hover:text-slate-300 transition-colors ml-4">
            <X className="w-4 h-4"/>
          </button>
        </div>
      ))}
    </div>
  );
};

// ─── Signal Card ─────────────────────────────────────────────────────────────
const SignalCard = ({ signal, coin }) => {
  if (!signal) return null;
  const isBuy  = signal.signal === 'BUY';
  const isSell = signal.signal === 'SELL';
  const cfg = isBuy
    ? { bg: 'from-emerald-500/10 to-green-500/5', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '📈', action: 'Consider a long position' }
    : isSell
    ? { bg: 'from-rose-500/10 to-red-500/5',      border: 'border-rose-500/30',    text: 'text-rose-400',    icon: '📉', action: 'Consider reducing exposure' }
    : { bg: 'from-amber-500/10 to-yellow-500/5',  border: 'border-amber-500/30',   text: 'text-amber-400',   icon: '⏸️', action: 'Monitor for trend confirmation' };

  return (
    <div className={`rounded-2xl border bg-gradient-to-r ${cfg.bg} ${cfg.border} backdrop-blur-sm`}>
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-slate-800/60 border ${cfg.border}`}>
            <span className="text-2xl">{cfg.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className={`text-xl font-bold ${cfg.text}`}>{signal.signal}</span>
              <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${
                signal.confidence === 'High'   ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
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
        <div className="hidden lg:block text-right">
          <p className="text-xs text-slate-500">Suggestion</p>
          <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.action}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Enhanced Stat Card ───────────────────────────────────────────────────────
const EnhancedStatCard = ({ title, value, subtitle, trend, coin, icon }) => (
  <div className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-800/40 backdrop-blur-sm p-5 group hover:border-slate-600/60 transition-all duration-300 hover:shadow-xl">
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
      {trend != null && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
          {trend > 0 ? <TrendingUp className="w-3 h-3"/> : trend < 0 ? <TrendingDown className="w-3 h-3"/> : <Minus className="w-3 h-3"/>}
          {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(2)}%` : 'Flat'}
        </div>
      )}
    </div>
  </div>
);

// ─── EMA Indicator Badge ──────────────────────────────────────────────────────
const EMABadge = ({ latestRecord, coin }) => {
  if (!latestRecord?.ema || !latestRecord?.avgPrice) return null;
  const price = latestRecord.avgPrice;
  const ema   = latestRecord.ema;
  const diff  = price - ema;
  const pct   = ((diff / ema) * 100).toFixed(2);
  const above = diff > 0;
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">EMA-14</span>
        <span className="text-[10px] uppercase tracking-widest font-medium px-2 py-1 rounded-full bg-slate-700/60 text-slate-400">Trend</span>
      </div>
      <div className="text-3xl font-bold text-white tabular-nums mb-1">
        {formatPrice(ema, coin.id)}
      </div>
      <div className={`flex items-center gap-2 text-sm font-semibold ${above ? 'text-emerald-400' : 'text-rose-400'}`}>
        {above ? <TrendingUp className="w-4 h-4"/> : <TrendingDown className="w-4 h-4"/>}
        Price is <span>{Math.abs(Number(pct))}% {above ? 'above' : 'below'} EMA</span>
      </div>
      <div className="text-xs text-slate-500 mt-1">
        {above ? 'Bullish — upward momentum' : 'Bearish — downward pressure'}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const [selectedCoinId, setSelectedCoinId] = useState('BTC-USD');
  const [summary,      setSummary]      = useState(null);
  const [recentData,   setRecentData]   = useState([]);
  const [hourlyData,   setHourlyData]   = useState([]);
  const [signal,       setSignal]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [lastUpdate,   setLastUpdate]   = useState(new Date());
  const [refreshing,   setRefreshing]   = useState(false);
  const [whaleAlerts,  setWhaleAlerts]  = useState([]);
  const [dismissedIdx, setDismissedIdx] = useState(new Set());

  const coin = COINS.find(c => c.id === selectedCoinId) || COINS[0];

  const fetchData = useCallback(async (sym = selectedCoinId, showSpin = false) => {
    if (showSpin) setRefreshing(true);
    try {
      const [sumRes, recRes, hrRes, sigRes] = await Promise.all([
        analyticsAPI.getSummary(sym),
        analyticsAPI.getRecent(sym, 30),
        analyticsAPI.getHourly(sym, 1),
        analyticsAPI.getTradingSignal(sym),
      ]);
      setSummary(sumRes.data);
      const arr = Array.isArray(recRes.data) ? recRes.data : [];
      const sorted = arr.reverse();
      setRecentData(sorted);
      setHourlyData(Array.isArray(hrRes.data) ? hrRes.data : []);
      setSignal(sigRes.data);
      setError(null);
      setLastUpdate(new Date());

      // Detect whale alerts from most recent records
      const latest = sorted[sorted.length - 1];
      if (latest?.whaleAlert) {
        setWhaleAlerts(prev => {
          const already = prev.some(a => a.coin === sym && a.reason === latest.whaleReason);
          if (already) return prev;
          return [...prev.slice(-2), { coin: sym, reason: latest.whaleReason, ts: Date.now() }];
        });
      }
    } catch (err) {
      setError('Failed to fetch data. Make sure the backend is running on :8080.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCoinId]);

  useEffect(() => {
    setLoading(true); setSummary(null); setRecentData([]); setHourlyData([]); setSignal(null);
    fetchData(selectedCoinId);
  }, [selectedCoinId]);

  useEffect(() => {
    const id = setInterval(() => fetchData(selectedCoinId), 5000);
    return () => clearInterval(id);
  }, [selectedCoinId, fetchData]);

  const latestRecord  = recentData[recentData.length - 1];
  const latestRsi     = latestRecord?.rsi;
  const priceTrend    = recentData.length >= 2
    ? ((recentData[recentData.length - 1]?.avgPrice - recentData[0]?.avgPrice) / recentData[0]?.avgPrice) * 100
    : null;
  const activeAlerts  = whaleAlerts.filter((_, i) => !dismissedIdx.has(i));

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl"
            style={{ background: `linear-gradient(135deg,${coin.color}30,${coin.color}10)`, border: `1px solid ${coin.color}40` }}>
            {coin.icon}
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Activity className="w-4 h-4 animate-pulse" style={{ color: coin.color }}/>
            <p className="text-slate-400 text-sm">Loading live market data…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-100" style={{ background: 'linear-gradient(135deg,#0a0f1a 0%,#0d1424 50%,#0a0f1a 100%)' }}>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 backdrop-blur-xl bg-slate-900/70">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/50 flex items-center justify-center text-lg">📊</div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">Crypto Analytics</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Real-Time Dashboard</div>
            </div>
          </div>

          {/* Coin tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/60 border border-slate-700/50">
            {COINS.map(c => {
              const active = c.id === selectedCoinId;
              return (
                <button key={c.id} id={`coin-tab-${c.label.toLowerCase()}`}
                  onClick={() => setSelectedCoinId(c.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${active ? 'text-white shadow-lg' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}
                  style={active ? { background: `linear-gradient(135deg,${c.color}25,${c.color}10)`, border: `1px solid ${c.color}50`, boxShadow: `0 0 20px ${c.color}15` } : {}}>
                  <span className="text-base leading-none">{c.icon}</span>
                  <span>{c.label}</span>
                  {active && (
                    <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: `${c.color}20`, color: c.color }}>
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: c.color }}/>LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button id="manual-refresh-btn" onClick={() => fetchData(selectedCoinId, true)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700/50">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`}/>
              {formatTime(lastUpdate)}
            </button>
            {!error && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: coin.color }}/>Streaming
              </div>
            )}
            <div className="w-px h-5 bg-slate-700"/>
            <Bell className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors"/>
            <Maximize2 className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors"/>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-[1800px] mx-auto px-6 mt-4">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-300 text-sm flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        </div>
      )}

      <main className="max-w-[1800px] mx-auto px-6 py-6 space-y-5">

        {/* Whale Alerts */}
        <WhaleAlertBanner
          alerts={activeAlerts}
          onDismiss={(i) => setDismissedIdx(prev => new Set([...prev, i]))}
        />

        {/* Coin identity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-bold border"
              style={{ background: `linear-gradient(135deg,${coin.color}25,${coin.color}08)`, borderColor: `${coin.color}50`, color: coin.color }}>
              {coin.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{coin.name}</h1>
              <p className="text-sm text-slate-400">{coin.id} · 10-second Flink aggregation windows</p>
            </div>
          </div>
          {summary?.avgPrice && (
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-bold tabular-nums" style={{ color: coin.color }}>
                {formatPrice(summary.avgPrice, coin.id)}
              </div>
              <div className="text-xs text-slate-500">Current Avg Price</div>
            </div>
          )}
        </div>

        {/* Signal */}
        <SignalCard signal={signal} coin={coin}/>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EnhancedStatCard title="Avg. Price" value={formatPrice(summary?.avgPrice, coin.id)}
            subtitle={`${coin.name} · Recent 10-sec window`} trend={priceTrend} coin={coin} icon={coin.icon}/>
          <EnhancedStatCard title="Updates (10s)" value={summary?.totalUpdates?.toLocaleString() || '0'}
            subtitle="Trades aggregated in window" coin={coin} icon="⚡"/>
          <EnhancedStatCard title="Last Update" value={summary?.timestamp ? formatTime(summary.timestamp) : '—'}
            subtitle="Real-time from Coinbase WS" coin={coin} icon="🕐"/>
        </div>

        {/* Indicator Row: RSI Gauge + EMA Badge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RSIGauge rsi={latestRsi} coin={coin}/>
          <EMABadge latestRecord={latestRecord} coin={coin}/>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceChart data={recentData} title={`${coin.name} Price + EMA-14 · Real-Time (10s)`} color={coin.color} coinId={coin.id}/>
          <CountChart data={hourlyData} title={`${coin.name} Update Frequency · Last Hour (5-min)`} color={coin.color}/>
        </div>

        {/* Table */}
        <UpdatesTable data={recentData.slice().reverse().slice(0, 10)} title={`Latest ${coin.name} Updates`} coin={coin}/>
      </main>
    </div>
  );
};

export default Dashboard;
