import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

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
      const data = await api.getMe();
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
    const data = await api.signup(email, password, name, college, department, leetcodeUsername);
    setUser(data.user);
    setProfile(data.user);
    return { user: data.user, token: data.token };
  }

  async function signIn(email, password) {
    const data = await api.login(email, password);
    setUser(data.user);
    setProfile(data.user);
    return { user: data.user, token: data.token };
  }

  async function signOut() {
    await api.logout();
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    try {
      const data = await api.getMe();
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
