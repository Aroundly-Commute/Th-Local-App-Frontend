import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/api';

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
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (phoneNumber: string, code: string) => Promise<void>;
  loginWithGoogle: (firebaseIdToken: string) => Promise<void>;
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
    console.log(`[AUTH] Attempting login for ${email}...`);
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('access_token', data.access_token);
    setUser(data.user);
    console.log(`[AUTH] Login successful for ${email}`);
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    console.log(`[AUTH] Attempting signup for ${email} as ${role}...`);
    const { data } = await api.post('/auth/register', { email, password, name, role });
    await AsyncStorage.setItem('access_token', data.access_token);
    setUser(data.user);
    console.log(`[AUTH] Signup successful for ${email}`);
  };

  const sendOtp = async (phoneNumber: string) => {
    console.log(`[AUTH] Requesting OTP code for phone: ${phoneNumber}...`);
    await api.post('/auth/otp/send', { phoneNumber });
    console.log(`[AUTH] OTP requested successfully for ${phoneNumber}`);
  };

  const verifyOtp = async (phoneNumber: string, code: string) => {
    console.log(`[AUTH] Verifying OTP code ${code} for phone: ${phoneNumber}...`);
    const { data } = await api.post('/auth/otp/verify', { phoneNumber, code });
    await AsyncStorage.setItem('access_token', data.access_token);
    setUser(data.user);
    console.log(`[AUTH] Phone OTP login successful! User: ${data.user.name}`);
  };

  const loginWithGoogle = async (firebaseIdToken: string, email?: string, name?: string, profilePic?: string) => {
    console.log(`[AUTH] Completing Google Sign-in with backend API...`);
    const { data } = await api.post('/auth/google', { idToken: firebaseIdToken, email, name, profilePic });
    await AsyncStorage.setItem('access_token', data.access_token);
    setUser(data.user);
    console.log(`[AUTH] Google login sync successful! User: ${data.user.name}`);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, signup, sendOtp, verifyOtp, loginWithGoogle, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
