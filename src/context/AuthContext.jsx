import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // 세션 만료 처리
  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setSessionExpired(true);
  }, []);

  useEffect(() => {
    // 세션 만료 이벤트 리스너 등록
    const unsubscribe = api.onSessionExpired(handleSessionExpired);
    checkAuth();
    return unsubscribe;
  }, [handleSessionExpired]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await api.getMe();
        setUser(res.data);
        setSessionExpired(false);
      } catch (e) {
        localStorage.removeItem('token');
        // 세션 만료 메시지가 아닌 경우만 조용히 처리
        if (!e.message.includes('세션이 만료')) {
          setSessionExpired(false);
        }
      }
    }
    setLoading(false);
  };

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setUser(res.data.user);
    setSessionExpired(false);
    return res;
  };

  const signup = async (userData) => {
    const res = await api.signup(userData);
    return res;
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setSessionExpired(false);
  };

  // 세션 만료 알림 확인 후 리셋
  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  const value = {
    user,
    loading,
    isLoggedIn: !!user,
    sessionExpired,
    login,
    signup,
    logout,
    updateUser,
    checkAuth,
    clearSessionExpired,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
