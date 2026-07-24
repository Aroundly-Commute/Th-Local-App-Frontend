import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  Ticket,
  Map,
  Info,
  Users,
  Check,
  X,
  PlusCircle,
  Settings,
  Train,
  Bus,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { api } from '../../../core/api/api';
import { lightTheme, spacing, radius } from '../../../core/theme/theme';
import { tap, success } from '../../../core/utils/haptics';
import { Alert } from '../../../core/components/CustomAlert';
import { useAuth } from '../../../core/auth/auth';

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

type OwnerSpot = {
  id: string;
  spotName: string;
  level: number;
  section: string;
  approved: boolean;
  priceHourly: number;
  priceDaily: number;
};

type IncomingRequest = {
  id: string;
  date: string;
  slotType: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  visitorName: string; // From backend requests list mapping
  user?: {
    name: string;
    phoneNumber: string | null;
  };
  spot: {
    spotName: string;
    level: number;
    section: string;
  };
};

const CommunityParkingIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12.5 3H7v18h3v-6h2.5c3.58 0 6.5-2.92 6.5-6.5S16.08 3 12.5 3zm0 10H10V6h2.5c1.93 0 3.5 1.57 3.5 3.5S14.43 13 12.5 13z" fill={color} />
  </Svg>
);

export default function CommunityScreen() {
  const t = lightTheme;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'seeker' | 'owner'>('seeker');
  const hasInitialFetchedSeeker = useRef(false);
  const hasInitialFetchedOwner = useRef(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Seeker query: Bookings made by current user
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = useQuery<MyBooking[]>({
    queryKey: ['parkingBookings'],
    queryFn: async () => {
      const { data } = await api.get('/parking/my-bookings');
      return data;
    },
  });

  // Owner query: Owner spots registered
  const { data: ownerSpots, isLoading: spotsLoading, refetch: refetchSpots } = useQuery<OwnerSpot[]>({
    queryKey: ['ownerSpots'],
    queryFn: async () => {
      const { data } = await api.get('/parking/my-spots');
      return data;
    },
    enabled: activeTab === 'owner',
  });

  // Owner query: Incoming booking requests for owner spots
  const { data: incomingRequests, isLoading: requestsLoading, refetch: refetchRequests } = useQuery<IncomingRequest[]>({
    queryKey: ['incomingRequests'],
    queryFn: async () => {
      const { data } = await api.get('/parking/my-spots/requests');
      return data;
    },
    enabled: activeTab === 'owner',
  });

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'seeker') {
        if (hasInitialFetchedSeeker.current) {
          refetchBookings().catch(() => {});
        } else {
          hasInitialFetchedSeeker.current = true;
        }
      } else {
        if (hasInitialFetchedOwner.current) {
          refetchSpots().catch(() => {});
          refetchRequests().catch(() => {});
        } else {
          hasInitialFetchedOwner.current = true;
        }
      }
    }, [activeTab, refetchBookings, refetchSpots, refetchRequests])
  );

  const activeTickets = bookings?.filter(b => b.status === 'ACCEPTED' || b.status === 'REQUESTED') || [];
  const pendingIncoming = incomingRequests?.filter(r => r.status === 'REQUESTED') || [];

  const handleBookingAction = async (bookingId: string, status: 'ACCEPTED' | 'REJECTED') => {
    tap();
    setActionLoadingId(bookingId);
    try {
      await api.patch(`/parking/bookings/${bookingId}/status`, { status });
      success();
      queryClient.invalidateQueries({ queryKey: ['incomingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['ownerSpots'] });
      refetchRequests();
    } catch (err: any) {
      console.error('[COMMUNITY] Request update failed:', err);
      Alert.alert('Error', err.response?.data?.message || 'Failed to update request status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const d = new Date(timeStr);
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

  const handleParkingNavigation = (targetRoute: string) => {
    tap();
    Alert.alert(
      'Smart Parking Availability',
      'This service is currently available only in selected partner societies and office complexes. Digital layout maps for each society are currently under progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            tap();
            router.push(targetRoute as any);
          },
        },
      ]
    );
  };

  const currentCommunity = user?.society || user?.workplace || null;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header */}
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <Text style={[styles.greet, { color: t.textSecondary }]}>
              {currentCommunity ? currentCommunity.toUpperCase() : 'NEIGHBORHOOD SERVICES'}
            </Text>
            <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={1}>Parking Hub</Text>
          </View>
        </View>

        {/* Custom Segmented Control Tab Switcher */}
        <View style={[styles.tabContainer, { backgroundColor: t.surfaceElevated }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { tap(); setActiveTab('seeker'); }}
            style={[styles.tabButton, activeTab === 'seeker' && styles.activeTabButton]}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'seeker' ? t.textPrimary : t.textSecondary }, activeTab === 'seeker' && styles.activeTabButtonText]}>
              Rent Parking
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => { tap(); setActiveTab('owner'); }}
            style={[styles.tabButton, activeTab === 'owner' && styles.activeTabButton]}
          >
            <Text style={[styles.tabButtonText, { color: activeTab === 'owner' ? t.textPrimary : t.textSecondary }, activeTab === 'owner' && styles.activeTabButtonText]}>
              Share My Spot
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Rent Parking (Seeker) */}
        {activeTab === 'seeker' && (
          <View style={{ gap: spacing.md }}>
            <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: t.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: '#E8FBF9' }]}>
                  <CommunityParkingIcon color="#0F2240" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Book Parking Slot</Text>
                  <Text style={[styles.cardTag, { color: '#0F2240', backgroundColor: '#CCF7F3' }]}>
                    ACTIVE SERVICE
                  </Text>
                </View>
              </View>

              <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
                Rent verified parking spots in your society or office. Secure a slot hourly, daily, weekly, or monthly, review live availability, and navigate to your spot.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleParkingNavigation('/parking/map')}
                style={[styles.primaryActionBtn, { backgroundColor: t.primary }]}
              >
                <Text style={[styles.primaryActionBtnText, { color: t.primaryContrast }]}>Book a Spot Now</Text>
              </TouchableOpacity>
            </View>

            {/* Active Passes Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Active Parking Passes</Text>
              {bookingsLoading ? (
                <ActivityIndicator color={t.primary} style={{ marginTop: spacing.md }} />
              ) : activeTickets.length > 0 ? (
                <View style={{ gap: 12, marginTop: spacing.md }}>
                  {activeTickets.map((ticket) => (
                    <TouchableOpacity
                      key={ticket.id}
                      activeOpacity={0.85}
                      onPress={() => { tap(); router.push(`/parking/ticket/${ticket.id}` as any); }}
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
                            backgroundColor: ticket.status === 'ACCEPTED' ? '#D1FAE5' : '#FEF3C7'
                          }
                        ]}>
                          <Text style={[
                            styles.statusText,
                            {
                              color: ticket.status === 'ACCEPTED' ? '#065F46' : '#92400E'
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
              ) : (
                <Text style={[styles.emptyText, { color: t.textTertiary }]}>No active parking reservations found.</Text>
              )}
            </View>
          </View>
        )}

        {/* Tab 2: Share My Spot (Owner) */}
        {activeTab === 'owner' && (
          <View style={{ gap: spacing.md }}>
            <View style={[styles.card, { backgroundColor: '#FFFFFF', borderColor: t.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIconContainer, { backgroundColor: '#FFFBEB' }]}>
                  <CommunityParkingIcon color="#F59E0B" size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Share Your Parking Spot</Text>
                  <Text style={[styles.cardTag, { color: '#B45309', backgroundColor: '#FEF3C7' }]}>
                    HOSTING ACTIVE
                  </Text>
                </View>
              </View>

              <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
                Earn by sharing your vacant parking spot. Register your spot number, configure default pricing schedules, and manage neighbor booking requests.
              </Text>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleParkingNavigation('/parking/register')}
                  style={[styles.primaryActionBtn, { backgroundColor: t.primary, flex: 1, width: 'auto' }]}
                >
                  <PlusCircle size={16} color={t.primaryContrast} style={{ marginRight: 4 }} />
                  <Text style={[styles.primaryActionBtnText, { color: t.primaryContrast }]}>Register Spot</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleParkingNavigation('/parking/manage')}
                  style={[styles.secondaryActionBtn, { borderColor: t.border }]}
                >
                  <Settings size={16} color={t.textPrimary} style={{ marginRight: 4 }} />
                  <Text style={[styles.secondaryActionBtnText, { color: t.textPrimary }]}>Manage Spot</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Incoming Rent Requests Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Incoming Rental Requests</Text>
              {requestsLoading ? (
                <ActivityIndicator color={t.primary} style={{ marginTop: spacing.md }} />
              ) : pendingIncoming.length > 0 ? (
                <View style={{ gap: 12, marginTop: spacing.md }}>
                  {pendingIncoming.map((reqItem) => (
                    <View
                      key={reqItem.id}
                      style={[styles.requestCard, { backgroundColor: t.surface, borderColor: t.border }]}
                    >
                      <View style={styles.requestHeader}>
                        <View style={{ gap: 2 }}>
                          <Text style={{ fontSize: 13, fontWeight: '700', color: t.textPrimary }}>
                            {reqItem.visitorName || reqItem.user?.name || 'Neighbor'}
                          </Text>
                          <Text style={{ fontSize: 11, color: t.textTertiary }}>
                            Requested Spot {reqItem.spot.spotName} (Level {reqItem.spot.level})
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: t.success }}>
                          ₹{reqItem.price}
                        </Text>
                      </View>

                      <View style={styles.ticketDetails}>
                        <View style={styles.detailItem}>
                          <Calendar color={t.textTertiary} size={12} />
                          <Text style={[styles.detailText, { color: t.textSecondary }]}>{formatDate(reqItem.date)}</Text>
                        </View>
                        <View style={styles.detailItem}>
                          <Clock color={t.textTertiary} size={12} />
                          <Text style={[styles.detailText, { color: t.textSecondary }]}>
                            {reqItem.slotType === 'DAILY' ? 'Full Day' : `${formatTime(reqItem.startTime)} - ${formatTime(reqItem.endTime)}`}
                          </Text>
                        </View>
                      </View>

                      {actionLoadingId === reqItem.id ? (
                        <ActivityIndicator color={t.primary} style={{ marginVertical: 8 }} />
                      ) : (
                        <View style={styles.requestButtons}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleBookingAction(reqItem.id, 'ACCEPTED')}
                            style={[styles.acceptBtn, { backgroundColor: t.success }]}
                          >
                            <Check size={14} color="#FFFFFF" />
                            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>Accept</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => handleBookingAction(reqItem.id, 'REJECTED')}
                            style={[styles.rejectBtn, { borderColor: t.border, backgroundColor: t.surface }]}
                          >
                            <X size={14} color={t.error} />
                            <Text style={{ color: t.textSecondary, fontWeight: '600', fontSize: 12 }}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyText, { color: t.textTertiary }]}>No pending rent requests.</Text>
              )}
            </View>

            {/* My Listed spots Section */}
            <View style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>My Listed Spots</Text>
              {spotsLoading ? (
                <ActivityIndicator color={t.primary} style={{ marginTop: spacing.md }} />
              ) : ownerSpots && ownerSpots.length > 0 ? (
                <View style={{ gap: 10, marginTop: spacing.md }}>
                  {ownerSpots.map((spot) => (
                    <View
                      key={spot.id}
                      style={[styles.spotCard, { backgroundColor: t.surface, borderColor: t.border }]}
                    >
                      <View style={styles.spotInfo}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                          Spot {spot.spotName}
                        </Text>
                        <Text style={{ fontSize: 11, color: t.textSecondary }}>
                          Level {spot.level} ({spot.section})
                        </Text>
                      </View>
                      <View style={[
                        styles.spotBadge,
                        { backgroundColor: spot.approved ? '#D1FAE5' : '#FEF3C7' }
                      ]}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: spot.approved ? '#065F46' : '#92400E' }}>
                          {spot.approved ? 'Active' : 'Pending Verification'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.emptyText, { color: t.textTertiary }]}>You haven't listed any spots yet.</Text>
              )}
            </View>
          </View>
        )}

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
    fontSize: 10,
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
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    borderRadius: radius.pill,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabButtonText: {
    fontWeight: '700',
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
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionContainer: {
    marginTop: spacing.sm,
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
  emptyText: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: spacing.md,
  },
  requestCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rejectBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  spotCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spotInfo: {
    gap: 2,
  },
  spotBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
