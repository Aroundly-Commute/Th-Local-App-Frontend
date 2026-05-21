import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Modal, useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Calendar, Clock, DollarSign, Tag, Info, User } from 'lucide-react-native';
import { useAuth } from '../../src/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { tap, success } from '../../src/haptics';

export default function CustomerBookings() {
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { user } = useAuth();
  
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000';

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/api/marketplace/bookings?userId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('[CustomerBookings] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleBookingPress = (booking: any) => {
    tap();
    setSelectedBooking(booking);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return { bg: '#EBFDF5', text: '#10B981' };
      case 'PENDING':
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
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>My Bookings</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>🗓️</Text>
          <Text style={[styles.emptyText, { color: t.textSecondary }]}>No appointments booked yet.</Text>
          <TouchableOpacity
            style={[styles.bookBtn, { backgroundColor: '#10B981' }]}
            onPress={() => { tap(); router.push('/(market)'); }}
          >
            <Text style={styles.bookBtnText}>Explore Services</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList}>
          {bookings.map((b) => {
            const statusColor = getStatusColor(b.status || 'PENDING');
            return (
              <TouchableOpacity
                key={b.id}
                activeOpacity={0.8}
                onPress={() => handleBookingPress(b)}
                style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={[styles.serviceName, { color: t.textPrimary }]}>
                      {b.service?.name || 'General Service'}
                    </Text>
                    <Text style={[styles.providerName, { color: t.textSecondary }]}>
                      by {b.service?.provider?.name || 'Local Professional'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {b.status || 'PENDING'}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.metaRow}>
                  <View style={styles.metaCol}>
                    <Calendar size={14} color={t.textSecondary} />
                    <Text style={[styles.metaVal, { color: t.textPrimary }]}>{b.date}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Clock size={14} color={t.textSecondary} />
                    <Text style={[styles.metaVal, { color: t.textPrimary }]}>{b.timeSlot}</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={[styles.priceVal, { color: '#10B981' }]}>
                      ₹{b.service?.price || '249'}
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
        visible={!!selectedBooking}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Booking Details</Text>
              <TouchableOpacity
                onPress={() => { tap(); setSelectedBooking(null); }}
                style={[styles.closeBtn, { backgroundColor: t.muted }]}
              >
                <Text style={{ color: t.textPrimary, fontWeight: '700' }}>X</Text>
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView contentContainerStyle={styles.modalBody}>
                {/* Service Block */}
                <View style={[styles.detailSection, { borderBottomColor: t.border }]}>
                  <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Service</Text>
                  <Text style={[styles.detailValue, { color: t.textPrimary, fontSize: 18, fontWeight: '700' }]}>
                    {selectedBooking.service?.name}
                  </Text>
                  <Text style={[styles.detailSub, { color: t.textSecondary }]}>
                    {selectedBooking.service?.description || 'No description provided.'}
                  </Text>
                </View>

                {/* Provider Block */}
                <View style={[styles.detailSection, { borderBottomColor: t.border }]}>
                  <View style={styles.labelRow}>
                    <User size={16} color={t.textSecondary} />
                    <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Service Provider</Text>
                  </View>
                  <Text style={[styles.detailValue, { color: t.textPrimary }]}>
                    {selectedBooking.service?.provider?.name}
                  </Text>
                  <Text style={[styles.detailSub, { color: t.textSecondary }]}>
                    Rating: ⭐ {selectedBooking.service?.provider?.rating || '5.0'}
                  </Text>
                </View>

                {/* Timing & Price */}
                <View style={[styles.detailSection, { borderBottomColor: t.border }]}>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Date</Text>
                      <Text style={[styles.detailValue, { color: t.textPrimary }]}>
                        {selectedBooking.date}
                      </Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Time Slot</Text>
                      <Text style={[styles.detailValue, { color: t.textPrimary }]}>
                        {selectedBooking.timeSlot}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <View style={styles.gridRow}>
                    <View style={styles.gridCol}>
                      <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Status</Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: getStatusColor(selectedBooking.status || 'PENDING').text, fontWeight: '700' }
                        ]}
                      >
                        {selectedBooking.status || 'PENDING'}
                      </Text>
                    </View>
                    <View style={styles.gridCol}>
                      <Text style={[styles.detailLabel, { color: t.textSecondary }]}>Total Price</Text>
                      <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '800', fontSize: 18 }]}>
                        ₹{selectedBooking.service?.price}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.chatBtn, { backgroundColor: t.primary, marginTop: 16 }]}
                  onPress={() => {
                    tap();
                    setSelectedBooking(null);
                    router.push({
                      pathname: `/chat/chat_${selectedBooking.id}`,
                      params: { name: selectedBooking.service?.provider?.name || 'Provider' }
                    });
                  }}
                >
                  <Text style={[styles.chatBtnText, { color: t.primaryContrast }]}>💬 Chat with Provider</Text>
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
  bookBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  bookBtnText: { color: '#fff', fontWeight: '700' },
  scrollList: { padding: 16, gap: 12 },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  serviceName: { fontSize: 16, fontWeight: '700' },
  providerName: { fontSize: 13, marginTop: 2 },
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
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  detailLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', tracking: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '600' },
  detailSub: { fontSize: 13, marginTop: 4 },
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridCol: { flex: 1 },
  chatBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%' },
  chatBtnText: { fontWeight: '700', fontSize: 15 },
});
