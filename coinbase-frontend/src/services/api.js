import axios from 'axios';

// Use backend URL for local development, relative path for production (nginx proxy)
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:8080/api' 
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analytics API calls
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
};
