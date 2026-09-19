import api from './axios';

export const getAnalyticsSummary = () => api.get('/analytics/summary');
