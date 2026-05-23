import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, ShoppingBag, Package, DollarSign, MessageSquare } from 'lucide-react-native';
import { useAuth } from '../../src/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { tap, success } from '../../src/haptics';

export default function CustomerOrders() {
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/marketplace/orders/customer?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('[CustomerOrders] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleOrderPress = (order: any) => {
    tap();
    setSelectedOrder(order);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
      case 'CONFIRMED':
        return { bg: '#EBFDF5', text: '#10B981' };
      case 'PENDING':
      case 'SHIPPED':
        return { bg: '#FFFBEB', text: '#F59E0B' };
      case 'REJECTED':
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={() => { tap(); if (router.canGoBack()) { router.back(); } else { router.replace('/(tabs)/profile'); } }} style={styles.backBtn}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>My Orders</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <ShoppingBag color={t.textTertiary} size={64} strokeWidth={1.5} style={{ marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>No orders placed yet.</Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: '#10B981' }]}
            onPress={() => { tap(); router.push('/(market)'); }}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList}>
          {orders.map((o) => {
            const statusColor = getStatusColor(o.status || 'PENDING');
            const dateStr = new Date(o.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });
            const shopName = o.items?.[0]?.shopProduct?.shop?.name || 'Local Marketplace';
            const itemsCount = o.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

            return (
              <TouchableOpacity
                key={o.id}
                activeOpacity={0.8}
                onPress={() => handleOrderPress(o)}
                style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.shopName, { color: t.textPrimary }]}>{shopName}</Text>
                    <Text style={[styles.orderDate, { color: t.textSecondary }]}>{dateStr}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {o.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Package size={14} color={t.textSecondary} />
                    <Text style={[styles.metaVal, { color: t.textPrimary }]}>
                      {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={[styles.priceVal, { color: '#10B981' }]}>
                      ₹{o.totalAmount}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Details Modal */}
      <Modal
        visible={!!selectedOrder}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedOrder(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Order Details</Text>
              <TouchableOpacity
                onPress={() => { tap(); setSelectedOrder(null); }}
                style={[styles.closeBtn, { backgroundColor: t.muted }]}
              >
                <Text style={{ color: t.textPrimary, fontWeight: '700' }}>X</Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Store Name & Date */}
                <View style={[styles.detailSection, { borderBottomColor: t.border }]}>
                  <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Store</Text>
                  <Text style={[styles.detailValue, { color: t.textPrimary, fontSize: 18, fontWeight: '700' }]}>
                    {selectedOrder.items?.[0]?.shopProduct?.shop?.name || 'Local Marketplace'}
                  </Text>
                  <Text style={[styles.detailSub, { color: t.textSecondary }]}>
                    Ordered on: {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                  </Text>
                </View>

                {/* Items List */}
                <View style={[styles.detailSection, { borderBottomColor: t.border }]}>
                  <Text style={[styles.detailLabel, { color: t.textSecondary, marginBottom: 8 }]}>Items</Text>
                  {selectedOrder.items?.map((item: any) => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemName, { color: t.textPrimary }]}>
                          {item.shopProduct?.product?.name || 'Product Item'}
                        </Text>
                        <Text style={[styles.itemQtyPrice, { color: t.textSecondary }]}>
                          Qty: {item.quantity} · ₹{item.priceAtTime} each
                        </Text>
                      </View>
                      <Text style={[styles.itemSubtotal, { color: t.textPrimary }]}>
                        ₹{item.priceAtTime * item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Total */}
                <View style={styles.detailSection}>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Status</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: getStatusColor(selectedOrder.status || 'PENDING').text, fontWeight: '700' }
                        ]}
                      >
                        {selectedOrder.status || 'PENDING'}
                      </Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Total Amount</Text>
                      <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '800', fontSize: 20 }]}>
                        ₹{selectedOrder.totalAmount}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.chatBtn, { backgroundColor: t.primary, marginTop: 16 }]}
                  onPress={() => {
                    tap();
                    setSelectedOrder(null);
                    router.push({
                      pathname: `/chat/chat_${selectedOrder.id}`,
                      params: { name: selectedOrder.items?.[0]?.shopProduct?.shop?.name || 'Store' }
                    });
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MessageSquare color={t.primaryContrast} size={18} strokeWidth={2.5} />
                    <Text style={[styles.chatBtnText, { color: t.primaryContrast }]}>Chat with Store</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  shopBtnText: { color: '#fff', fontWeight: '700' },
  scrollList: { padding: 16, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  shopName: { fontSize: 16, fontWeight: '700' },
  orderDate: { fontSize: 13, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  divider: { height: 1, backgroundColor: 'rgba(0,0,0,0.05)', marginVertical: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaCol: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaVal: { fontSize: 13, fontWeight: '500' },
  priceVal: { fontSize: 15, fontWeight: '700' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingBottom: 24 },
  detailSection: { paddingVertical: 16, borderBottomWidth: 1 },
  detailLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600' },
  detailSub: { fontSize: 13, marginTop: 4 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemQtyPrice: { fontSize: 12, marginTop: 2 },
  itemSubtotal: { fontSize: 14, fontWeight: '700' },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { flex: 1 },
  chatBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%' },
  chatBtnText: { fontWeight: '700', fontSize: 15 },
});
