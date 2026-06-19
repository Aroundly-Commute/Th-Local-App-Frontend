import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from './firebaseAdapter';
import { api, clearApiCache } from '../api/api';
import { cacheManager } from '../services/cache';
import { Platform } from 'react-native';

let messagingModule: any = null;
let GoogleSignin: any = null;
if (Platform.OS !== 'web') {
  try {
    messagingModule = require('@react-native-firebase/messaging');
  } catch (err) {
    console.warn('[FCM] Failed to load native messaging module:', err);
  }
  try {
    GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
  } catch (err) {
    console.warn('[AUTH] Failed to load native GoogleSignin module:', err);
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
  society?: string | null;
  workplace?: string | null;
  bio?: string | null;
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
  setIsAuthenticating: (val: boolean) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const fcmSyncedRef = useRef<string | null>(null);
  const isAuthActionInProgress = useRef(false);

  // Configure native Google Sign-in credentials on boot
  useEffect(() => {
    if (Platform.OS !== 'web' && GoogleSignin) {
      try {
        GoogleSignin.configure({
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '233722731121-brn0chd58jfffn5ecq5qe493a58eg4r6.apps.googleusercontent.com',
        });
        console.log('[AUTH] Google Sign-In configured successfully.');
      } catch (err) {
        console.warn('[AUTH] Failed to configure Google Sign-In:', err);
      }
    }
  }, []);

  const setIsAuthenticating = useCallback((val: boolean) => {
    isAuthActionInProgress.current = val;
  }, []);

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
              apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAOU3gODihgxONXDpTfnNz6Q65MZAlzqFg",
              authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "aroundyou-497203.firebaseapp.com",
              projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "aroundyou-497203",
              storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "aroundyou-497203.firebasestorage.app",
              messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "233722731121",
              appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:233722731121:web:654c7c8efa3f6e2e2d19d0"
            };

            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
            const messagingInstance = getMessaging(app);

            const params = new URLSearchParams(firebaseConfig as any).toString();
            const registration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${params}`);

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

    if (!messagingModule) return;
    try {
      const { getMessaging, getToken, requestPermission, AuthorizationStatus } = messagingModule;
      const messagingInstance = getMessaging();
      const authStatus = await requestPermission(messagingInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await getToken(messagingInstance);
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
    if (user?.id) {
      if (fcmSyncedRef.current !== user.id) {
        fcmSyncedRef.current = user.id;
        syncFcmToken();
      }

      if (Platform.OS !== 'web' && messagingModule) {
        const { getMessaging, onTokenRefresh } = messagingModule;
        const messagingInstance = getMessaging();
        const unsubscribeTokenRefresh = onTokenRefresh(messagingInstance, async (token: string) => {
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
    } else {
      fcmSyncedRef.current = null;
    }
  }, [user?.id]);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me', { params: { bypassCache: true } });
      await AsyncStorage.setItem('cached_profile_user', JSON.stringify(data));
      setUser(data);
    } catch (err: any) {
      console.warn('[AUTH] Failed to refresh profile:', err?.message);
      // Only set to null if it's an authorization/authentication error (401 or 403), otherwise keep current state
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          console.log(`[AUTH] Firebase User session detected: ${firebaseUser.email || firebaseUser.phoneNumber}`);
          if (isAuthActionInProgress.current) {
            console.log('[AUTH] Manual authentication in progress. Skipping duplicate fetch.');
            return;
          }
          const token = await firebaseUser.getIdToken();
          await AsyncStorage.setItem('access_token', token);
          
          try {
            const { data } = await api.get('/auth/me');
            await AsyncStorage.setItem('cached_profile_user', JSON.stringify(data));
            setUser(data);
          } catch (apiErr: any) {
            console.warn('[AUTH] Failed to fetch profile from PostgreSQL, checking cache...', apiErr?.message);
            // If offline, check if we have a cached profile user
            const cachedVal = await AsyncStorage.getItem('cached_profile_user');
            if (cachedVal) {
              try {
                const parsedUser = JSON.parse(cachedVal);
                console.log('[AUTH] Loaded cached profile user:', parsedUser.email || parsedUser.phoneNumber);
                setUser(parsedUser);
              } catch (parseErr) {
                console.error('[AUTH] Failed to parse cached profile user:', parseErr);
                setUser(null);
              }
            } else {
              setUser(null);
            }
          }
        } else {
          console.log('[AUTH] No active Firebase User session found.');
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('cached_profile_user');
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

  const login = useCallback(async (email: string, password: string) => {
    isAuthActionInProgress.current = true;
    try {
      console.log(`[AUTH] Attempting Firebase Email sign-in for ${email}...`);
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      if (!userCredential || !userCredential.user) throw new Error('User not found');
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('access_token', token);
      
      const { data } = await api.get('/auth/me');
      await AsyncStorage.setItem('cached_profile_user', JSON.stringify(data));
      setUser(data);
      console.log(`[AUTH] Firebase Email login and Postgres sync successful!`);
    } finally {
      isAuthActionInProgress.current = false;
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: string) => {
    isAuthActionInProgress.current = true;
    try {
      console.log(`[AUTH] Attempting Firebase Email signup for ${email}...`);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      if (!userCredential || !userCredential.user) throw new Error('Failed to create user');
      
      await userCredential.user.updateProfile({ displayName: name });
      
      await userCredential.user.sendEmailVerification();
      console.log(`[AUTH] Verification email dispatched to ${email}.`);

      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('access_token', token);
      
      const { data } = await api.get('/auth/me', {
        headers: {
          'x-user-role': role,
          'x-user-name': name,
        }
      });
      await AsyncStorage.setItem('cached_profile_user', JSON.stringify(data));
      setUser(data);
      console.log(`[AUTH] Firebase Email signup and Postgres registration sync successful!`);
    } finally {
      isAuthActionInProgress.current = false;
    }
  }, []);

  const sendPhoneOtp = useCallback(async (phoneNumber: string) => {
    console.log(`[AUTH] Triggering Firebase Phone SMS OTP for ${phoneNumber}...`);
    const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
    console.log(`[AUTH] Firebase Phone SMS OTP successfully sent.`);
    return confirmation;
  }, []);

  const verifyPhoneOtp = useCallback(async (confirmationResult: any, code: string) => {
    isAuthActionInProgress.current = true;
    try {
      console.log(`[AUTH] Confirming Phone SMS OTP code ${code}...`);
      const userCredential = await confirmationResult.confirm(code);
      if (!userCredential || !userCredential.user) throw new Error('Failed to confirm OTP');
      const token = await userCredential.user.getIdToken();
      await AsyncStorage.setItem('access_token', token);
      
      const { data } = await api.get('/auth/me');
      await AsyncStorage.setItem('cached_profile_user', JSON.stringify(data));
      setUser(data);
      console.log(`[AUTH] Phone OTP login and Postgres sync complete.`);
    } finally {
      isAuthActionInProgress.current = false;
    }
  }, []);

  const loginWithGoogle = useCallback(async (firebaseIdToken: string, name?: string, email?: string) => {
    isAuthActionInProgress.current = true;
    try {
      console.log(`[AUTH] Syncing native Google sign-in credentials with Postgres...`);
      await AsyncStorage.setItem('access_token', firebaseIdToken);
      
      const { data } = await api.get('/auth/me', {
        headers: {
          'x-user-name': name,
          'x-user-role': 'passenger',
        }
      });
      await AsyncStorage.setItem('cached_profile_user', JSON.stringify(data));
      setUser(data);
      console.log(`[AUTH] Google sign-in Postgres sync complete.`);
    } finally {
      isAuthActionInProgress.current = false;
    }
  }, []);

  const logout = useCallback(async () => {
    console.log('[AUTH] Log-out action triggered.');
    
    try {
      await api.patch('/auth/fcm-token', { fcmToken: null }).catch((e) => {
        console.warn('[AUTH] Failed to clear FCM token on backend:', e);
      });
    } catch (err) {
      console.warn('[AUTH] Failed to request fcm-token clear:', err);
    }

    try {
      await auth().signOut();
    } catch (err) {
      console.warn('[AUTH] Firebase signOut error:', err);
    }

    if (Platform.OS !== 'web' && GoogleSignin) {
      try {
        console.log('[AUTH] Logging out Google Sign-In session...');
        await GoogleSignin.signOut();
        console.log('[AUTH] Google Sign-In session cleared.');
      } catch (err) {
        console.warn('[AUTH] Google Sign-In signOut error:', err);
      }
    }

    try {
      clearApiCache();
      await cacheManager.clear();
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('cached_profile_user');
    } catch (err) {
      console.warn('[AUTH] AsyncStorage selective clear error:', err);
    }

    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, signup, sendPhoneOtp, verifyPhoneOtp, loginWithGoogle, logout, refresh, setIsAuthenticating }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
