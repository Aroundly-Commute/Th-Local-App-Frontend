import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '../auth/firebaseAdapter';
import { AnalyticsService } from '../services/analytics';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  
  let token = null;
  try {
    const currentUser = auth().currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken();
    }
  } catch (err) {
    console.warn('[API] Failed to retrieve token from Firebase Auth:', err);
  }

  if (!token) {
    token = await AsyncStorage.getItem('access_token');
  }

  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - Status ${response.status}`);
    return response;
  },
  (error) => {
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'UNKNOWN';
    const status = error.response?.status || 0;
    const errorMsg = error.response?.data?.message || error.message || 'Network error';

    console.error(`[API Error] ${method} ${url} - Status ${status}:`, errorMsg);

    AnalyticsService.trackError(`API Error: ${method} ${url} (${status}) - ${errorMsg}`, false, {
      endpoint: url,
      method,
      status,
    }).catch(() => {});

    return Promise.reject(error);
  }
);

export const wsUrl = (chatId: string) => {
  const u = (BASE || '').replace(/^http/, 'ws');
  return `${u}/api/ws/chat/${chatId}`;
};

export const clearApiCache = () => {
  console.log('[API CACHE] Cleared memory cache (no-op).');
};
