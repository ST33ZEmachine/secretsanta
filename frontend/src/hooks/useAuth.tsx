import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiService } from '../services/apiService';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiService.setToken(token);
      // Verify token and get user info
      apiService.getCurrentUser()
        .then((response) => {
          setUser(response.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          apiService.setToken('');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    localStorage.setItem('token', response.token);
    apiService.setToken(response.token);
    setUser(response.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await apiService.register(email, password, name);
    localStorage.setItem('token', response.token);
    apiService.setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    apiService.setToken('');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


