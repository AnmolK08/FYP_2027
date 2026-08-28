import { useCurrentUser, USER_QUERY_KEY } from './useCurrentUser';
import { useLogin } from './useLogin';
import { useRegister } from './useRegister';
import { useLogout } from './useLogout';

export { useCurrentUser, useLogin, useRegister, useLogout, USER_QUERY_KEY };

/**
 * Unified auth facade hook for backward compatibility and clean feature consumption.
 */
export function useAuth() {
  const { data: user, isLoading: loading, isFetching, refetch: refreshProfile } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  return {
    user: user || null,
    profile: user || null, // Alias for profile data
    loading,
    isFetching,
    isAuthenticated: Boolean(user),
    signIn: async (email, password) => {
      const res = await loginMutation.mutateAsync({ email, password });
      return { user: res.user, token: res.accessToken };
    },
    signUp: async (email, password, name, college, department, leetcodeUsername) => {
      const res = await registerMutation.mutateAsync({
        email,
        password,
        name,
        college,
        department,
        leetcodeUsername,
      });
      return { user: res.user, token: res.accessToken };
    },
    signOut: async () => {
      await logoutMutation.mutateAsync();
    },
    refreshProfile,
  };
}

export default useAuth;
