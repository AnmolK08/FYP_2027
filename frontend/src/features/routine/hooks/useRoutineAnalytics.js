import { useQuery } from '@tanstack/react-query';
import { api } from '../../../services/api';

export function useWeeklyAnalytics(params = {}) {
  return useQuery({
    queryKey: ['routineAnalytics', 'weekly', params],
    queryFn: async () => {
      const data = await api.getWeeklyAnalytics(params);
      return data?.stats || null;
    },
  });
}

export function useMonthlyAnalytics(params = {}) {
  return useQuery({
    queryKey: ['routineAnalytics', 'monthly', params],
    queryFn: async () => {
      const data = await api.getMonthlyAnalytics(params);
      return data?.stats || null;
    },
  });
}

export function useTaskPerformance(taskId, params = {}) {
  return useQuery({
    queryKey: ['routineAnalytics', 'task', taskId, params],
    queryFn: async () => {
      const data = await api.getTaskPerformance(taskId, params);
      return data?.performance || null;
    },
    enabled: Boolean(taskId),
  });
}

export function useRoutineSuggestions() {
  return useQuery({
    queryKey: ['routineAnalytics', 'suggestions'],
    queryFn: async () => {
      const data = await api.getRoutineSuggestions();
      return data || { suggestions: [], metrics: {} };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
