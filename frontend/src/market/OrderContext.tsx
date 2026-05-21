import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../auth'; // Assuming auth context exists
import { api } from '../services/api'; // Or use fetch if api service isn't fully configured

// Event-driven Order Architecture

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
  
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [merchantOrders, setMerchantOrders] = useState<Order[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // In a real app, you might have multiple shopIds for a merchant user
  const shopId = user?.role === 'merchant' ? 'dummy-shop-id' : null; // Replace with actual shop ID resolution

  useEffect(() => {
    if (!user) {
      setCustomerOrders([]);
      setMerchantOrders([]);
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
  }, [user, shopId]);

  const placeOrder = async (targetShopId: string, items: any[], totalAmount: number) => {
    if (!socket || !socket.connected) {
      console.warn('[OrderContext] Socket not connected, cannot place order via WS');
      return;
    }
    const orderData = {
      shopId: targetShopId,
      customerId: user?.id,
      items,
      totalAmount,
    };
    
    return new Promise<void>((resolve) => {
      socket.emit('placeOrder', orderData, (response: any) => {
        if (response?.data) {
           // Optimistically add to customer orders
           setCustomerOrders(prev => [response.data, ...prev]);
        }
        resolve();
      });
    });
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    if (!socket || !socket.connected) {
       console.warn('[OrderContext] Socket not connected, cannot update order status');
       return;
    }
    return new Promise<void>((resolve) => {
      socket.emit('updateOrderStatus', { orderId, status }, (response: any) => {
        if (response?.data) {
           // Local state updated via socket event 'orderStatusUpdated'
        }
        resolve();
      });
    });
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
