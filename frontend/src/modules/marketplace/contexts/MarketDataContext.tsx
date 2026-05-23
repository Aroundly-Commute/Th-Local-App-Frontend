import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SHOPS, SERVICES, SERVICE_PROVIDERS, FLASH_ITEMS } from '../screens/data';
import { api } from '../../../core/api/api';
import { useAuth } from '../../../core/auth/auth';

export type Shop = {
  id: string;
  name: string;
  rating: string;
  dist: string;
  emoji: string;
  bg: string;
  orders: string;
  category: string;
};

export type Service = {
  id: string;
  name: string;
  provider: string;
  price: string;
  rating: string;
  emoji: string;
  category: string;
  bg: string;
};

export type ServiceProvider = {
  id: string;
  name: string;
  rating: string;
  dist: string;
  emoji: string;
  bg: string;
  services: string;
  ratingCount: string;
};

export type Product = {
  name: string;
  emoji: string;
  bg: string;
  was: string;
  now: string;
  off: string;
};

type MarketDataContextType = {
  shops: Shop[];
  services: Service[];
  serviceProviders: ServiceProvider[];
  products: Product[];
  addShop: (name: string, category: string, emoji?: string) => Promise<string>;
  addProduct: (name: string, price: string, desc: string, stock: string) => Promise<void>;
  addServiceProvider: (name: string, category: string, emoji?: string) => Promise<string>;
  addService: (name: string, price: string, desc: string, providerName: string, category: string) => Promise<void>;
  createBooking: (serviceId: string, timeSlot: string, date?: string) => Promise<any>;
  loading: boolean;
  registeredRole: 'merchant' | 'provider' | null;
  setRegisteredRole: (role: 'merchant' | 'provider' | null) => Promise<void>;
  registeredBrandName: string | null;
  setRegisteredBrandName: (name: string | null) => Promise<void>;
  followedIds: string[];
  toggleFollow: (id: string) => Promise<void>;
  refreshData: () => Promise<void>;
  activeMode: 'marketplace' | 'pooling';
  setActiveMode: (mode: 'marketplace' | 'pooling') => void;
};

