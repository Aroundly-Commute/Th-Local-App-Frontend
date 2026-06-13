/**
 * ExploreScreen.tsx
 * Modular Explore tab screen showing active campus services and coming soon features.
 */
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Ticket,
  Map,
  ShoppingBag,
  Info,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../../core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';

type MyBooking = {
  id: string;
  spotId: string;
  spot: {
    spotName: string;
    level: number;
    section: string;
    owner?: {
      name: string;
      email: string;
    } | null;
  };
  date: string;
  slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startTime: string;
  endTime: string;
  price: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
};

const ExploreParkingIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12.5 3H7v18h3v-6h2.5c3.58 0 6.5-2.92 6.5-6.5S16.08 3 12.5 3zm0 10H10V6h2.5c1.93 0 3.5 1.57 3.5 3.5S14.43 13 12.5 13z" fill={color} />
  </Svg>
);

export default function ExploreScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const isDark = cs === 'dark';
  const router = useRouter();

  // Fetch parking bookings to show active parking passes
  const { data: bookings, isLoading, refetch } = useQuery<MyBooking[]>({
    queryKey: ['parkingBookings'],
    queryFn: async () => {
      const { data } = await api.get('/parking/my-bookings');
      return data;
    },
  });

  useFocusEffect(
    useCallback(() => {
      refetch().catch(() => {});
    }, [refetch])
  );

  const activeTickets = bookings?.filter(b => b.status === 'ACCEPTED' || b.status === 'REQUESTED') || [];

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
      // Shift to IST for display
      const istShifted = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
      const hours = String(istShifted.getUTCHours()).padStart(2, '0');
      const minutes = String(istShifted.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greet, { color: t.textSecondary }]}>CAMPUS SERVICES</Text>
            <Text style={[styles.title, { color: t.textPrimary }]}>Explore Services</Text>
          </View>
          <View style={[styles.compassIcon, { backgroundColor: t.muted }]}>
            <Compass color={t.accent} size={22} strokeWidth={2} />
          </View>
        </View>

        {/* 1. Parking Hub - Primary Card */}
        <View style={[styles.card, { backgroundColor: isDark ? t.surface : '#FFFFFF', borderColor: t.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: isDark ? '#142E58' : '#E8FBF9' }]}>
              <ExploreParkingIcon color={isDark ? '#00D4BC' : '#0F2240'} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Campus Parking Hub</Text>
              <Text style={[styles.cardTag, { color: isDark ? '#00D4BC' : '#0F2240', backgroundColor: isDark ? 'rgba(0,212,188,0.1)' : '#CCF7F3' }]}>
                ACTIVE SERVICE
              </Text>
            </View>
          </View>

          <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
            Reserve parking slots on campus. Book daily, hourly, weekly or monthly passes in advance, view real-time grid availability, and navigate directly to your reserved spot.
          </Text>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { tap(); router.push('/parking'); }}
              style={[styles.primaryActionBtn, { backgroundColor: t.primary }]}
            >
              <Text style={[styles.primaryActionBtnText, { color: t.primaryContrast }]}>Book a Spot</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => { tap(); router.push('/parking/manage'); }}
              style={[styles.secondaryActionBtn, { borderColor: t.border }]}
            >
              <Text style={[styles.secondaryActionBtnText, { color: t.textPrimary }]}>Manage My Spots</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Active Passes Section */}
        {activeTickets.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Active Parking Passes</Text>
            <View style={{ gap: 12, marginTop: spacing.md }}>
              {activeTickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  activeOpacity={0.85}
                  onPress={() => { tap(); router.push('/parking'); }}
                  style={[styles.ticketCard, { backgroundColor: t.surface, borderColor: t.border }]}
                >
                  <View style={styles.ticketHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ticket color={t.accent} size={18} />
                      <Text style={[styles.ticketSpotName, { color: t.textPrimary }]}>Spot {ticket.spot.spotName}</Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: ticket.status === 'ACCEPTED' ? (isDark ? 'rgba(16,185,129,0.15)' : '#D1FAE5') : (isDark ? 'rgba(245,158,11,0.15)' : '#FEF3C7')
                      }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        {
                          color: ticket.status === 'ACCEPTED' ? (isDark ? '#34D399' : '#065F46') : (isDark ? '#FBBF24' : '#92400E')
                        }
                      ]}>
                        {ticket.status === 'ACCEPTED' ? 'Confirmed' : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.ticketDetails}>
                    <View style={styles.detailItem}>
                      <MapPin color={t.textTertiary} size={12} />
                      <Text style={[styles.detailText, { color: t.textSecondary }]}>Level {ticket.spot.level}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Calendar color={t.textTertiary} size={12} />
                      <Text style={[styles.detailText, { color: t.textSecondary }]}>{formatDate(ticket.date)}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock color={t.textTertiary} size={12} />
                      <Text style={[styles.detailText, { color: t.textSecondary }]}>
                        {ticket.slotType === 'DAILY' ? 'Full Day' : `${formatTime(ticket.startTime)} - ${formatTime(ticket.endTime)}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 3. Upcoming Services Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Coming Soon</Text>
          <View style={{ gap: 12, marginTop: spacing.md }}>
            {/* Interactive map */}
            <View style={[styles.comingSoonCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[styles.csIconContainer, { backgroundColor: isDark ? t.muted : '#eff4ff' }]}>
                <Map color={t.textTertiary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.csTitle, { color: t.textPrimary }]}>Interactive Campus Map</Text>
                  <Text style={styles.csBadge}>MAPS</Text>
                </View>
                <Text style={[styles.csDesc, { color: t.textSecondary }]}>
                  View live locations of carpools, transit shuttles, and track occupancy metrics across campus in real-time.
                </Text>
              </View>
            </View>

            {/* Campus Marketplace */}
            <View style={[styles.comingSoonCard, { backgroundColor: t.surface, borderColor: t.border }]}>
              <View style={[styles.csIconContainer, { backgroundColor: isDark ? t.muted : '#eff4ff' }]}>
                <ShoppingBag color={t.textTertiary} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.csTitle, { color: t.textPrimary }]}>Campus Marketplace</Text>
                  <Text style={styles.csBadge}>SHOPS</Text>
                </View>
                <Text style={[styles.csDesc, { color: t.textSecondary }]}>
                  Explore sustainable products, find student-run stores, food stalls, and rent vehicles on-demand.
                </Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greet: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 2,
  },
  compassIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    marginBottom: spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '700',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
    overflow: 'hidden',
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryActionBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  ticketCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketSpotName: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ticketDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 11,
    fontWeight: '500',
  },
  comingSoonCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    opacity: 0.75,
  },
  csIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  csTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  csBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6AA8C0',
  },
  csDesc: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
});
