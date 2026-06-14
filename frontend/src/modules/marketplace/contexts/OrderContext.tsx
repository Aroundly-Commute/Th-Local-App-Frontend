import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../../core/auth/auth';
import { api } from '../../../core/api/api';
import { useFeatureFlags } from '../../../services/feature-flag/FeatureFlagContext';

export type OrderItem = {
  id: string;
  shopProductId: string;
  quantity: number;
  priceAtTime: number;
  shopProduct?: {
    product?: {
      name: string;
      imageUrl: string;
    };
    shop?: {
      name: string;
    }
  };
};

export type Order = {
  id: string;
  userId: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  items: OrderItem[];
  createdAt: string;
};

type OrderContextType = {
  customerOrders: Order[];
  merchantOrders: Order[];
  placeOrder: (shopId: string, items: any[], totalAmount: number) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  loading: boolean;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { enableMarketplace } = useFeatureFlags();
  
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  // Resolve business / shop ID dynamically from database
  useEffect(() => {
    if (!enableMarketplace || !user) {
      setShopId(null);
      return;
    }
    const resolveShopId = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/marketplace/user-business?userId=${user.id}`);
        if (res.ok) {
          const biz = await res.json();
          if (biz.role === 'merchant') {
            const shopsRes = await fetch(`${baseUrl}/api/marketplace/shops/search?q=`);
            if (shopsRes.ok) {
              const shops = await shopsRes.json();
              const userShop = shops.find((s: any) => s.ownerId === user.id);
              if (userShop) {
                setShopId(userShop.id);
              }
            }
          } else if (biz.role === 'provider') {
            const provRes = await fetch(`${baseUrl}/api/marketplace/providers/search?q=`);
            if (provRes.ok) {
              const providers = await provRes.json();
              const userProv = providers.find((sp: any) => sp.ownerId === user.id);
              if (userProv) {
                setShopId(userProv.id);
              }
            }
          }
        }
      } catch (err) {
        console.error('[OrderContext] Error resolving shopId:', err);
      }
    };
    resolveShopId();
  }, [user, enableMarketplace]);

  useEffect(() => {
    if (!enableMarketplace || !user) {
      setCustomerOrders([]);
      setMerchantOrders([]);
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        
        // Fetch customer orders
        const custRes = await fetch(`${baseUrl}/api/marketplace/orders/customer?userId=${user.id}`);
        if (custRes.ok) {
          const custData = await custRes.json();
          setCustomerOrders(custData);
        }

        // Fetch merchant orders if applicable
        if (shopId) {
          const merchRes = await fetch(`${baseUrl}/api/marketplace/orders/shop?shopId=${shopId}`);
          if (merchRes.ok) {
            const merchData = await merchRes.json();
            setMerchantOrders(merchData);
          }
        }
      } catch (error) {
        console.error('[OrderContext] Error fetching initial orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();

    // Setup Socket
    const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';
    const socketUrl = apiUrl.replace('/api', '');
    const newSocket = io(socketUrl, { transports: ['websocket'] });

    newSocket.on('connect', () => {
      console.log('[OrderContext] Socket connected:', newSocket.id);
      newSocket.emit('joinCustomerRoom', user.id);
      if (shopId) {
        newSocket.emit('joinShopRoom', shopId);
      }
    });

    newSocket.on('newOrder', (order: Order) => {
      console.log('[OrderContext] newOrder event received:', order);
      setMerchantOrders(prev => {
        if (prev.find(o => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    newSocket.on('orderStatusUpdated', (order: Order) => {
      console.log('[OrderContext] orderStatusUpdated event received:', order);
      
      // Update customer orders
      setCustomerOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
      
      // Update merchant orders
      setMerchantOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: order.status } : o));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user, shopId, enableMarketplace]);

  const placeOrder = async (targetShopId: string, items: any[], totalAmount: number) => {
    if (!enableMarketplace) return;
    if (socket && socket.connected) {
      const orderData = {
        shopId: targetShopId,
        customerId: user?.id,
        items,
        totalAmount,
      };
      
      return new Promise<void>((resolve) => {
        socket.emit('placeOrder', orderData, (response: any) => {
          if (response?.data) {
             setCustomerOrders(prev => {
               if (prev.find(o => o.id === response.data.id)) return prev;
               return [response.data, ...prev];
             });
          }
          resolve();
        });
      });
    } else {
      console.warn('[OrderContext] Socket not connected, falling back to REST API for order placement');
      try {
        const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/marketplace/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            items: items.map(i => ({
              shopProductId: i.shopProductId,
              quantity: i.quantity,
              priceAtTime: i.price,
            })),
          }),
        });
        if (res.ok) {
          const orderData = await res.json();
          setCustomerOrders(prev => {
            if (prev.find(o => o.id === orderData.id)) return prev;
            return [orderData, ...prev];
          });
        }
      } catch (err) {
        console.error('[OrderContext] REST fallback placeOrder failed:', err);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!enableMarketplace) return;
    // Instantly update states locally for maximum UI responsiveness
    setCustomerOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    setMerchantOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));

    if (socket && socket.connected) {
      return new Promise<void>((resolve) => {
        socket.emit('updateOrderStatus', { orderId, status }, (response: any) => {
          resolve();
        });
      });
    }
  };

  return (
    <OrderContext.Provider value={{ customerOrders, merchantOrders, placeOrder, updateOrderStatus, loading }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
