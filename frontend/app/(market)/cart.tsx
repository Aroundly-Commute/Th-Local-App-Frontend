import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { verdexColors as G } from '../../src/core/theme/theme';
import { useCart } from '../../src/modules/marketplace/contexts/CartContext';
import { useOrders } from '../../src/modules/marketplace/contexts/OrderContext';
import { useAuth } from '../../src/core/auth/auth';
import { Toast, MarketBackButton } from '../../src/modules/marketplace/components/primitives';

export default function CartScreen() {
  const router = useRouter();
  const { items, totalCount, clearCart, addItem, removeItem } = useCart();
  const { placeOrder } = useOrders();
  const { user } = useAuth();
  
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePlaceOrder = async () => {
    if (totalCount === 0) return;

    const cartArray = Object.values(items);
    if (cartArray.length === 0) return;

    // ✅ Group items by shopId — each shop gets its own order notification
    const ordersByShop: Record<string, typeof cartArray> = {};
    for (const item of cartArray) {
      if (!ordersByShop[item.shopId]) ordersByShop[item.shopId] = [];
      ordersByShop[item.shopId].push(item);
    }

    // Emit a separate placeOrder event for every shop involved
    try {
      // Clear the cart context state instantly so UI updates without waiting
      clearCart();
      showToast('Order placed successfully!');

      const orderPromises = Object.entries(ordersByShop).map(([shopId, shopItems]) => {
        const formattedItems = shopItems.map(i => ({
          shopProductId: i.id,
          quantity: i.quantity,
          price: i.price,
        }));
        const totalAmount = formattedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);

        console.log(`[Cart] Placing order for shop ${shopId}`);
        return placeOrder(shopId, formattedItems, totalAmount);
      });
      
      await Promise.all(orderPromises);
    } catch (err) {
       console.error('[Cart] Order placement failed:', err);
       showToast('Failed to place order.');
       return;
    }
    
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 2000);
  };

  const cartArray = Object.values(items);
  const totalAmount = cartArray.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  return (
    <SafeAreaView style={s.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={s.header}>
        <MarketBackButton style={s.backBtn} color={G.txt} size={18} />
        <Text style={s.headerTitle}>Your Cart</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content}>
        {cartArray.length === 0 ? (
          <View style={s.emptyState}>
            <ShoppingCart color={G.txt3} size={64} strokeWidth={1.5} style={{ marginBottom: 16 }} />
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
                  <View style={{ flex: 1 }}>
                    <Text style={s.itemName}>{item.name}</Text>
                    <Text style={s.itemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                  <View style={s.quantityControl}>
                    <TouchableOpacity onPress={() => removeItem(item.id)} style={s.qtyBtn}>
                      <Text style={s.qtyText}>-</Text>
                    </TouchableOpacity>
                    <Text style={s.qtyValue}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => addItem(item.id, item.name, item.price, item.shopId, item.image)} style={s.qtyBtn}>
                      <Text style={s.qtyText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={s.divider} />
              <View style={s.cartItem}>
                <Text style={s.totalText}>Total</Text>
                <Text style={s.totalPrice}>₹{totalAmount}</Text>
              </View>
            </View>

            <TouchableOpacity style={s.checkoutBtn} onPress={handlePlaceOrder}>
              <Text style={s.checkoutBtnText}>Place Order (₹{totalAmount})</Text>
            </TouchableOpacity>
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
    backgroundColor: G.g800,
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
  toastWrap: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${G.g200}20`,
    borderRadius: 8,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    padding: 8,
    paddingHorizontal: 12,
  },
  qtyText: {
    color: G.lime,
    fontSize: 18,
    fontWeight: '700',
  },
  qtyValue: {
    color: G.txt,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
});
