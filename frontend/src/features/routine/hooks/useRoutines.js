import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';
import { toast } from 'sonner';

export function useRoutines() {
  return useQuery({
    queryKey: ['routines'],
    queryFn: async () => {
      const data = await api.getRoutines();
      return data?.routines || [];
    },
  });
}

export function useRoutineById(routineId) {
  return useQuery({
    queryKey: ['routines', routineId],
    queryFn: async () => {
      const data = await api.getRoutineById(routineId);
      return data?.routine || null;
    },
    enabled: Boolean(routineId),
  });
}

export function useCreateRoutine() {
  return useMutation({
    mutationFn: (routineData) => api.createRoutine(routineData),
    onMutate: () => {
      const toastId = toast.loading('Creating routine...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      toast.success('Routine created successfully', { id: context?.toastId });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to create routine', { id: context?.toastId });
    },
  });
}

export function useUpdateRoutine() {
  return useMutation({
    mutationFn: ({ routineId, data }) => api.updateRoutine(routineId, data),
    onMutate: () => {
      const toastId = toast.loading('Updating routine...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routines', variables.routineId] });
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      toast.success('Routine updated successfully', { id: context?.toastId });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to update routine', { id: context?.toastId });
    },
  });
}

export function useArchiveRoutine() {
  return useMutation({
    mutationFn: (routineId) => api.archiveRoutine(routineId),
    onMutate: () => {
      const toastId = toast.loading('Archiving routine...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      toast.success('Routine archived', { id: context?.toastId });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to archive routine', { id: context?.toastId });
    },
  });
}

export function useActivateRoutine() {
  return useMutation({
    mutationFn: (routineId) => api.activateRoutine(routineId),
    onMutate: () => {
      const toastId = toast.loading('Activating routine...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      toast.success('Routine activated as your daily plan!', { id: context?.toastId });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to activate routine', { id: context?.toastId });
    },
  });
}

export function useAddRoutineTask() {
  return useMutation({
    mutationFn: ({ routineId, data }) => api.addRoutineTask(routineId, data),
    onMutate: () => {
      const toastId = toast.loading('Adding task...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['routines', variables.routineId] });
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      toast.success('Task added successfully', { id: context?.toastId });
    },
    onError: (err, variables, context) => {
      toast.error(err.message || 'Failed to add task', { id: context?.toastId });
    },
  });
}

export function useUpdateRoutineTask() {
  return useMutation({
    mutationFn: ({ taskId, data }) => api.updateRoutineTask(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      toast.success('Task updated');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update task');
    },
  });
}

export function useRemoveRoutineTask() {
  return useMutation({
    mutationFn: (taskId) => api.removeRoutineTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routines'] });
      queryClient.invalidateQueries({ queryKey: ['todayRoutine'] });
      toast.success('Task removed');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove task');
    },
  });
}
