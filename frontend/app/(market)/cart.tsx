import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { verdexColors as G } from '../../src/theme';
import { useCart } from '../../src/market/CartContext';
import { Toast } from '../../src/market/components/primitives';

export default function CartScreen() {
  const router = useRouter();
  const { items, totalCount, clearCart } = useCart();
  
  const [socket, setSocket] = useState<Socket | null>(null);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'pending' | 'confirmed' | 'rejected'>('idle');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const customerId = 'customer-123'; // Dummy for test
  // In a real app we'd determine shopId from the items (assuming all items are from 1 shop)
  const shopId = 'dummy-shop-id'; // To be replaced in actual flow or handled properly

  useEffect(() => {
    const apiUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000/api';
    const socketUrl = apiUrl.replace('/api', '');
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      newSocket.emit('joinCustomerRoom', customerId);
    });

    newSocket.on('orderStatusUpdated', (order) => {
      setOrderStatus(order.status.toLowerCase());
      if (order.status === 'CONFIRMED') {
        showToast('✅ Merchant accepted your order!');
        clearCart();
        setTimeout(() => {
          setOrderStatus('idle');
          router.replace('/(market)');
        }, 2500);
      } else if (order.status === 'REJECTED') {
        showToast('❌ Merchant rejected your order.');
        setTimeout(() => {
          setOrderStatus('idle');
        }, 2500);
      }
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePlaceOrder = () => {
    if (!socket || totalCount === 0) return;
    
    // We assume items belong to one shop for this simplified demo
    const formattedItems = Object.values(items).map(i => ({
      shopProductId: i.id,
      quantity: i.quantity,
      price: 10.00 // hardcoded price for simplicity, should come from product
    }));

    const totalAmount = formattedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const orderData = {
      shopId: 'c82736b0-73f1-4fc3-a9dd-63e8dfc7ccab', // We should fetch dynamic shop ID but sticking to the flow
      customerId,
      items: formattedItems,
      totalAmount
    };

    socket.emit('placeOrder', orderData, (response: any) => {
      console.log('Order placed', response);
    });
    
    setOrderStatus('pending');
    showToast('Order placed! Waiting for merchant to accept...');
  };

  const cartArray = Object.values(items);
  const totalAmount = cartArray.reduce((acc, i) => acc + (10 * i.quantity), 0); // Mock price $10

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Your Cart</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        {cartArray.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 60, marginBottom: 16 }}>🛒</Text>
            <Text style={s.emptyText}>Your cart is empty.</Text>
            <TouchableOpacity style={s.shopBtn} onPress={() => router.back()}>
              <Text style={s.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={s.card}>
              <Text style={s.cardHeader}>Items ({totalCount})</Text>
              {cartArray.map(item => (
                <View key={item.id} style={s.cartItem}>
                  <Text style={s.itemName}>{item.quantity}x {item.name}</Text>
                  <Text style={s.itemPrice}>₹{10 * item.quantity}</Text>
                </View>
              ))}
              <View style={s.divider} />
              <View style={s.cartItem}>
                <Text style={s.totalText}>Total</Text>
                <Text style={s.totalPrice}>₹{totalAmount}</Text>
              </View>
            </View>

            {orderStatus === 'pending' ? (
              <View style={s.pendingBox}>
                <ActivityIndicator size="small" color={G.lime} style={{ marginBottom: 12 }} />
                <Text style={s.pendingText}>Waiting for Merchant...</Text>
                <Text style={s.pendingSub}>They have been notified of your order.</Text>
              </View>
            ) : (
              <TouchableOpacity style={s.checkoutBtn} onPress={handlePlaceOrder}>
                <Text style={s.checkoutBtnText}>Place Order (₹{totalAmount})</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {toastMsg && (
        <View style={s.toastWrap} pointerEvents="none">
          <Toast message={toastMsg} />
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: G.surf,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${G.g200}40`,
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnText: {
    fontSize: 16,
    color: G.g600,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: G.txt,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: G.txt2,
    fontSize: 16,
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: G.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: G.surf3 || '#1f2028',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${G.g200}40`,
  },
  cardHeader: {
    color: G.txt,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  itemName: {
    color: G.txt,
    fontSize: 14,
  },
  itemPrice: {
    color: G.txt,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: `${G.g200}40`,
    marginVertical: 12,
  },
  totalText: {
    color: G.txt,
    fontSize: 16,
    fontWeight: '700',
  },
  totalPrice: {
    color: G.lime,
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutBtn: {
    backgroundColor: G.lime,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  checkoutBtnText: {
    color: G.g900,
    fontSize: 16,
    fontWeight: '800',
  },
  pendingBox: {
    backgroundColor: `${G.g800}80`,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 24,
    borderWidth: 1,
    borderColor: G.g700,
  },
  pendingText: {
    color: G.lime,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  pendingSub: {
    color: G.g300,
    fontSize: 12,
    textAlign: 'center',
  },
  toastWrap: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
});
