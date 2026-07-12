import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, RefreshControl, Platform, ActivityIndicator, Modal, TextInput, Linking } from 'react-native';

import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Clock, MessageCircle, Phone, Star, CheckCircle2, Car, AlertCircle, Users, RefreshCw } from 'lucide-react-native';
import { api } from '../../../core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../../core/theme/theme';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';
import { Shimmer } from '../../../core/components/Shimmer';
import { tap, success, errorH } from '../../../core/utils/haptics';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';
import { Alert } from '../../../core/components/CustomAlert';
import { ReviewModal } from '../../../core/components/ReviewModal';

export function MyRidesScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'upcoming' | 'requested' | 'past'>(params.tab === 'requested' ? 'requested' : 'upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [limit, setLimit] = useState(10);
  const hasInitialFetched = useRef(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    peerName: string;
    peerAvatar: string | null;
    rideId: string;
    toUserId: string;
  } | null>(null);

  // OTP Verification Modal
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpTargetRequest, setOtpTargetRequest] = useState<any>(null); // { request_id: string, isCab: boolean, ride: any }
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Cab Apps Selection Modal
  const [cabLauncherModalVisible, setCabLauncherModalVisible] = useState(false);
  const [cabLauncherTargetRide, setCabLauncherTargetRide] = useState<any>(null);

  // Cab Fare Input Modal
  const [cabFareModalVisible, setCabFareModalVisible] = useState(false);
  const [cabFareValue, setCabFareValue] = useState('');
  const [fareTargetRequest, setFareTargetRequest] = useState<any>(null);
  const [submittingFare, setSubmittingFare] = useState(false);

  // Final Price / Split Display Modal
  const [fareSplitDetails, setFareSplitDetails] = useState<any>(null);

  const handleStartRide = (rideOrRequest: any) => {
    const reqId = rideOrRequest.request_id || rideOrRequest.id;
    const isCab = rideOrRequest.vehicle_type === 'CAB' || rideOrRequest.vehicleType === 'CAB';
    setOtpTargetRequest({
      request_id: reqId,
      isCab,
      ride: rideOrRequest
    });
    setOtpValue('');
    setOtpError('');
    setOtpModalVisible(true);
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length < 4) {
      setOtpError('Please enter a valid 4-digit OTP');
      return;
    }
    setVerifyingOtp(true);
    setOtpError('');
    try {
      await api.patch(`/matchmaking/requests/${otpTargetRequest.request_id}/start`, { otp: otpValue });
      success();
      setOtpModalVisible(false);
      
      await refresh();

      if (otpTargetRequest.isCab) {
        setCabLauncherTargetRide(otpTargetRequest.ride);
        setCabLauncherModalVisible(true);
      } else {
        Alert.alert('Started', 'Ride started successfully!');
      }
    } catch (err: any) {
      errorH();
      setOtpError(err?.response?.data?.message || 'Verification failed. Invalid OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLaunchCabApp = async (app: 'uber' | 'ola' | 'rapido') => {
    tap();
    setCabLauncherModalVisible(false);
    const ride = cabLauncherTargetRide;
    if (!ride) return;

    let url = '';
    if (app === 'uber') {
      url = `uber://?action=setPickup&pickup=my_location`;
    } else if (app === 'ola') {
      url = `olacabs://app/launch`;
    } else {
      url = `rapido://`;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        if (app === 'uber') {
          await Linking.openURL('https://m.uber.com');
        } else if (app === 'ola') {
          await Linking.openURL('https://www.olacabs.com');
        } else {
          await Linking.openURL('https://www.rapido.bike');
        }
      }
    } catch (e) {
      if (app === 'uber') {
        Linking.openURL('https://m.uber.com');
      } else if (app === 'ola') {
        Linking.openURL('https://www.olacabs.com');
      } else {
        Linking.openURL('https://www.rapido.bike');
      }
    }
  };

  const handleCompleteRide = (rideOrRequest: any) => {
    const isCab = rideOrRequest.vehicle_type === 'CAB' || rideOrRequest.vehicleType === 'CAB';
    if (isCab) {
      setFareTargetRequest(rideOrRequest);
      setCabFareValue('');
      setCabFareModalVisible(true);
    } else {
      submitCompleteRide(rideOrRequest.request_id, undefined, false);
    }
  };

  const submitCompleteRide = async (requestId: string, actualFare?: number, isCab?: boolean) => {
    if (isCab) {
      setSubmittingFare(true);
    }
    try {
      const { data } = await api.patch(`/matchmaking/requests/${requestId}/complete`, { actualFare });
      success();
      
      if (isCab) {
        setCabFareModalVisible(false);
        setFareSplitDetails({
          visible: true,
          isCab: true,
          fare: actualFare,
          riderShare: data.riderShare,
          driverShare: data.driverShare,
          riderName: data.rider?.name || 'Passenger'
        });
      } else {
        setFareSplitDetails({
          visible: true,
          isCab: false,
          fare: data.price_per_seat || data.fareCents / 100 || 10
        });
      }

      await refresh();
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to complete ride');
    } finally {
      if (isCab) {
        setSubmittingFare(false);
      }
    }
  };

  // Dynamic cache key that depends on the pagination limit
  const { data: res, isLoading: cacheLoading, refetch: refresh } = useQuery({
    queryKey: ['rides', 'my', limit],
    queryFn: async () => {
      const { data } = await api.get(`/rides/my?page=1&limit=${limit}`);
      return data;
    }
  });

  const upcomingList = res?.upcoming || [];
  const requestedList = res?.requested || [];
  const pastList = res?.past || [];

  const totalUpcomingCount = res?.totalUpcomingCount ?? upcomingList.length;
  const totalRequestedCount = res?.totalRequestedCount ?? requestedList.length;
  const totalPastCount = res?.totalPastCount ?? pastList.length;

  const hasMore = tab === 'upcoming' ? res?.hasMoreUpcoming : tab === 'requested' ? res?.hasMoreRequested : res?.hasMorePast;

  const loading = cacheLoading && !res;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {} finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetched.current) {
        refresh().catch(() => {});
      } else {
        hasInitialFetched.current = true;
      }
    }, [refresh])
  );

  const list = tab === 'upcoming' ? upcomingList : tab === 'requested' ? requestedList : pastList;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader 
        title="My Rides" 
        rightComponent={Platform.OS === 'web' ? (
          <TouchableOpacity 
            onPress={handleRefresh} 
            disabled={refreshing}
            activeOpacity={0.7} 
            style={{ 
              padding: 6, 
              borderRadius: 18, 
              backgroundColor: t.muted,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={t.primary} />
            ) : (
              <RefreshCw color={t.textPrimary} size={14} />
            )}
          </TouchableOpacity>
        ) : undefined}
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 12 }}>
        <View style={[styles.tabBar, { backgroundColor: t.muted }]}>
          <TabBtn testID="tab-upcoming" label="Upcoming" count={totalUpcomingCount}
            active={tab === 'upcoming'} t={t} onPress={() => { tap(); setTab('upcoming'); }} />
          <TabBtn testID="tab-requested" label="Requests" count={totalRequestedCount}
            active={tab === 'requested'} t={t} onPress={() => { tap(); setTab('requested'); }} />
          <TabBtn testID="tab-past" label="Past" count={totalPastCount}
            active={tab === 'past'} t={t} onPress={() => { tap(); setTab('past'); }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140, gap: 12 }}
        refreshControl={Platform.OS !== 'web' ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.textPrimary} /> : undefined}
      >
        {loading ? (
          <>
            <Shimmer style={{ height: 170, borderRadius: radius.lg }} />
            <Shimmer style={{ height: 170, borderRadius: radius.lg }} />
          </>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Car color={t.textTertiary} size={42} />
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
              {tab === 'upcoming' ? 'No upcoming rides' : tab === 'requested' ? 'No pending requests' : 'No past rides'}
            </Text>
            <Text style={[styles.emptyHint, { color: t.textSecondary }]}>
              {tab === 'upcoming' ? 'Book a ride or offer one to get started'
                : tab === 'requested' ? 'When you request a ride it will appear here'
                : 'Your ride history will appear here'}
            </Text>
            {tab === 'upcoming' && (
              <TouchableOpacity testID="empty-cta" onPress={() => { tap(); router.push({ pathname: '/commute/search' as any, params: { mode: 'find', hideTabs: 'true' } }); }}
                activeOpacity={0.8} style={[styles.emptyCta, { backgroundColor: t.primary }]}>
                <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 14 }}>
                  Find a Ride
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {tab === 'requested' ? (
              <View style={{ gap: 12 }}>
                {list.map((r: any) => (
                  <RideCardExt
                    key={`${r.id}-${r.role}-${r.request_id || ''}`}
                    r={r}
                    t={t}
                    isPast={tab === 'past'}
                    isRequested={tab === 'requested'}
                    isSentRequest={r.section === 'sent'}
                    router={router}
                    onRefresh={refresh}
                    onRatePeer={(peerName, peerAvatar, rideId, toUserId) => {
                      setReviewTarget({ peerName, peerAvatar, rideId, toUserId });
                      setReviewModalVisible(true);
                    }}
                    onStartRide={handleStartRide}
                    onCompleteRide={handleCompleteRide}
                  />
                ))}
              </View>
            ) : (
              list.map((r: any) => (
                <RideCardExt
                  key={`${r.id}-${r.role}-${r.request_id || ''}`}
                  r={r}
                  t={t}
                  isPast={tab === 'past'}
                  isRequested={tab === 'requested'}
                  router={router}
                  onRefresh={refresh}
                  onRatePeer={(peerName, peerAvatar, rideId, toUserId) => {
                    setReviewTarget({ peerName, peerAvatar, rideId, toUserId });
                    setReviewModalVisible(true);
                  }}
                  onStartRide={handleStartRide}
                  onCompleteRide={handleCompleteRide}
                />
              ))
            )}
            {hasMore && (
              <TouchableOpacity
                onPress={() => { tap(); setLimit(prev => prev + 10); }}
                activeOpacity={0.8}
                style={[styles.showMoreBtn, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <Text style={[styles.showMoreText, { color: t.textPrimary }]}>Show More</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {reviewTarget && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          peerName={reviewTarget.peerName}
          peerAvatar={reviewTarget.peerAvatar}
          rideId={reviewTarget.rideId}
          toUserId={reviewTarget.toUserId}
          onSubmitSuccess={() => {
            refresh().catch(() => {});
          }}
        />
      )}

      {/* OTP Verification Modal */}
      <Modal visible={otpModalVisible} transparent animationType="fade" onRequestClose={() => setOtpModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Enter Start OTP</Text>
            <Text style={[styles.modalSub, { color: t.textSecondary }]}>
              {otpTargetRequest?.ride?.role === 'driver'
                ? `Enter the 4-digit OTP shown on ${otpTargetRequest?.ride?.passenger_name || 'passenger'}'s screen.\n(Passenger's OTP: ${otpTargetRequest?.ride?.otp || '—'})`
                : `Your OTP is: ${otpTargetRequest?.ride?.otp || '—'}.\nShare this with the driver, or enter it below to verify.`}
            </Text>

            <TextInput
              style={[styles.otpInput, { color: t.textPrimary, borderColor: t.border }]}
              keyboardType="numeric"
              maxLength={4}
              value={otpValue}
              onChangeText={setOtpValue}
              placeholder="0000"
              placeholderTextColor={t.textTertiary}
            />

            {otpError ? <Text style={styles.errorText}>{otpError}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setOtpModalVisible(false)}
                style={[styles.modalBtn, { borderColor: t.border }]}
              >
                <Text style={{ color: t.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={verifyingOtp}
                style={[styles.modalBtn, { backgroundColor: t.primary, borderColor: t.primary }]}
              >
                {verifyingOtp ? (
                  <ActivityIndicator color={t.primaryContrast} size="small" />
                ) : (
                  <Text style={{ color: t.primaryContrast, fontWeight: '700' }}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cab Apps Selection Modal */}
      <Modal visible={cabLauncherModalVisible} transparent animationType="fade" onRequestClose={() => setCabLauncherModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Choose Cab App</Text>
            <Text style={[styles.modalSub, { color: t.textSecondary }]}>
              Select one of the cab apps below to book/launch your ride.
            </Text>

            <View style={{ gap: 10, marginVertical: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={() => handleLaunchCabApp('uber')}
                style={[styles.cabAppBtn, { backgroundColor: '#000000' }]}
              >
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>UBER</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleLaunchCabApp('ola')}
                style={[styles.cabAppBtn, { backgroundColor: '#a6c307' }]}
              >
                <Text style={{ color: '#000000', fontWeight: '700' }}>OLA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleLaunchCabApp('rapido')}
                style={[styles.cabAppBtn, { backgroundColor: '#ffd700' }]}
              >
                <Text style={{ color: '#000000', fontWeight: '700' }}>Rapido</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setCabLauncherModalVisible(false)}
              style={[styles.modalBtn, { width: '100%', borderColor: t.border, marginTop: 8 }]}
            >
              <Text style={{ color: t.textSecondary, fontWeight: '600', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cab Fare Input Modal */}
      <Modal visible={cabFareModalVisible} transparent animationType="fade" onRequestClose={() => setCabFareModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Enter Cab Fare</Text>
            <Text style={[styles.modalSub, { color: t.textSecondary }]}>
              Please enter the total fare amount shown in your cab app (OLA/UBER/Rapido) to calculate the split.
            </Text>

            <TextInput
              style={[styles.otpInput, { color: t.textPrimary, borderColor: t.border }]}
              keyboardType="numeric"
              value={cabFareValue}
              onChangeText={setCabFareValue}
              placeholder="₹ Enter total amount"
              placeholderTextColor={t.textTertiary}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setCabFareModalVisible(false)}
                style={[styles.modalBtn, { borderColor: t.border }]}
              >
                <Text style={{ color: t.textSecondary, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const amt = parseFloat(cabFareValue);
                  if (isNaN(amt) || amt <= 0) {
                    Alert.alert('Error', 'Please enter a valid fare amount');
                    return;
                  }
                  submitCompleteRide(fareTargetRequest.request_id, amt, true);
                }}
                disabled={submittingFare}
                style={[styles.modalBtn, { backgroundColor: t.primary, borderColor: t.primary }]}
              >
                {submittingFare ? (
                  <ActivityIndicator color={t.primaryContrast} size="small" />
                ) : (
                  <Text style={{ color: t.primaryContrast, fontWeight: '700' }}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Final Split Display Modal */}
      <Modal visible={!!fareSplitDetails} transparent animationType="fade" onRequestClose={() => setFareSplitDetails(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Ride Completed!</Text>
            
            {fareSplitDetails?.isCab ? (
              <View style={{ width: '100%', marginVertical: 12, gap: 10 }}>
                <Text style={{ color: t.textSecondary, fontSize: 13, textAlign: 'center' }}>
                  The total fare has been split proportionally based on your travel distances:
                </Text>
                <View style={{ backgroundColor: t.muted, padding: 12, borderRadius: radius.md, gap: 8, width: '100%' }}>
                  <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 15 }}>
                    Total Cab Fare: <Text style={{ color: t.primary }}>₹{fareSplitDetails.fare}</Text>
                  </Text>
                  <View style={{ height: 1, backgroundColor: t.border }} />
                  <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>
                    User A (Poster) share: <Text style={{ fontWeight: '700' }}>₹{fareSplitDetails.driverShare}</Text>
                  </Text>
                  <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>
                    {fareSplitDetails.riderName} (Rider) share: <Text style={{ fontWeight: '700' }}>₹{fareSplitDetails.riderShare}</Text>
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ width: '100%', marginVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: t.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
                  Thank you for riding!
                </Text>
                <View style={{ backgroundColor: t.muted, padding: 16, borderRadius: radius.md, alignItems: 'center', width: '100%' }}>
                  <Text style={{ color: t.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>Amount Payable</Text>
                  <Text style={{ color: t.primary, fontWeight: '800', fontSize: 28, marginTop: 4 }}>₹{fareSplitDetails?.fare}</Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setFareSplitDetails(null)}
              style={[styles.modalBtn, { width: '100%', backgroundColor: t.primary, borderColor: t.primary, marginTop: 12 }]}
            >
              <Text style={{ color: t.primaryContrast, fontWeight: '700', textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const RideCardExt: React.FC<{
  r: any;
  t: Theme;
  isPast: boolean;
  isRequested: boolean;
  isSentRequest?: boolean;
  router: any;
  onRefresh: () => void;
  onRatePeer: (peerName: string, peerAvatar: string | null, rideId: string, toUserId: string) => void;
  onStartRide: (r: any) => void;
  onCompleteRide: (r: any) => void;
}> = ({ r, t, isPast, isRequested, isSentRequest, router, onRefresh, onRatePeer, onStartRide, onCompleteRide }) => {
  const date = new Date(r.departure_time);
  const dateStr = isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
  const timeStr = isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  const isDriver = r.role === 'driver';
  const isCab = r.vehicle_type === 'CAB' || r.vehicleType === 'CAB';

  // Determine if this ride request/match is confirmed
  const isConfirmed = r.isConfirmed || (!isRequested && !isPast && (r.status === 'ACCEPTED' || r.request_status === 'ACCEPTED' || r.request_status === 'STARTED'));

  // Status Label
  let statusLabel = 'Pending';
  if (r.status === 'CANCELLED' || r.request_status === 'CANCELLED') {
    statusLabel = 'Cancelled';
  } else if (isPast) {
    statusLabel = (r.request_status === 'REQUESTED' || r.request_status === 'OPEN' || r.status === 'OPEN' || r.status === 'REQUESTED') ? 'Expired' : 'Completed';
  } else if (isRequested) {
    statusLabel = isSentRequest ? (r.isBuddyRequest ? 'Open' : 'Requested') : 'Pending';
  } else {
    // Upcoming Tab
    statusLabel = isConfirmed ? 'Confirmed' : (isDriver ? 'Offered' : 'Requested');
  }

  const statusColor = statusLabel === 'Cancelled' ? '#ef4444' : (isPast ? t.textSecondary : (statusLabel === 'Confirmed' ? t.success : t.warning));
  const statusBg = statusLabel === 'Cancelled' ? (t.isDark ? '#3d1616' : '#fef2f2') : (isPast ? t.muted : (statusLabel === 'Confirmed' ? t.successBg : (t.isDark ? '#2a2010' : '#fff8e1')));

  // Chat: driver -> first passenger chat, rider -> their own chat with driver
  const chatId = r.chat_id;

  // Decide user info display (unconfirmed upcoming/past: hide user details)
  const showUserInfo = (isRequested || isConfirmed) && statusLabel !== 'Expired' && statusLabel !== 'Cancelled';
  // Decide price info display (hide price for cab buddy request/share request, or when unconfirmed upcoming)
  const showPriceInfo = (isConfirmed || isRequested) && !isCab && !r.isBuddyRequest && statusLabel !== 'Expired' && statusLabel !== 'Cancelled';

  const avatarUri = showUserInfo
    ? (isConfirmed ? r.peer_avatar : (isCab ? r.peer_avatar : (isDriver && isRequested ? r.peer_avatar : r.driver_avatar)))
    : null;
  const avatarName = showUserInfo
    ? (isConfirmed ? (r.peer_name || 'Co-Passenger') : (isCab ? (r.peer_name || 'Cab Buddy') : (isDriver && isRequested ? r.peer_name : r.driver_name)))
    : null;
  const targetUserId = showUserInfo
    ? (isConfirmed
        ? (isDriver ? (r.passengers?.[0]?.rider_id || null) : r.driver_id)
        : (isCab ? (isDriver ? (r.passengers?.[0]?.rider_id || r.driver_id) : r.driver_id) : (isDriver && isRequested ? r.rider_id : r.driver_id))
      )
    : null;

  let displayRole = 'Ride Offer';
  if (r.isBuddyRequest || isCab) {
    displayRole = 'Seeking Ride';
  } else if (isDriver) {
    displayRole = 'Ride Offered';
  } else {
    displayRole = 'Seeking Ride';
  }

  const displayName = showUserInfo
    ? (isConfirmed ? (r.peer_name || 'Co-Passenger') : (isCab ? (r.peer_name || 'Cab Buddy') : (isDriver ? (isRequested ? r.peer_name : `${r.driver_name} (You)`) : r.driver_name)))
    : null;
  const displayRating = showUserInfo
    ? (isConfirmed ? (r.peer_rating ?? 5.0) : (isDriver && isRequested ? (r.peer_rating ?? 5.0) : (r.driver_rating ?? 5.0)))
    : null;
  const priceVal = (r.price_per_seat ?? 0).toFixed(0);

  const handleCancelRequest = async (e: any) => {
    e.stopPropagation();
    tap();
    Alert.alert(
      'Cancel Request/Booking',
      'Are you sure you want to cancel this request/booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            tap();
            try {
              await api.patch(`/matchmaking/requests/${r.request_id}`, { status: 'CANCELLED' });
              success();
              Alert.alert('Cancelled', 'Your request/booking has been cancelled.');
              onRefresh();
            } catch (err: any) {
              errorH();
              Alert.alert('Error', err?.response?.data?.message || 'Failed to cancel');
            }
          }
        }
      ]
    );
  };

  const handleCancelBuddyRequest = async (e: any) => {
    e.stopPropagation();
    tap();
    Alert.alert(
      'Withdraw Buddy Request',
      'Are you sure you want to withdraw this buddy request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Withdraw',
          style: 'destructive',
          onPress: async () => {
            tap();
            try {
              await api.patch(`/matchmaking/buddies/${r.id}`, { status: 'CANCELLED' });
              success();
              Alert.alert('Withdrawn', 'Your buddy request has been withdrawn.');
              onRefresh();
            } catch (err: any) {
              errorH();
              Alert.alert('Error', err?.response?.data?.message || 'Failed to withdraw request');
            }
          }
        }
      ]
    );
  };

  const handleCancelRide = async (e: any) => {
    e.stopPropagation();
    tap();
    Alert.alert(
      'Withdraw Offered Ride',
      'Are you sure you want to withdraw this offered ride? All passengers will be notified and cancelled.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Withdraw',
          style: 'destructive',
          onPress: async () => {
            tap();
            try {
              await api.patch(`/rides/${r.id}/status`, { status: 'CANCELLED' });
              success();
              Alert.alert('Withdrawn', 'Your offered ride has been withdrawn.');
              onRefresh();
            } catch (err: any) {
              errorH();
              Alert.alert('Error', err?.response?.data?.message || 'Failed to withdraw ride');
            }
          }
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      testID={`myride-${r.id}`}
      activeOpacity={0.8}
      onPress={() => {
        if (r.isBuddyRequest) {
          router.push(`/buddy/${r.id}`);
        } else {
          router.push(`/ride/${r.id}`);
        }
      }}
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
    >
      {/* Status row */}
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          {isPast && r.request_status !== 'REQUESTED' && r.request_status !== 'OPEN' ? <CheckCircle2 color={statusColor} size={12} />
            : <AlertCircle color={statusColor} size={12} />}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={[styles.role, { color: t.textTertiary }]}>
          {displayRole}
        </Text>
      </View>

      {/* Driver/passenger + price */}
      {showUserInfo && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {targetUserId ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                tap();
                router.push(`/user/${targetUserId}`);
              }}
              activeOpacity={0.8}
            >
              <VerifiedAvatar uri={avatarUri} name={avatarName} verified={isDriver && !r.isBuddyRequest && !isCab && !isRequested} t={t} size={44} />
            </TouchableOpacity>
          ) : (
            <VerifiedAvatar uri={avatarUri} name={avatarName} verified={isDriver && !r.isBuddyRequest && !isCab && !isRequested} t={t} size={44} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: t.textPrimary }]}>
              {displayName}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {r.isBuddyRequest ? (
                <Text style={[styles.meta, { color: t.textSecondary }]}>
                  {r.seats_available} {r.seats_available === 1 ? 'Buddy' : 'Buddies'} Seeking
                </Text>
              ) : (
                <>
                  <Star color={t.warning} size={11} fill={t.warning} />
                  <Text style={[styles.meta, { color: t.textSecondary }]}>{(displayRating ?? 5) % 1 === 0 ? (displayRating ?? 5).toFixed(0) : (displayRating ?? 5).toFixed(1)}</Text>
                  {isDriver && r.passengers?.length > 0 && !isCab && (
                    <>
                      <Text style={[styles.meta, { color: t.textTertiary }]}> · </Text>
                      <Users color={t.textTertiary} size={11} />
                      <Text style={[styles.meta, { color: t.textTertiary }]}>{r.passengers.length} passenger{r.passengers.length > 1 ? 's' : ''}</Text>
                    </>
                  )}
                </>
              )}
            </View>
          </View>
          {showPriceInfo && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: t.textSecondary, marginBottom: 2 }}>
                {isDriver ? "You'll get" : "You pay"}
              </Text>
              <Text style={[styles.price, { color: t.textPrimary }]}>
                ₹{priceVal}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Route */}
      <View style={{ gap: 4 }}>
        <View style={styles.locRow}>
          <View style={[styles.dot, { backgroundColor: t.textPrimary }]} />
          <Text style={[styles.loc, { color: t.textPrimary }]} numberOfLines={1}>{r.origin}</Text>
          <View style={[styles.timePill, { backgroundColor: t.muted }]}>
            <Clock color={t.textSecondary} size={10} />
            <Text style={[styles.timeText, { color: t.textSecondary }]}>{dateStr} · {timeStr}</Text>
          </View>
        </View>
        <View style={[styles.vLine, { backgroundColor: t.border }]} />
        <View style={styles.locRow}>
          <View style={[styles.dot, { borderColor: t.textPrimary, borderWidth: 2, backgroundColor: t.background }]} />
          <Text style={[styles.loc, { color: t.textPrimary }]} numberOfLines={1}>{r.destination}</Text>
        </View>
      </View>

      {/* Confirmed passengers list for Driver (Only in upcoming/active rides) */}
      {isDriver && !isPast && statusLabel !== 'Confirmed' && r.passengers && r.passengers.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12, gap: 8 }}>
          <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Passengers List
          </Text>
          <View style={{ gap: 10 }}>
            {r.passengers.map((p: any) => (
              <View key={p.rider_id} style={{ borderBottomWidth: 0.5, borderBottomColor: t.border, paddingBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      tap();
                      router.push(`/user/${p.rider_id}`);
                    }}
                    activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                  >
                    <VerifiedAvatar uri={p.rider_avatar} name={p.rider_name} verified={false} t={t} size={36} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>{p.rider_name}</Text>
                      <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: '500' }}>Status: {p.status}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {p.chat_id && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          tap();
                          router.push(`/chat/${encodeURIComponent(p.chat_id)}?name=${encodeURIComponent(p.rider_name)}`);
                        }}
                        activeOpacity={0.8}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: t.border,
                          backgroundColor: t.surface
                        }}
                      >
                        <MessageCircle color={t.textPrimary} size={14} />
                      </TouchableOpacity>
                    )}

                    {p.status === 'ACCEPTED' && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          tap();
                          onStartRide({ ...r, request_id: p.request_id, passenger_name: p.rider_name, otp: p.otp });
                        }}
                        activeOpacity={0.8}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: t.primary
                        }}
                      >
                        <Text style={{ color: t.primaryContrast, fontSize: 12, fontWeight: '700' }}>
                          {isCab ? 'Share Cab' : 'Start'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {p.status === 'STARTED' && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          tap();
                          onCompleteRide({ ...r, request_id: p.request_id, passenger_name: p.rider_name });
                        }}
                        activeOpacity={0.8}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          backgroundColor: '#10b981'
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                          Complete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                {p.status === 'ACCEPTED' && p.otp && (
                  <Text style={{ color: t.textSecondary, fontSize: 11, marginTop: 4 }}>
                    Passenger's OTP (ask to verify): <Text style={{ fontWeight: '700', color: t.textPrimary }}>{p.otp}</Text>
                  </Text>
                )}
                
                {p.status === 'COMPLETED' && p.actual_fare && (
                  <View style={{ marginTop: 4, backgroundColor: t.muted, padding: 8, borderRadius: 6 }}>
                    <Text style={{ color: t.textSecondary, fontSize: 11 }}>
                      Total Fare: ₹{p.actual_fare} | Split: You ₹{p.driver_share} · Passenger ₹{p.rider_share}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* OTP Info Box for Rider */}
      {!isRequested && !isDriver && r.request_status === 'ACCEPTED' && r.otp && statusLabel !== 'Confirmed' && (
        <View style={{ backgroundColor: t.isDark ? '#1a2e26' : '#e6f4ea', borderRadius: radius.sm, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Clock color="#137333" size={13} strokeWidth={2.5} />
          <Text style={{ color: '#137333', fontSize: 12, fontWeight: '600', flex: 1 }}>
            Your OTP to start ride: <Text style={{ fontSize: 13, fontWeight: '800' }}>{r.otp}</Text>
          </Text>
        </View>
      )}

      {/* Completed split info display for Rider */}
      {!isRequested && !isDriver && r.request_status === 'COMPLETED' && r.actual_fare && (
        <View style={{ backgroundColor: t.muted, borderRadius: radius.sm, padding: 10, gap: 4, marginTop: 4 }}>
          <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '700' }}>Ride Completed!</Text>
          <Text style={{ color: t.textSecondary, fontSize: 12 }}>
            Total Fare: ₹{r.actual_fare} | Your Share: <Text style={{ fontWeight: '700', color: t.primary }}>₹{r.rider_share}</Text>
          </Text>
        </View>
      )}

      {/* Action buttons */}
      {!isPast && (
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          {/* Upcoming tab unconfirmed - Cancel Ride */}
          {!isRequested && !isConfirmed && (
            <TouchableOpacity
              onPress={isDriver ? handleCancelRide : handleCancelRequest}
              activeOpacity={0.8}
              style={[styles.actionBtn, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', flex: 1 }]}
            >
              <Text style={[styles.actionText, { color: '#ef4444', fontWeight: '700' }]}>
                Cancel Ride
              </Text>
            </TouchableOpacity>
          )}

          {/* Start Ride button for Confirmed rides (both driver and rider) */}
          {!isRequested && isConfirmed && r.status !== 'STARTED' && r.request_status !== 'STARTED' && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                tap();
                router.push(`/ride/${r.id}`);
              }}
              activeOpacity={0.8}
              style={[styles.actionBtn, { backgroundColor: t.primary, borderColor: t.primary, flex: 1 }]}
            >
              <Text style={[styles.actionText, { color: t.primaryContrast, fontWeight: '700' }]}>
                Start Ride
              </Text>
            </TouchableOpacity>
          )}

          {/* Complete Ride (Only for Riders) */}
          {!isRequested && !isDriver && r.request_status === 'STARTED' && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                tap();
                onCompleteRide(r);
              }}
              activeOpacity={0.8}
              style={[styles.actionBtn, { backgroundColor: '#10b981', borderColor: '#10b981', flex: 1 }]}
            >
              <Text style={[styles.actionText, { color: '#ffffff', fontWeight: '700' }]}>
                Complete Ride
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel Match option for Rider */}
          {!isRequested && isConfirmed && !isDriver && r.request_status === 'ACCEPTED' && (
            <TouchableOpacity
              testID={`myride-cancel-${r.id}`}
              onPress={handleCancelRequest}
              activeOpacity={0.8}
              style={[styles.actionBtn, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', flex: 1 }]}
            >
              <Text style={[styles.actionText, { color: '#ef4444', fontWeight: '700' }]}>
                Cancel Match
              </Text>
            </TouchableOpacity>
          )}

          {/* Cancel Match option for Driver */}
          {!isRequested && isConfirmed && isDriver && (r.status === 'OPEN' || r.status === 'REQUESTED' || r.status === 'ACCEPTED') && (
            <TouchableOpacity
              testID={`myride-withdraw-${r.id}`}
              onPress={handleCancelRide}
              activeOpacity={0.8}
              style={[styles.actionBtn, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)', flex: 1 }]}
            >
              <Text style={[styles.actionText, { color: '#ef4444', fontWeight: '700' }]}>
                Cancel Match
              </Text>
            </TouchableOpacity>
          )}

          {/* Requests Tab Actions */}
          {isRequested && (
            isSentRequest ? (
              <>
                {chatId && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      tap();
                      router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(avatarName || 'Buddy')}`);
                    }}
                    activeOpacity={0.8}
                    style={[styles.actionBtn, { borderColor: t.border }]}
                  >
                    <MessageCircle color={t.textPrimary} size={14} />
                    <Text style={[styles.actionText, { color: t.textPrimary }]}>Chat</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={r.isBuddyRequest ? handleCancelBuddyRequest : handleCancelRequest}
                  activeOpacity={0.8}
                  style={[styles.actionBtn, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}
                >
                  <Text style={[styles.actionText, { color: '#ef4444', fontWeight: '700' }]}>
                    Withdraw Request
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {chatId && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      tap();
                      router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(avatarName || 'Buddy')}`);
                    }}
                    activeOpacity={0.8}
                    style={[styles.actionBtn, { borderColor: t.border }]}
                  >
                    <MessageCircle color={t.textPrimary} size={14} />
                    <Text style={[styles.actionText, { color: t.textPrimary }]}>Chat</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={async (e) => {
                    e.stopPropagation();
                    tap();
                    try {
                      await api.patch(`/matchmaking/requests/${r.request_id}`, { status: 'ACCEPTED' });
                      success();
                      Alert.alert('Accepted', isDriver ? 'You have accepted the ride request!' : 'You have accepted the ride offer!');
                      onRefresh();
                    } catch (err: any) {
                      errorH();
                      Alert.alert('Error', err?.response?.data?.message || 'Failed to accept');
                    }
                  }}
                  activeOpacity={0.8}
                  style={[styles.actionBtn, { backgroundColor: t.primary, borderColor: t.primary }]}
                >
                  <Text style={[styles.actionText, { color: t.primaryContrast, fontWeight: '700' }]}>
                    Accept
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async (e) => {
                    e.stopPropagation();
                    tap();
                    try {
                      await api.patch(`/matchmaking/requests/${r.request_id}`, { status: 'REJECTED' });
                      success();
                      Alert.alert('Rejected', isDriver ? 'You have rejected the ride request.' : 'You have rejected the ride offer.');
                      onRefresh();
                    } catch (err: any) {
                      errorH();
                      Alert.alert('Error', err?.response?.data?.message || 'Failed to reject');
                    }
                  }}
                  activeOpacity={0.8}
                  style={[styles.actionBtn, { borderColor: '#ef4444' }]}
                >
                  <Text style={[styles.actionText, { color: '#ef4444', fontWeight: '700' }]}>
                    Reject
                  </Text>
                </TouchableOpacity>
              </>
            )
          )}
        </View>
      )}

      {/* Pending request hint */}
      {isRequested && (
        <View style={{ backgroundColor: statusBg, borderRadius: radius.sm, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Clock color={statusColor} size={13} strokeWidth={2.5} />
          <Text style={{ color: statusColor, fontSize: 12, fontWeight: '600', flex: 1 }}>
            {isSentRequest ? (r.isBuddyRequest ? 'Looking for a cab buddy' : 'Waiting for approval') : 'Request received. Please accept or reject below.'}
          </Text>
        </View>
      )}

      {isPast && !isDriver && !r.isBuddyRequest && isConfirmed && statusLabel !== 'Cancelled' && statusLabel !== 'Expired' && (
        <View style={[styles.rateBox, { borderTopColor: t.border }]}>
          <Text style={{ color: t.textSecondary, fontSize: 12 }}>
            {r.my_review_rating !== null && r.my_review_rating !== undefined ? 'You rated the driver' : 'Rate the driver'}
          </Text>
          <View style={{ flexDirection: 'row', gap: r.my_review_rating !== null && r.my_review_rating !== undefined ? 3 : 6 }}>
            {r.my_review_rating !== null && r.my_review_rating !== undefined ? (
              [1, 2, 3, 4, 5].map((i) => (
                <Star
                   key={i}
                   color={i <= r.my_review_rating ? '#f59e0b' : t.textTertiary}
                   fill={i <= r.my_review_rating ? '#f59e0b' : 'transparent'}
                   size={16}
                />
              ))
            ) : (
              [1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                   key={i}
                   activeOpacity={0.7}
                   onPress={(e) => {
                     e.stopPropagation();
                     tap();
                     onRatePeer(r.driver_name, r.driver_avatar, r.id, r.driver_id);
                   }}
                >
                  <Star color={t.textTertiary} size={18} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      )}

      {isPast && isDriver && statusLabel !== 'Cancelled' && statusLabel !== 'Expired' && r.passengers && r.passengers.length > 0 && (
        <View style={{ borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12, gap: 8 }}>
          <Text style={{ color: t.textSecondary, fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Rate Passengers
          </Text>
          <View style={{ gap: 8 }}>
            {r.passengers.map((p: any) => {
              const hasRated = p.my_review_rating !== null && p.my_review_rating !== undefined;
              return (
                <View key={p.rider_id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '500' }}>{p.rider_name}</Text>
                  <View style={{ flexDirection: 'row', gap: hasRated ? 3 : 6 }}>
                    {hasRated ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          color={i <= p.my_review_rating ? '#f59e0b' : t.textTertiary}
                          fill={i <= p.my_review_rating ? '#f59e0b' : 'transparent'}
                          size={14}
                        />
                      ))
                    ) : (
                      [1, 2, 3, 4, 5].map((i) => (
                        <TouchableOpacity
                          key={i}
                          activeOpacity={0.7}
                          onPress={(e) => {
                            e.stopPropagation();
                            tap();
                            onRatePeer(p.rider_name, p.rider_avatar, r.id, p.rider_id);
                          }}
                        >
                          <Star color={t.textTertiary} size={16} />
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const TabBtn: React.FC<{ label: string; active: boolean; count: number; t: Theme; onPress: () => void; testID?: string }>
  = ({ label, active, count, t, onPress, testID }) => (
  <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8}
    style={[styles.tabBtn, active && { backgroundColor: t.background }]}>
    <Text style={[styles.tabBtnText, { color: active ? t.textPrimary : t.textSecondary, fontWeight: active ? '700' : '500' }]}>
      {label}
    </Text>
    {count > 0 ? (
      <View style={[styles.tabBadge, { backgroundColor: active ? t.textPrimary : t.border }]}>
        <Text style={[styles.tabBadgeText, { color: active ? t.background : t.textSecondary }]}>{count}</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: radius.md, gap: 2, marginBottom: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm + 2 },
  tabBtnText: { fontSize: 13 },
  tabBadge: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999, alignItems: 'center' },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },
  card: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  statusText: { fontSize: 11, fontWeight: '700' },
  role: { fontSize: 11, fontWeight: '500' },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12 },
  price: { fontSize: 17, fontWeight: '700' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  vLine: { width: 2, height: 14, marginLeft: 3 },
  loc: { flex: 1, fontSize: 13, fontWeight: '500' },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  timeText: { fontSize: 11, fontWeight: '600' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: '600' },
  rateBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  empty: { alignItems: 'center', padding: 40, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  emptyCta: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  showMoreBtn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  otpInput: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 14,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabAppBtn: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
