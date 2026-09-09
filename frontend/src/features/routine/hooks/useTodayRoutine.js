import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

export function useTodayRoutine(date = null) {
  return useQuery({
    queryKey: ['todayRoutine', date || 'today'],
    queryFn: async () => {
      const data = await api.getTodayRoutine(date);
      return data;
    },
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useRoutineDay(date) {
  return useQuery({
    queryKey: ['routineDay', date],
    queryFn: async () => {
      const data = await api.getRoutineDay(date);
      return data;
    },
    enabled: Boolean(date),
  });
}

export function useUpdateTaskLog() {
  return useMutation({
    mutationFn: ({ dayId, taskLogId, status }) =>
      api.updateTaskLog(dayId, taskLogId, { status }),
    onMutate: async ({ dayId, taskLogId, status }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todayRoutine'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(['todayRoutine', 'today']);

      // Optimistically update
      if (previousData?.routineDay?.taskLogs) {
        const updatedLogs = previousData.routineDay.taskLogs.map((log) => {
          if (log.id === taskLogId) {
            return {
              ...log,
              status,
              completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
            };
          }
          return log;
        });

        const completedCount = updatedLogs.filter((l) => l.status === 'COMPLETED').length;
        const totalCount = updatedLogs.length;
        const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100 * 10) / 10 : 0;

        queryClient.setQueryData(['todayRoutine', 'today'], {
          ...previousData,
          routineDay: {
            ...previousData.routineDay,
            taskLogs: updatedLogs,
            completedTasks: completedCount,
            completionPercentage: percentage,
          },
        });
      }

      return { previousData };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['todayRoutine', 'today'], context.previousData);
      }
      toast.error(err.message || 'Failed to update task status');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      queryClient.invalidateQueries({ queryKey: ['routineAnalytics'] });
    },
  });
}
