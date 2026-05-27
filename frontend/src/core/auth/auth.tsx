import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { api } from '../api/api';

export type User = {
  id: string;
  email: string | null;
  name: string;
  role: 'driver' | 'passenger' | 'admin';
  avatar_url: string | null;
  rating: number;
  rides_count: number;
  is_verified: boolean;
  money_saved: number;
  co2_saved_kg: number;
  phoneNumber: string | null;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: string) => Promise<void>;
  sendPhoneOtp: (phoneNumber: string) => Promise<any>;
  verifyPhoneOtp: (confirmationResult: any, code: string) => Promise<void>;
  loginWithGoogle: (firebaseIdToken: string, name?: string, email?: string) => Promise<void>;
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

  // Sync active sessions and automatically fetch PostgreSQL profiles on boot
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log(`[AUTH] Firebase User session detected: ${firebaseUser.email || firebaseUser.phoneNumber}`);
          const token = await firebaseUser.getIdToken();
          await AsyncStorage.setItem('access_token', token);
          
          const { data } = await api.get('/auth/me');
          setUser(data);
        } else {
          console.log('[AUTH] No active Firebase User session found.');
          await AsyncStorage.removeItem('access_token');
          setUser(null);
        }
      } catch (err) {
        console.warn('[AUTH] Error during onAuthStateChanged Postgres sync:', err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    console.log(`[AUTH] Attempting Firebase Email sign-in for ${email}...`);
    const userCredential = await auth().signInWithEmailAndPassword(email, password);
    const token = await userCredential.user.getIdToken();
    await AsyncStorage.setItem('access_token', token);
    
    // Fetch and sync PostgreSQL profile
    const { data } = await api.get('/auth/me');
    setUser(data);
    console.log(`[AUTH] Firebase Email login and Postgres sync successful!`);
  };

  const signup = async (email: string, password: string, name: string, role: string) => {
    console.log(`[AUTH] Attempting Firebase Email signup for ${email}...`);
    const userCredential = await auth().createUserWithEmailAndPassword(email, password);
    
    // Set display name in Firebase Auth
    await userCredential.user.updateProfile({ displayName: name });
    
    // Send a free verification email
    await userCredential.user.sendEmailVerification();
    console.log(`[AUTH] Verification email dispatched to ${email}.`);

    const token = await userCredential.user.getIdToken();
    await AsyncStorage.setItem('access_token', token);
    
    // Sync profile and pass selected Name and Role as headers to automatically register in PostgreSQL
    const { data } = await api.get('/auth/me', {
      headers: {
        'x-user-role': role,
        'x-user-name': name,
      }
    });
    setUser(data);
    console.log(`[AUTH] Firebase Email signup and Postgres registration sync successful!`);
  };

  const sendPhoneOtp = async (phoneNumber: string) => {
    console.log(`[AUTH] Triggering Firebase Phone SMS OTP for ${phoneNumber}...`);
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    console.log(`[AUTH] Firebase Phone SMS OTP successfully sent.`);
    return confirmation;
  };

  const verifyPhoneOtp = async (confirmationResult: any, code: string) => {
    console.log(`[AUTH] Confirming Phone SMS OTP code ${code}...`);
    const userCredential = await confirmationResult.confirm(code);
    const token = await userCredential.user.getIdToken();
    await AsyncStorage.setItem('access_token', token);
    
    // Sync with PostgreSQL
    const { data } = await api.get('/auth/me');
    setUser(data);
    console.log(`[AUTH] Phone OTP login and Postgres sync complete.`);
  };

  const loginWithGoogle = async (firebaseIdToken: string, name?: string, email?: string) => {
    console.log(`[AUTH] Syncing native Google sign-in credentials with Postgres...`);
    await AsyncStorage.setItem('access_token', firebaseIdToken);
    
    const { data } = await api.get('/auth/me', {
      headers: {
        'x-user-name': name,
        'x-user-role': 'passenger',
      }
    });
    setUser(data);
    console.log(`[AUTH] Google sign-in Postgres sync complete.`);
  };

  const logout = async () => {
    console.log('[AUTH] Log-out action triggered.');
    await auth().signOut();
    await AsyncStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, signup, sendPhoneOtp, verifyPhoneOtp, loginWithGoogle, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
