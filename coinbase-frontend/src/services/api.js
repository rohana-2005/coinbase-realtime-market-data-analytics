import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

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
  
  getSummary: (symbol = 'BTC-USD') => 
    api.get('/analytics/summary', { params: { symbol } }),
  
  getHealth: () => 
    api.get('/analytics/health'),
};
