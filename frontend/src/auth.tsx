import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

export type Vehicle = {
  make: string; model: string; color: string; license_plate: string; year: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: 'driver' | 'passenger' | 'admin';
  avatar_url: string;
  rating: number;
  rides_count: number;
  is_verified: boolean;
  vehicle?: Vehicle | null;
  bio: string;
  money_saved: number;
  co2_saved_kg: number;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data);
        } catch {
          await AsyncStorage.removeItem('access_token');
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('access_token', data.access_token);
    setUser(data.user);
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    const { data } = await api.post('/auth/register', { email, password, name, role });
    await AsyncStorage.setItem('access_token', data.access_token);
    setUser(data.user);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, signup, logout, refresh }}>{children}</Ctx.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
