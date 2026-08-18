import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../features/auth/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setProfile(data.user);
    } catch (error) {
      console.error('Session check failed:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email, password, name, college, department, leetcodeUsername) {
    const data = await authApi.register({ email, password, name, college, department, leetcodeUsername });
    setUser(data.user);
    setProfile(data.user);
    return { user: data.user, token: data.token || data.access_token };
  }

  async function signIn(email, password) {
    const data = await authApi.login({ email, password });
    setUser(data.user);
    setProfile(data.user);
    return { user: data.user, token: data.token };
  }

  async function signOut() {
    try {
      await authApi.logout();
    } catch (e) {
      localStorage.removeItem('token');
    }
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    try {
      const data = await authApi.getMe();
      setUser(data.user);
      setProfile(data.user);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
