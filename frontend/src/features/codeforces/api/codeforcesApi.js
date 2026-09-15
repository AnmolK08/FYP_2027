import { apiClient } from '../../../services/apiClient';


export const syncCodeforces = () =>
  apiClient('/codeforces/sync', { method: 'POST' });


export const getCodeforcesStats = () =>
  apiClient('/codeforces/stats');
