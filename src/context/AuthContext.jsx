import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const response = await authApi.getProfile();
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch {
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    setUser(response.data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  };

  const register = async (userData) => {
    const response = await authApi.register(userData);
    if (response.data.status === 'pending') return response.data;
    setUser(response.data);
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
