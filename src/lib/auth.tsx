import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api, saveTokens, clearTokens } from './api';

interface User {
  id: string;
  email: string;
  fullName: string;
  hasApiKey: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (data: { email: string; password: string; fullName: string; whatsapp: string }) => Promise<{ error?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({}),
  signup: async () => ({}),
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const data = await api.me();
      if (data) {
        setUser(data);
      } else {
        clearTokens();
        setUser(null);
      }
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login(email, password);
    if (data.error) return { error: data.error };

    saveTokens(data.accessToken, data.refreshToken);
    setUser({ id: data.user.id, email: data.user.email, fullName: data.user.fullName, hasApiKey: false });
    await loadUser();
    return {};
  };

  const signup = async (signupData: { email: string; password: string; fullName: string; whatsapp: string }) => {
    const data = await api.signup(signupData);
    if (data.error) return { error: data.error };

    saveTokens(data.accessToken, data.refreshToken);
    setUser({ id: data.user.id, email: data.user.email, fullName: data.user.fullName, hasApiKey: false });
    return {};
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
