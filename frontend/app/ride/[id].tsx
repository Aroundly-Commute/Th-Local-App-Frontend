import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, TextInput } from 'react-native';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';
import { ReviewModal } from '../../src/core/components/ReviewModal';

import { RouteMap } from '../../src/modules/commute/components/RouteMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Leaf, Car, MessageCircle, Clock, Send, KeyRound, CheckCircle2 } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { AnalyticsService } from '../../src/core/services/analytics';

export default function RideDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const params = useLocalSearchParams<{
    id: string;
    fromName?: string;
    toName?: string;
    fromLat?: string;
    fromLng?: string;
    toLat?: string;
    toLng?: string;
    seats?: string;
    estimatedFare?: string;
  }>();

  const id = params.id;
  const { user } = useAuth();
  const [booking, setBooking] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [showPricingDetails, setShowPricingDetails] = useState(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    peerName: string;
    peerAvatar: string | null;
    rideId: string;
    toUserId: string;
  } | null>(null);

  const parsedFare = params.estimatedFare ? JSON.parse(params.estimatedFare) : null;
  const requestedSeats = params.seats ? parseInt(params.seats, 10) : 1;

  const { data: ride, isLoading, refetch: load } = useQuery({
    queryKey: ['ride', id],
    queryFn: async () => {
      const { data } = await api.get(`/rides/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (id) {
      try {
        AnalyticsService?.logScreenView?.('RideDetail', { rideId: id });
      } catch {}
    }
  }, [id]);

  const onBook = async () => {
    tap();
    setBooking(true);
    try {
      const payload = {
        riderStartName: params.fromName || ride?.startPlaceName,
        riderEndName: params.toName || ride?.endPlaceName,
        riderStartCoords: params.fromLng && params.fromLat ? [parseFloat(params.fromLng), parseFloat(params.fromLat)] : undefined,
        riderEndCoords: params.toLng && params.toLat ? [parseFloat(params.toLng), parseFloat(params.toLat)] : undefined,
        seats: requestedSeats,
      };
      await api.post(`/rides/${id}/book`, payload);
      success();
      Alert.alert(
        'Request Sent',
        'Your ride request has been sent successfully! The ride will now appear under your Upcoming Rides tab.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/rides' as any) }]
      );
      load();
    } catch (e: any) {
      errorH();
      Alert.alert('Booking Error', e?.response?.data?.message || 'Failed to send ride request');
    } finally {
      setBooking(false);
    }
  };

  const onCancelBooking = () => {
    tap();
    const requestId = ride?.my_request_id;
    if (!requestId) return;

    Alert.alert(
      'Cancel Request / Booking',
      'Are you sure you want to cancel your request or booking for this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            tap();
            try {
              await api.patch(`/matchmaking/requests/${requestId}`, { status: 'CANCELLED' });
              success();
              Alert.alert('Cancelled', 'Your booking/request has been cancelled.');
              load();
            } catch (e: any) {
              errorH();
              Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  const onAcceptInvite = async () => {
    tap();
    const requestId = ride?.my_request_id;
    if (!requestId) return;
    setBooking(true);
    try {
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'ACCEPTED' });
      success();
      Alert.alert('Accepted', "You have accepted the driver's ride offer!");
      load();
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setBooking(false);
    }
  };

  const onRejectInvite = async () => {
    tap();
    const requestId = ride?.my_request_id;
    if (!requestId) return;
    setBooking(true);
    try {
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'REJECTED' });
      success();
      Alert.alert('Rejected', 'You have rejected the ride offer.');
      load();
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setBooking(false);
    }
  };

  const onWithdrawRide = () => {
    tap();
    Alert.alert(
      'Withdraw Ride',
      'Are you sure you want to withdraw this offered ride? All passengers will be notified and cancelled.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Withdraw',
          style: 'destructive',
          onPress: async () => {
            tap();
            try {
              await api.patch(`/rides/${id}/status`, { status: 'CANCELLED' });
              success();
              Alert.alert('Withdrawn', 'Your ride offer has been withdrawn.');
              router.push('/(tabs)/rides' as any);
            } catch (e: any) {
              errorH();
              Alert.alert('Error', e?.response?.data?.message || 'Failed to withdraw ride');
            }
          }
        }
      ]
    );
  };

  const onVerifyOtpAndStart = async () => {
    const requestId = ride?.my_request_id || ride?.passengers?.[0]?.request_id;
    if (!requestId) {
      Alert.alert('Error', 'No active request found for verification');
      return;
    }
    if (!otpInput || otpInput.trim().length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid 4-digit OTP code.');
      return;
    }
    tap();
    setVerifyingOtp(true);
    try {
      await api.patch(`/matchmaking/requests/${requestId}/start`, { otp: otpInput.trim() });
      success();
      Alert.alert('Ride Started!', 'OTP verified successfully. Have a safe journey!');
      setOtpInput('');
      load();
    } catch (e: any) {
      errorH();
      Alert.alert('Verification Error', e?.response?.data?.message || 'Invalid OTP. Please check with your co-passenger and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onCompleteRide = async () => {
    const requestId = ride?.my_request_id || ride?.passengers?.[0]?.request_id;
    if (!requestId) {
      Alert.alert('Error', 'No active request found to complete');
      return;
    }
    tap();
    Alert.alert(
      'Complete Ride',
      'Are you sure you want to mark this ride as completed?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Complete',
          onPress: async () => {
            tap();
            setBooking(true);
            try {
              await api.patch(`/matchmaking/requests/${requestId}/complete`);
              success();
              Alert.alert('Ride Completed!', 'The ride has been completed and moved to your Past Rides.');
              router.push('/(tabs)/rides' as any);
            } catch (e: any) {
              errorH();
              Alert.alert('Error', e?.response?.data?.message || 'Failed to complete ride');
            } finally {
              setBooking(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading || !ride) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} size="large" />
      </SafeAreaView>
    );
  }

  // Determine user's role on this ride
  const driverId = ride.driverId || ride.driver_id;
  const isDriver = user?.id === driverId;
  const passengers: any[] = ride.passengers || [];
  const isCab = ride.vehicleType === 'CAB';
  const firstPassenger = passengers?.[0];

  const dName = isCab && isDriver && firstPassenger
    ? (firstPassenger.rider_name || 'Cab Buddy')
    : (ride.driverName || ride.driver_name || 'Unknown');
  const dAvatar = isCab && isDriver && firstPassenger
    ? firstPassenger.rider_avatar
    : (ride.driverAvatar || ride.driver_avatar);
  const dRating = isCab && isDriver && firstPassenger
    ? 5.0
    : (ride.driverRating ?? ride.driver_rating ?? 5.0);

  const origin = ride.startPlaceName || ride.origin || 'Unknown';
  const destination = ride.endPlaceName || ride.destination || 'Unknown';
  const departureTime = ride.startTime || ride.departure_time;
  const time = new Date(departureTime);
  const isPast = time < new Date();

  const myRequestStatus = ride.my_request_status;
  const currentStatus = ride.status || 'OPEN';
  const isConfirmed = currentStatus === 'ACCEPTED' || currentStatus === 'STARTED' || currentStatus === 'COMPLETED' || myRequestStatus === 'ACCEPTED' || myRequestStatus === 'STARTED';

  let origin_lat: number | undefined, origin_lng: number | undefined;
  let dest_lat: number | undefined, dest_lng: number | undefined;

  if (ride.startPointGeoJson) {
    try { const p = JSON.parse(ride.startPointGeoJson); origin_lng = p.coordinates[0]; origin_lat = p.coordinates[1]; } catch {}
  }
  if (ride.endPointGeoJson) {
    try { const p = JSON.parse(ride.endPointGeoJson); dest_lng = p.coordinates[0]; dest_lat = p.coordinates[1]; } catch {}
  }

  const dist = ride.distance_km ?? 0;
  const co2 = ride.co2_saved_kg ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Ride Details" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Fixed Top Map */}
        <View style={{ height: 220, width: '100%', borderRadius: radius.lg, overflow: 'hidden', marginVertical: spacing.md, borderWidth: 1, borderColor: t.border }}>
          <RouteMap
            origin={{ lat: origin_lat ?? 0, lng: origin_lng ?? 0, name: origin }}
            destination={{ lat: dest_lat ?? 0, lng: dest_lng ?? 0, name: destination }}
            t={t}
            style={{ height: '100%', width: '100%' }}
          />
        </View>

        {/* Driver / Host Participant Card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                tap();
                router.push(`/user/${ride.driverId}` as any);
              }}
              activeOpacity={0.8}
              style={{ borderRadius: 9999, borderWidth: 2, borderColor: '#E5E7EB' }}
            >
              <VerifiedAvatar uri={dAvatar} name={dName} verified={ride.driver_verified || ride.driverVerified} t={t} size={44} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }} numberOfLines={1}>{dName}</Text>
                {ride.driverGender && (
                  <Text style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                    ({ride.driverGender})
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Star color="#FBBF24" size={12} fill="#FBBF24" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.textSecondary }}>{dRating % 1 === 0 ? dRating.toFixed(0) : dRating.toFixed(1)}</Text>
                <Text style={{ fontSize: 12, color: t.textTertiary }}>·</Text>
                <Text style={{ fontSize: 13, color: t.textSecondary }}>
                  {ride.seatsAvailable ?? 0} {(ride.seatsAvailable ?? 0) === 1 ? 'seat' : 'seats'} available
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                {isNaN(time.getTime()) ? '' : time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Clock color={t.textSecondary} size={11} />
                <Text style={{ fontSize: 12, color: t.textSecondary }}>
                  {isNaN(time.getTime()) ? '--:--' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Route Pickup / Dropoff Card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
              <View style={[styles.dot, { backgroundColor: t.primary }]} />
              <View style={{ width: 2, flex: 1, backgroundColor: t.border, marginVertical: 4 }} />
              <View style={[styles.dot, { backgroundColor: t.error }]} />
            </View>
            <View style={{ flex: 1, gap: 16 }}>
              <View>
                <Text style={[styles.label, { color: t.textSecondary }]}>PICKUP</Text>
                <Text style={[styles.loc, { color: t.textPrimary }]}>{origin}</Text>
              </View>
              <View>
                <Text style={[styles.label, { color: t.textSecondary }]}>DROPOFF</Text>
                <Text style={[styles.loc, { color: t.textPrimary }]}>{destination}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Static OTP Verification Section (For Confirmed & Active Rides) */}
        {isConfirmed && currentStatus !== 'COMPLETED' && (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.primary, borderWidth: 1.5, marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound color={t.primary} size={18} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>Ride Verification & OTP</Text>
              </View>
              <View style={{ backgroundColor: t.successBg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: t.success }}>Confirmed</Text>
              </View>
            </View>

            {ride.my_otp && (
              <View style={{ backgroundColor: t.background, padding: 14, borderRadius: radius.md, marginBottom: 14, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Verification OTP</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: t.primary, letterSpacing: 6 }}>
                    {ride.my_otp}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.textSecondary, fontStyle: 'italic' }}>
                    Share with co-passenger
                  </Text>
                </View>
              </View>
            )}

            {currentStatus === 'ACCEPTED' && (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary }}>Enter Co-Passenger's 4-Digit OTP:</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    value={otpInput}
                    onChangeText={setOtpInput}
                    placeholder="e.g. 4829"
                    placeholderTextColor={t.textTertiary}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={{
                      flex: 1,
                      backgroundColor: t.background,
                      borderWidth: 1,
                      borderColor: t.border,
                      borderRadius: radius.md,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 18,
                      fontWeight: '700',
                      letterSpacing: 4,
                      color: t.textPrimary,
                    }}
                  />
                  <TouchableOpacity
                    onPress={onVerifyOtpAndStart}
                    disabled={verifyingOtp}
                    activeOpacity={0.85}
                    style={{ backgroundColor: t.primary, paddingHorizontal: 18, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' }}
                  >
                    {verifyingOtp ? <ActivityIndicator color={t.primaryContrast} /> : <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 14 }}>Start Ride</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {currentStatus === 'STARTED' && (
              <View style={{ gap: 12, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.successBg, padding: 10, borderRadius: radius.md }}>
                  <CheckCircle2 color={t.success} size={18} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: t.success }}>Ride In Progress</Text>
                </View>
                <TouchableOpacity
                  onPress={onCompleteRide}
                  disabled={booking}
                  activeOpacity={0.85}
                  style={[styles.cta, { backgroundColor: t.primary, width: '100%' }]}
                >
                  {booking ? <ActivityIndicator color={t.primaryContrast} /> : <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Mark Ride Complete</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Environmental & Distance Impact Stats */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Leaf color={t.success} size={18} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>CO₂ Savings</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.success }}>{co2.toFixed(1)} kg</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: t.surface, borderColor: t.border }]}>
        {currentStatus === 'OPEN' && !isDriver && !myRequestStatus && (
          <TouchableOpacity
            onPress={onBook}
            disabled={booking}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary, width: '100%' }]}
          >
            {booking ? <ActivityIndicator color="#fff" /> : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Send color="#fff" size={16} />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Request Ride</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {myRequestStatus === 'REQUESTED' && (
          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
            <View style={[styles.cta, { backgroundColor: t.muted, flex: 2 }]}>
              <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600' }}>Awaiting Approval</Text>
            </View>
            <TouchableOpacity
              onPress={onCancelBooking}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: '#ffffff', borderColor: '#ef4444', borderWidth: 1, flex: 1 }]}
            >
              <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        {isDriver && currentStatus !== 'CANCELLED' && currentStatus !== 'COMPLETED' && (
          <TouchableOpacity
            onPress={onWithdrawRide}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: '#ffffff', borderColor: '#ef4444', borderWidth: 1, width: '100%' }]}
          >
            <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700' }}>Withdraw Ride</Text>
          </TouchableOpacity>
        )}
      </View>

      {reviewTarget && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          onSubmitSuccess={() => {
            setReviewModalVisible(false);
            load();
          }}
          peerName={reviewTarget.peerName}
          peerAvatar={reviewTarget.peerAvatar}
          rideId={reviewTarget.rideId}
          toUserId={reviewTarget.toUserId}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loc: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  cta: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justify: 'center',
  },
});
