import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState, useCallback, useRef } from 'react';

type CacheListener = (data: any) => void;

class CacheManager {
  private listeners: Map<string, Set<CacheListener>> = new Map();
  private memoryCache: Map<string, any> = new Map();
  private initializedPromise: Promise<void>;

  constructor() {
    this.initializedPromise = this.initialize();
  }

  private async initialize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('@app_cache:'));
      if (cacheKeys.length > 0) {
        const pairs = await AsyncStorage.multiGet(cacheKeys);
        for (const [key, val] of pairs) {
          if (val) {
            try {
              const parsed = JSON.parse(val);
              const cleanKey = key.replace('@app_cache:', '');
              this.memoryCache.set(cleanKey, parsed);
            } catch {}
          }
        }
      }
    } catch (e) {
      console.warn('Failed to initialize cache from AsyncStorage:', e);
    }
  }

  /**
   * Waits for AsyncStorage to load initial cached values.
   */
  async ensureInitialized(): Promise<void> {
    await this.initializedPromise;
  }

  /**
   * Subscribes a listener to a cache key.
   */
  subscribe(key: string, listener: CacheListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    // Trigger with memory cache value immediately if it exists
    if (this.memoryCache.has(key)) {
      listener(this.memoryCache.get(key));
    } else {
      // Check asynchronously from AsyncStorage in case memory cache is not fully ready
      AsyncStorage.getItem(`@app_cache:${key}`).then(val => {
        if (val && !this.memoryCache.has(key)) {
          try {
            const parsed = JSON.parse(val);
            this.memoryCache.set(key, parsed);
            listener(parsed);
          } catch {}
        }
      }).catch(() => {});
    }

    return () => {
      const set = this.listeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Gets a value from memory cache.
   */
  get(key: string): any {
    return this.memoryCache.get(key);
  }

  /**
   * Sets a value in memory cache and persists it to AsyncStorage.
   * Notifies all subscribers of the change.
   */
  async set(key: string, data: any): Promise<void> {
    this.memoryCache.set(key, data);
    this.notify(key, data);

    try {
      await AsyncStorage.setItem(`@app_cache:${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn(`Failed to persist cache for key ${key}:`, e);
    }
  }

  /**
   * Removes a key from cache.
   */
  async remove(key: string): Promise<void> {
    this.memoryCache.delete(key);
    this.notify(key, null);
    try {
      await AsyncStorage.removeItem(`@app_cache:${key}`);
    } catch (e) {
      console.warn(`Failed to remove cache key ${key}:`, e);
    }
  }

  /**
   * Clears the entire cache.
   */
  async clear(): Promise<void> {
    const keys = Array.from(this.memoryCache.keys());
    this.memoryCache.clear();
    for (const key of keys) {
      this.notify(key, null);
    }
    try {
      const storageKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = storageKeys.filter(k => k.startsWith('@app_cache:'));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (e) {
      console.warn('Failed to clear AsyncStorage cache:', e);
    }
  }

  private notify(key: string, data: any) {
    const set = this.listeners.get(key);
    if (set) {
      for (const listener of set) {
        try {
          listener(data);
        } catch (e) {
          console.error(`Error notifying subscriber for key ${key}:`, e);
        }
      }
    }
  }
}

export const cacheManager = new CacheManager();

export interface useCachedDataOptions<T> {
  staleTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (err: any) => void;
  skipRevalidation?: boolean;
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: useCachedDataOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(() => cacheManager.get(key) || null);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<any>(null);
  
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    // Subscribe to cache updates (observes local storage/memory cache changes)
    const unsubscribe = cacheManager.subscribe(key, (cachedValue) => {
      setData(cachedValue);
    });

    let isMounted = true;

    const revalidate = async () => {
      if (optionsRef.current.skipRevalidation) return;
      try {
        setLoading(true);
        const result = await fetcherRef.current();
        if (isMounted) {
          await cacheManager.set(key, result);
          setError(null);
          optionsRef.current.onSuccess?.(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          optionsRef.current.onError?.(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    revalidate();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [key]);

  const mutate = useCallback(async (newData: T | ((prev: T | null) => T)) => {
    const value = typeof newData === 'function' ? (newData as any)(data) : newData;
    await cacheManager.set(key, value);
  }, [key, data]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetcherRef.current();
      await cacheManager.set(key, result);
      setError(null);
      optionsRef.current.onSuccess?.(result);
    } catch (err) {
      setError(err);
      optionsRef.current.onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  return {
    data,
    loading,
    error,
    mutate,
    refresh,
  };
}
