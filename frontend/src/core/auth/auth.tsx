import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from './firebaseAdapter';
import { api } from '../api/api';
import { Platform } from 'react-native';

let messaging: any = null;
if (Platform.OS !== 'web') {
  try {
    messaging = require('@react-native-firebase/messaging').default;
  } catch (err) {
    console.warn('[FCM] Failed to load native messaging module:', err);
  }
}

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
  gender?: string | null;
  vehicle?: any;
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

  const syncFcmToken = async () => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window) {
          const permission = await Notification.requestPermission();
          console.log('[FCM Web] Permission status:', permission);
          if (permission === 'granted') {
            const { getMessaging, getToken } = require('firebase/messaging');
            const { initializeApp, getApps, getApp } = require('firebase/app');

            const firebaseConfig = {
              apiKey: "AIzaSyAOU3gODihgxONXDpTfnNz6Q65MZAlzqFg",
              authDomain: "aroundyou-497203.firebaseapp.com",
              projectId: "aroundyou-497203",
              storageBucket: "aroundyou-497203.firebasestorage.app",
              messagingSenderId: "233722731121",
              appId: "1:233722731121:web:654c7c8efa3f6e2e2d19d0"
            };

            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
            const messagingInstance = getMessaging(app);

            // Register service worker explicitly to ensure reliability
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

            const vapidKey = process.env.EXPO_PUBLIC_VAPID_KEY;
            if (!vapidKey) {
              console.warn('[FCM Web] VAPID Key is missing. Please set EXPO_PUBLIC_VAPID_KEY in your .env file to enable Web Push Notifications.');
              return;
            }

            const token = await getToken(messagingInstance, {
              serviceWorkerRegistration: registration,
              vapidKey
            });

            console.log('[FCM Web] Retrieved token:', token);
            if (token) {
              await api.patch('/auth/fcm-token', { fcmToken: token });
            }
          }
        }
      } catch (err) {
        console.warn('[FCM Web] Failed to sync Web FCM token:', err);
      }
      return;
    }

    if (!messaging) return;
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        console.log('[FCM] Retrieved token:', token);
        if (token) {
          await api.patch('/auth/fcm-token', { fcmToken: token });
        }
      }
    } catch (err) {
      console.warn('[FCM] Failed to sync FCM token:', err);
    }
  };

  useEffect(() => {
    if (user) {
      syncFcmToken();

      if (Platform.OS !== 'web' && messaging) {
        const unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token: string) => {
          console.log('[FCM] Token refreshed:', token);
          try {
            await api.patch('/auth/fcm-token', { fcmToken: token });
          } catch (err) {
            console.warn('[FCM] Failed to update refreshed FCM token:', err);
          }
        });

        return () => {
          unsubscribeTokenRefresh();
        };
      }
    }
  }, [user]);

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
    
    // 1. Clear FCM token on backend before signing out (while we still have the access token)
    try {
      await api.patch('/auth/fcm-token', { fcmToken: null }).catch((e) => {
        console.warn('[AUTH] Failed to clear FCM token on backend:', e);
      });
    } catch (err) {
      console.warn('[AUTH] Failed to request fcm-token clear:', err);
    }

    // 2. Sign out of Firebase
    try {
      await auth().signOut();
    } catch (err) {
      console.warn('[AUTH] Firebase signOut error:', err);
    }

    // 3. Sign out of native Google Sign-In on mobile
    if (Platform.OS !== 'web') {
      try {
        const { GoogleSignin } = require('@react-native-google-signin/google-signin');
        await GoogleSignin.signOut().catch(() => {});
      } catch (err) {
        console.warn('[AUTH] Google Sign-In signOut error:', err);
      }
    }

    // 4. Clean only auth-specific items instead of wiping everything
    try {
      await AsyncStorage.removeItem('access_token');
      // Clear network cache keys, but preserve analytics client IDs, feature flags, and permission prompts
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith('@app_cache:'));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (err) {
      console.warn('[AUTH] AsyncStorage selective clear error:', err);
    }

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