const MarketDataContext = createContext<MarketDataContextType | undefined>(undefined);

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Business Onboarding State
  const [registeredRole, setRegisteredRoleState] = useState<'merchant' | 'provider' | null>(null);
  const [registeredBrandName, setRegisteredBrandNameState] = useState<string | null>(null);

  // Business Follow State
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [activeMode, setActiveMode] = useState<'marketplace' | 'pooling'>('marketplace');

  const initAndFetchData = async (showLoadingIndicator = true) => {
    try {
      if (showLoadingIndicator) {
        setLoading(true);
      }
      console.log('[MarketDataContext] Fetching marketplace registry from database...');
      
      // 1. Fetch shops
      const shopsRes = await api.get('/marketplace/shops/search?q=');
      let currentShops = shopsRes.data || [];

      // If database is clean/empty, seed mock records so the app is instantly stunning
      if (currentShops.length === 0) {
        console.log('[MarketDataContext] Database is empty. Seeding initial shops, products, providers, and services...');
        const ownerId = user?.id || 'mock-owner-id';

        // Seed Shops and their Products
        for (const sh of SHOPS) {
          try {
            const shopData = await api.post('/marketplace/shops', {
              ownerId,
              name: sh.name,
              description: 'Groceries',
            });
            // Seed a product linked to this shop
            await api.post('/marketplace/products', {
              shopId: shopData.data.id,
              name: `${sh.name} Fresh Item`,
              price: 99,
              stock: 50,
              description: 'Fresh quality product',
              imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'
            });
          } catch (seedErr) {
            console.warn('[MarketDataContext] Seeding shop error:', seedErr);
          }
        }

        // Seed Service Providers and Services
        for (const sp of SERVICE_PROVIDERS) {
          try {
            const providerData = await api.post('/marketplace/providers', {
              ownerId,
              name: sp.name,
              services: sp.services,
            });
            // Seed a service for this provider
            await api.post('/marketplace/services', {
              providerId: providerData.data.id,
              name: `${sp.name} General Repair`,
              price: 299,
              description: 'Expert local professional services',
              category: 'Plumbing & Repairs',
            });
          } catch (seedErr) {
            console.warn('[MarketDataContext] Seeding provider error:', seedErr);
          }
        }

        // Re-fetch clean list after seeding
        const freshShops = await api.get('/marketplace/shops/search?q=');
        currentShops = freshShops.data || [];
      }

      // Fetch products, services, and providers from database
      const [prodsRes, srvsRes, provsRes] = await Promise.all([
        api.get('/marketplace/products/search?q='),
        api.get('/marketplace/services/search?q='),
        api.get('/marketplace/providers/search?q='),
      ]);

      // Map database schemas directly to the premium frontend UI structures
      if (currentShops) {
        setShops(currentShops.map((s: any) => ({
          id: s.id,
          name: s.name,
          rating: '4.8',
          dist: '0.3 km',
          emoji: '🏪',
          bg: '#E8FBF9',
          orders: '1.2k',
          category: s.description || 'Groceries'
        })));
      }

      if (prodsRes.data) {
        setProducts(prodsRes.data.map((p: any) => ({
          name: p.product?.name || p.name || 'Product',
          emoji: '🎁',
          bg: '#FFFBEA',
          was: `₹${Math.round((p.price || 100) * 1.25)}`,
          now: `₹${p.price || 89}`,
          off: '20%'
        })));
      }

      if (srvsRes.data) {
        setServices(srvsRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          provider: s.provider?.name || 'Local Provider',
          price: `₹${s.price || 249}`,
          rating: '4.9',
          emoji: s.emoji || '🔧',
          category: s.category || 'Plumbing & Repairs',
          bg: '#E8FBF9'
        })));
      }

      if (provsRes.data) {
        setServiceProviders(provsRes.data.map((sp: any) => ({
          id: sp.id,
          name: sp.name,
          rating: '4.8',
          dist: sp.dist || '0.8 km',
          emoji: sp.emoji || '👨‍🔧',
          bg: '#E8FBF9',
          services: sp.services || 'General Services',
          ratingCount: String(sp.ratingCount || 10)
        })));
      }

      // Load roles and follows from database
      if (user?.id) {
        try {
          const [bizRes, followsRes] = await Promise.all([
            api.get(`/marketplace/user-business?userId=${user.id}`),
            api.get(`/marketplace/follows?userId=${user.id}`),
          ]);
          if (bizRes.data) {
            setRegisteredRoleState(bizRes.data.role);
            setRegisteredBrandNameState(bizRes.data.brandName);
          }
          if (followsRes.data) {
            setFollowedIds(followsRes.data);
          }
        } catch (dbErr) {
          console.error('[MarketDataContext] Error loading profile/follows from DB:', dbErr);
        }
      }

    } catch (err) {
      console.error('[MarketDataContext] Error connecting to backend, using local/offline storage:', err);
      // Fallback gracefully from AsyncStorage/data.ts
      const storedShops = await AsyncStorage.getItem('@verdex_shops');
      const storedServices = await AsyncStorage.getItem('@verdex_services');
      const storedProviders = await AsyncStorage.getItem('@verdex_providers');
      const storedProducts = await AsyncStorage.getItem('@verdex_products');

      setShops(storedShops ? JSON.parse(storedShops) : SHOPS.map((s: any) => ({ ...s, category: 'Groceries' })));
      setServices(storedServices ? JSON.parse(storedServices) : SERVICES);
      setServiceProviders(storedProviders ? JSON.parse(storedProviders) : SERVICE_PROVIDERS);
      setProducts(storedProducts ? JSON.parse(storedProducts) : FLASH_ITEMS);
    } finally {
      if (showLoadingIndicator) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    initAndFetchData(true);
  }, [user]);

  const refreshData = async () => {
    await initAndFetchData(false);
  };

  const saveToStorage = async (key: string, data: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('[MarketDataContext] Error persisting data locally:', e);
    }
  };

  const setRegisteredRole = async (role: 'merchant' | 'provider' | null) => {
    setRegisteredRoleState(role);
  };

  const setRegisteredBrandName = async (name: string | null) => {
    setRegisteredBrandNameState(name);
  };

  const toggleFollow = async (id: string) => {
    if (!user?.id) return;
    try {
      await api.post('/marketplace/follows', {
        userId: user.id,
        businessId: id,
      });
      setFollowedIds(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } catch (err) {
      console.error('[MarketDataContext] toggleFollow failed:', err);
    }
  };

  const addShop = async (name: string, category: string, emoji = '🏪') => {
    const ownerId = user?.id || 'mock-owner-id';
    try {
      const { data } = await api.post('/marketplace/shops', {
        ownerId,
        name,
        description: category
      });
      const newShop: Shop = {
        id: data.id,
        name,
        rating: '5.0',
        dist: '0.1 km',
        emoji,
        bg: '#E8FBF9',
        orders: '0',
        category,
      };
      setShops(prev => [newShop, ...prev]);
      return data.id;
    } catch (err) {
      console.error('[MarketDataContext] addShop failed:', err);
      // Fallback
      const id = `s_custom_${Date.now()}`;
      const newShop: Shop = {
        id,
        name,
        rating: '5.0',
        dist: '0.1 km',
        emoji,
        bg: '#E8FBF9',
        orders: '0',
        category,
      };
      setShops(prev => {
        const updated = [newShop, ...prev];
        saveToStorage('@verdex_shops', updated);
        return updated;
      });
      return id;
    }
  };

  const addProduct = async (name: string, price: string, desc: string, stock: string) => {
    const shopId = shops[0]?.id || 'mock-shop-id';
    const numericPrice = parseFloat(price) || 0;
    try {
      await api.post('/marketplace/products', {
        shopId,
        name,
        price: numericPrice,
        stock: parseInt(stock, 10) || 50,
        description: desc,
        imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80'
      });
      const originalPrice = Math.round(numericPrice * 1.25);
      const newProduct: Product = {
        name,
        emoji: '🎁',
        bg: '#E8FBF9',
        was: `₹${originalPrice}`,
        now: `₹${numericPrice}`,
        off: '20%',
      };
      setProducts(prev => [newProduct, ...prev]);
    } catch (err) {
      console.error('[MarketDataContext] addProduct failed:', err);
      // Fallback
      const originalPrice = Math.round(numericPrice * 1.25);
      const newProduct: Product = {
        name,
        emoji: '🎁',
        bg: '#E8FBF9',
        was: `₹${originalPrice}`,
        now: `₹${numericPrice}`,
        off: '20%',
      };
      setProducts(prev => {
        const updated = [newProduct, ...prev];
        saveToStorage('@verdex_products', updated);
        return updated;
      });
    }
  };

  const addServiceProvider = async (name: string, category: string, emoji = '🛠️') => {
    const ownerId = user?.id || 'mock-owner-id';
    try {
      const { data } = await api.post('/marketplace/providers', {
        ownerId,
        name,
        services: category
      });
      const newProvider: ServiceProvider = {
        id: data.id,
        name,
        rating: '5.0',
        dist: '0.1 km',
        emoji,
        bg: '#E8FBF9',
        services: category,
        ratingCount: '1',
      };
      setServiceProviders(prev => [newProvider, ...prev]);
      return data.id;
    } catch (err) {
      console.error('[MarketDataContext] addServiceProvider failed:', err);
      // Fallback
      const id = `sp_custom_${Date.now()}`;
      const newProvider: ServiceProvider = {
        id,
        name,
        rating: '5.0',
        dist: '0.1 km',
        emoji,
        bg: '#E8FBF9',
        services: category,
        ratingCount: '1',
      };
      setServiceProviders(prev => {
        const updated = [newProvider, ...prev];
        saveToStorage('@verdex_providers', updated);
        return updated;
      });
      return id;
    }
  };

  const addService = async (name: string, price: string, desc: string, providerName: string, category: string) => {
    const provider = serviceProviders.find(p => p.name === providerName);
    const providerId = provider?.id || 'mock-provider-id';
    try {
      await api.post('/marketplace/services', {
        providerId,
        name,
        price: parseFloat(price) || 199,
        description: desc,
        category,
      });
      const newService: Service = {
        id: `srv_custom_${Date.now()}`,
        name,
        provider: providerName,
        price: `₹${price}`,
        rating: '5.0',
        emoji: '🛠️',
        category,
        bg: '#E8FBF9',
      };
      setServices(prev => [newService, ...prev]);
    } catch (err) {
      console.error('[MarketDataContext] addService failed:', err);
      // Fallback
      const newService: Service = {
        id: `srv_custom_${Date.now()}`,
        name,
        provider: providerName,
        price: `₹${price}`,
        rating: '5.0',
        emoji: '🛠️',
        category,
        bg: '#E8FBF9',
      };
      setServices(prev => {
        const updated = [newService, ...prev];
        saveToStorage('@verdex_services', updated);
        return updated;
      });
    }
  };

  const createBooking = async (serviceId: string, timeSlot: string, date = 'Today') => {
    const userId = user?.id || 'mock-user-id';
    try {
      const { data } = await api.post('/marketplace/bookings', {
        userId,
        serviceId,
        timeSlot,
        date,
      });
      return data;
    } catch (err) {
      console.error('[MarketDataContext] createBooking failed:', err);
      throw err;
    }
  };

  return (
    <MarketDataContext.Provider
      value={{
        shops,
        services,
        serviceProviders,
        products,
        addShop,
        addProduct,
        addServiceProvider,
        addService,
        createBooking,
        loading,
        registeredRole,
        setRegisteredRole,
        registeredBrandName,
        setRegisteredBrandName,
        followedIds,
        toggleFollow,
        refreshData,
        activeMode,
        setActiveMode,
      }}
    >
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  const context = useContext(MarketDataContext);
  if (context === undefined) {
    throw new Error('useMarketData must be used within a MarketDataProvider');
  }
  return context;
}
