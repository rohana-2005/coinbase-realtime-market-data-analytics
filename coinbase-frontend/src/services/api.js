import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:8080/api'
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export const analyticsAPI = {
  getLatest: (symbol = 'BTC-USD') =>
    api.get('/analytics/latest', { params: { symbol } }),

  getRecent: (symbol = 'BTC-USD', limit = 30) =>
    api.get('/analytics/recent', { params: { symbol, limit } }),

  getHourly: (symbol = 'BTC-USD', hours = 24) =>
    api.get('/analytics/hourly', { params: { symbol, hours } }),

  getSummary: (symbol = 'BTC-USD') =>
    api.get('/analytics/summary', { params: { symbol } }),

  getTradingSignal: (symbol = 'BTC-USD') =>
    api.get('/analytics/signal', { params: { symbol } }),

  getHealth: () =>
    api.get('/analytics/health'),

  // Historical: auto-bucketed chart data for any start→end epoch range
  getHistorical: (symbol, start, end) =>
    api.get('/analytics/historical', { params: { symbol, start, end } }),

  // Range summary: Open, High, Low, Close, volume, volatility for any range
  getRangeSummary: (symbol, start, end) =>
    api.get('/analytics/range-summary', { params: { symbol, start, end } }),
};

