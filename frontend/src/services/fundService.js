import api from './api';

export const searchFunds = (query) => api.get(`/funds/search?q=${encodeURIComponent(query)}`);
export const getFundDetails = (schemeCode) => api.get(`/funds/${schemeCode}`);
export const getWatchlist = () => api.get('/watchlist');
export const addToWatchlist = (data) => api.post('/watchlist', data);
export const removeFromWatchlist = (schemeCode) => api.delete(`/watchlist/${schemeCode}`);
