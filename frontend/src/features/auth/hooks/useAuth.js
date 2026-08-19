import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../../services/api';
import { queryClient } from '../../../services/queryClient';

export function useSession() {
  return useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return null;
      try {
        const data = await api.getMe();
        return data.user;
      } catch (err) {
        localStorage.removeItem('token');
        return null;
      }
    },
    staleTime: Infinity, // Don't refetch automatically unless invalidated
  });
}

export function useAuth() {
  const { data: user, isLoading: loading, refetch: refreshProfile } = useSession();

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => api.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, name, college, department, leetcodeUsername }) =>
      api.register(name, email, password, college, department, leetcodeUsername),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        await api.logout();
      } catch (e) {
        localStorage.removeItem('token');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['session'], null);
      localStorage.removeItem('token');
    },
  });

  return {
    user,
    profile: user, // Alias for backward compatibility
    loading,
    signIn: async (email, password) => {
      const res = await loginMutation.mutateAsync({ email, password });
      queryClient.setQueryData(['session'], res.user);
      return { user: res.user, token: res.token };
    },
    signUp: async (email, password, name, college, department, leetcodeUsername) => {
      const res = await registerMutation.mutateAsync({ email, password, name, college, department, leetcodeUsername });
      queryClient.setQueryData(['session'], res.user);
      return { user: res.user, token: res.token || res.access_token };
    },
    signOut: async () => {
      await logoutMutation.mutateAsync();
    },
    refreshProfile,
  };
}
