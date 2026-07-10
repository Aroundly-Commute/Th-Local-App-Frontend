import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, useColorScheme, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { lightTheme, spacing, radius, verdexColors } from '../../src/core/theme/theme';
import { MessageCircle, Check, X, Clock, Car, MapPin, ArrowRight, Inbox } from 'lucide-react-native';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { useRouter } from 'expo-router';
import { Alert } from '../../src/core/components/CustomAlert';
import { UpcomingRideCard } from '../../src/modules/commute/components/UpcomingRideCard';

export default function RequestsScreen() {
  const t = lightTheme;
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'upcoming' | 'sent' | 'received'>('upcoming');

  // Fetch My Rides (Upcoming)
  const { data: myRidesData, isLoading: loadingMyRides, refetch: refetchMyRides, isRefetching: refetchingMyRides } = useQuery({
    queryKey: ['rides', 'my', 20],
    queryFn: async () => {
      const { data } = await api.get('/rides/my?page=1&limit=20');
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch Sent Requests (Requested by me)
  const { data: sentRequests, isLoading: loadingSent, refetch: refetchSent, isRefetching: refetchingSent } = useQuery({
    queryKey: ['requests', 'sent'],
    queryFn: async () => {
      const { data } = await api.get('/matchmaking/requests');
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch Received Requests (Requests to me)
  const { data: receivedRequests, isLoading: loadingReceived, refetch: refetchReceived, isRefetching: refetchingReceived } = useQuery({
    queryKey: ['requests', 'received'],
    queryFn: async () => {
      const { data } = await api.get('/matchmaking/requests/received');
      return data;
    },
    enabled: !!user?.id,
  });

  // Action Mutation
  const actionMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: string; status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED' }) => {
      const { data } = await api.patch(`/matchmaking/requests/${requestId}`, { status });
      return data;
    },
    onSuccess: () => {
      success();
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
      Alert.alert('Success', 'Request status updated successfully.');
    },
    onError: (err: any) => {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update request.');
    }
  });

  const handleAction = (requestId: string, status: 'ACCEPTED' | 'REJECTED' | 'CANCELLED', title: string, message: string) => {
    tap();
    Alert.alert(
      title,
      message,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => {
            actionMutation.mutate({ requestId, status });
          }
        }
      ]
    );
  };

  const handleChat = (otherUser: any) => {
    tap();
    const sorted = [otherUser.id, user?.id || ''].sort();
    const chatId = `chat_${sorted[0]}_${sorted[1]}`;
    router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(otherUser.name)}` as any);
  };

  const renderRequestCard = ({ item }: { item: any }) => {
    const isSent = activeTab === 'sent';
    const isCab = item.ride?.vehicleType === 'CAB';
    const isInvitation = item.isInvitation;

    // Resolve other party details
    let otherParty: any = null;
    let cardTitle = '';
    
    if (isSent) {
      if (isInvitation) {
        otherParty = item.rider;
        cardTitle = isCab ? 'Cab Match Invite Sent' : 'Carpool Invite Sent';
      } else {
        otherParty = item.ride?.driver;
        cardTitle = 'Carpool Request Sent';
      }
    } else {
      if (isInvitation) {
        otherParty = item.ride?.driver;
        cardTitle = isCab ? 'Incoming Cab Match Invite' : 'Incoming Carpool Invite';
      } else {
        otherParty = item.rider;
        cardTitle = 'Incoming Booking Request';
      }
    }

    const startCity = (item.riderStartName || item.ride?.startPlaceName || '').split(',')[0];
    const endCity = (item.riderEndName || item.ride?.endPlaceName || '').split(',')[0];
    const rawTime = item.riderStartTime || item.ride?.startTime;
    const formattedTime = rawTime
      ? new Date(rawTime).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata'
        })
      : 'N/A';

    return (
      <View style={[styles.card, { borderColor: t.border }]}>
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            {isCab ? (
              <View style={[styles.badgeIcon, { backgroundColor: t.mintBg }]}>
                <Car color={t.primary} size={16} />
              </View>
            ) : (
              <View style={[styles.badgeIcon, { backgroundColor: t.accentBg }]}>
                <Car color={t.accent} size={16} />
              </View>
            )}
            <Text style={[styles.cardTitle, { color: t.textPrimary }]}>{cardTitle}</Text>
          </View>
          <View style={[styles.statusBadge, styles[item.status.toLowerCase() as keyof typeof styles] as any]}>
            <Text style={[styles.statusText, styles[`${item.status.toLowerCase()}Text` as keyof typeof styles] as any]}>
              {item.status === 'REQUESTED' ? 'Pending' : item.status === 'ACCEPTED' ? 'Confirmed' : item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.routeRow}>
            <MapPin color={t.accent} size={16} />
            <Text style={[styles.routeText, { color: t.textPrimary }]} numberOfLines={1}>{startCity}</Text>
            <ArrowRight color={t.textTertiary} size={14} style={{ marginHorizontal: 6 }} />
            <MapPin color={t.error} size={16} />
            <Text style={[styles.routeText, { color: t.textPrimary }]} numberOfLines={1}>{endCity}</Text>
          </View>

          <View style={styles.timeRow}>
            <Clock color={t.textTertiary} size={14} />
            <Text style={[styles.timeText, { color: t.textSecondary }]}>{formattedTime}</Text>
          </View>

          {otherParty && (
            <TouchableOpacity
              onPress={() => {
                tap();
                router.push(`/user/${otherParty.id}` as any);
              }}
              style={[styles.profileRow, { backgroundColor: t.surfaceElevated }]}
            >
              <Image
                source={otherParty.profilePic ? { uri: otherParty.profilePic } : require('../../assets/images/app_Icon.png')}
                style={styles.avatar}
              />
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: t.textPrimary }]}>{otherParty.name}</Text>
                <Text style={[styles.profileSub, { color: t.textSecondary }]}>{isSent ? 'Receiver' : 'Sender'}</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardActions}>
          {item.status === 'REQUESTED' ? (
            isSent ? (
              <TouchableOpacity
                onPress={() => handleAction(
                  item.id,
                  'CANCELLED',
                  'Cancel Request',
                  'Are you sure you want to withdraw this request?'
                )}
                style={[styles.btn, styles.btnCancel, { borderColor: t.border }]}
              >
                <X color={t.error} size={16} />
                <Text style={[styles.btnText, { color: t.error }]}>Withdraw</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.receivedActionRow}>
                <TouchableOpacity
                  onPress={() => handleAction(
                    item.id,
                    'REJECTED',
                    'Reject Request',
                    'Are you sure you want to reject this request?'
                  )}
                  style={[styles.btn, styles.btnReject, { borderColor: t.border }]}
                >
                  <X color={t.error} size={16} />
                  <Text style={[styles.btnText, { color: t.error }]}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleAction(
                    item.id,
                    'ACCEPTED',
                    'Accept Request',
                    'Are you sure you want to accept this request?'
                  )}
                  style={[styles.btn, styles.btnAccept, { backgroundColor: t.primary }]}
                >
                  <Check color={t.primaryContrast} size={16} />
                  <Text style={[styles.btnText, { color: t.primaryContrast }]}>Accept</Text>
                </TouchableOpacity>
              </View>
            )
          ) : (
            item.status === 'ACCEPTED' && otherParty && (
              <TouchableOpacity
                onPress={() => handleChat(otherParty)}
                style={[styles.btn, styles.btnChat, { borderColor: t.border, backgroundColor: t.surfaceElevated }]}
              >
                <MessageCircle color={t.primary} size={16} />
                <Text style={[styles.btnText, { color: t.primary }]}>Chat</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  };
  const hasPendingSent = (sentRequests || []).some((r: any) => r.status === 'REQUESTED');
  const hasPendingReceived = (receivedRequests || []).some((r: any) => r.status === 'REQUESTED');

  const currentList = activeTab === 'upcoming'
    ? (myRidesData?.upcoming || [])
    : (activeTab === 'sent' ? sentRequests : receivedRequests);
  const currentLoading = activeTab === 'upcoming'
    ? loadingMyRides
    : (activeTab === 'sent' ? loadingSent : loadingReceived);
  const currentRefetching = activeTab === 'upcoming'
    ? refetchingMyRides
    : (activeTab === 'sent' ? refetchingSent : refetchingReceived);
  const currentRefetch = activeTab === 'upcoming'
    ? refetchMyRides
    : (activeTab === 'sent' ? refetchSent : refetchReceived);

  const renderItem = ({ item }: { item: any }) => {
    if (activeTab === 'upcoming') {
      return (
        <UpcomingRideCard
          ride={item}
          t={t}
          onPress={() => { tap(); router.push(`/ride/${item.id}` as any); }}
          style={{ marginBottom: spacing.md }}
        />
      );
    }
    return renderRequestCard({ item });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="My Ride" />

      {/* Custom Segmented Control Tab Switcher */}
      <View style={[styles.tabContainer, { backgroundColor: t.surfaceElevated }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { tap(); setActiveTab('upcoming'); }}
          style={[styles.tabButton, activeTab === 'upcoming' && styles.activeTabButton]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'upcoming' ? t.textPrimary : t.textSecondary },
              activeTab === 'upcoming' && styles.activeTabButtonText
            ]}>
              Upcoming Ride
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { tap(); setActiveTab('sent'); }}
          style={[styles.tabButton, activeTab === 'sent' && styles.activeTabButton]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'sent' ? t.textPrimary : t.textSecondary },
              activeTab === 'sent' && styles.activeTabButtonText
            ]}>
              Requested by me
            </Text>
            {hasPendingSent && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { tap(); setActiveTab('received'); }}
          style={[styles.tabButton, activeTab === 'received' && styles.tabActive]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[
              styles.tabButtonText,
              { color: activeTab === 'received' ? t.textPrimary : t.textSecondary },
              activeTab === 'received' && styles.activeTabButtonText
            ]}>
              Requests to me
            </Text>
            {hasPendingReceived && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' }} />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {currentLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={t.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={currentList}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={currentRefetching} onRefresh={currentRefetch} colors={[t.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              {activeTab === 'upcoming' ? (
                <>
                  <Car size={48} color={t.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No Upcoming Rides</Text>
                  <Text style={[styles.emptySub, { color: t.textSecondary }]}>
                    You don't have any confirmed rides scheduled. Find a ride or offer one to get started!
                  </Text>
                </>
              ) : (
                <>
                  <Inbox size={48} color={t.textTertiary} />
                  <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No Requests Found</Text>
                  <Text style={[styles.emptySub, { color: t.textSecondary }]}>
                    {activeTab === 'sent'
                      ? "You haven't requested any rides or buddy pairings yet."
                      : "You haven't received any matching requests from other users."}
                  </Text>
                </>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
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
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  activeTabButtonText: {
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
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
  requested: {
    backgroundColor: lightTheme.warningBg,
  },
  requestedText: {
    color: lightTheme.warning,
  },
  accepted: {
    backgroundColor: lightTheme.successBg,
  },
  acceptedText: {
    color: lightTheme.success,
  },
  rejected: {
    backgroundColor: lightTheme.errorBg,
  },
  rejectedText: {
    color: lightTheme.error,
  },
  cancelled: {
    backgroundColor: lightTheme.errorBg,
  },
  cancelledText: {
    color: lightTheme.error,
  },
  cardBody: {
    gap: 10,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: 8,
    marginTop: 4,
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#cbd5e1',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileSub: {
    fontSize: 11,
    marginTop: 1,
  },
  cardActions: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 19,
    gap: 6,
  },
  btnCancel: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnChat: {
    borderWidth: 1,
  },
  btnReject: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  btnAccept: {
    flex: 1,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  receivedActionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
