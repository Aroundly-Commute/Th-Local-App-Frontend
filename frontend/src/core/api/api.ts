import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15000,
});

// Cache storage for GET requests
const apiCache = new Map<string, { timestamp: number; promise?: Promise<any>; response?: any }>();
const CACHE_TTL = 30000; // 30 seconds Cache TTL

const originalGet = api.get;
api.get = async function <T = any, R = AxiosResponse<T>, D = any>(
  url: string,
  config?: AxiosRequestConfig<D>
): Promise<R> {
  const bypass = 
    config?.headers?.['x-bypass-cache'] === 'true' || 
    (config?.params && config.params.bypassCache === true);
  
  // Strip bypassCache parameter so it doesn't pollute the query params sent to server
  if (config?.params && 'bypassCache' in config.params) {
    const { bypassCache, ...restParams } = config.params;
    config.params = restParams;
  }
  
  const cacheKey = url + JSON.stringify(config?.params || {});
  
  if (!bypass) {
    const cached = apiCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[API CACHE] Hit for: ${url}`);
      if (cached.promise) {
        return cached.promise;
      }
      return cached.response;
    }
  }
  
  console.log(`[API CACHE] Miss/Bypass for: ${url}. Fetching from network...`);
  
  const promise = originalGet.call(api, url, config);
  apiCache.set(cacheKey, { timestamp: Date.now(), promise });
  
  try {
    const response = await promise;
    apiCache.set(cacheKey, { timestamp: Date.now(), response });
    return response as any;
  } catch (err) {
    apiCache.delete(cacheKey); // Do not cache failed requests
    throw err;
  }
};

api.interceptors.request.use(async (config) => {
  console.log(`[API] Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error(`[API] Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const wsUrl = (chatId: string) => {
  const u = (BASE || '').replace(/^http/, 'ws');
  return `${u}/api/ws/chat/${chatId}`;
};

