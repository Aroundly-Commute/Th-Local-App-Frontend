import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Platform, Animated, PanResponder, Dimensions } from 'react-native';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';
import { ReviewModal } from '../../src/core/components/ReviewModal';

import { RouteMap } from '../../src/modules/commute/components/RouteMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Leaf, Car, MessageCircle, Users, Clock } from 'lucide-react-native';
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

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const SNAP_TOP = 80;
  const SNAP_MIDDLE = SCREEN_HEIGHT * 0.45;
  const SNAP_BOTTOM = SCREEN_HEIGHT - 160;

  const lastPosition = useRef(SNAP_MIDDLE);
  const translateY = useRef(new Animated.Value(SNAP_MIDDLE)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only drag vertically, and ignore minor tremors or horizontal swipes
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        translateY.setOffset(lastPosition.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        const nextValue = lastPosition.current + gestureState.dy;
        if (nextValue >= SNAP_TOP) {
          translateY.setValue(gestureState.dy);
        } else {
          // Clamp at SNAP_TOP
          translateY.setValue(SNAP_TOP - lastPosition.current);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateY.flattenOffset();
        const absolutePos = lastPosition.current + gestureState.dy;

        const distTop = Math.abs(absolutePos - SNAP_TOP);
        const distMiddle = Math.abs(absolutePos - SNAP_MIDDLE);
        const distBottom = Math.abs(absolutePos - SNAP_BOTTOM);

        let target = SNAP_MIDDLE;
        const minVal = Math.min(distTop, distMiddle, distBottom);
        if (minVal === distTop) target = SNAP_TOP;
        else if (minVal === distBottom) target = SNAP_BOTTOM;

        lastPosition.current = target;
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
          mass: 0.6,
        }).start();
      },
    })
  ).current;
  
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
  const parsedFare = params.estimatedFare ? JSON.parse(params.estimatedFare) : null;
  const { user } = useAuth();
  const [booking, setBooking] = useState(false);
  const [showPricingDetails, setShowPricingDetails] = useState(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    peerName: string;
    peerAvatar: string | null;
    rideId: string;
    toUserId: string;
  } | null>(null);

  const { data: ride, refetch: load } = useQuery({
    queryKey: ['ride', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/rides/${id}`);
        AnalyticsService.trackEvent('ride_detail_viewed', {
          ride_id: id,
          driver_name: data.driverName || data.driver_name,
          start_place: data.startPlaceName || data.origin,
          end_place: data.endPlaceName || data.destination,
        }).catch(() => {});
        return data;
      } catch (e: any) {
        errorH();
        AnalyticsService.trackError(e?.response?.data?.message || 'Load Ride Details Failed', false, { ride_id: id }).catch(() => {});
        throw e;
      }
    },
    enabled: !!id,
  });

  const requestedSeats = params.seats ? parseInt(params.seats) : 1;

  const onBook = async () => {
    tap();
    setBooking(true);
    try {
      const payload = {
        seats: requestedSeats,
        riderStartName: params.fromName,
        riderEndName: params.toName,
        riderStartCoords: params.fromLng && params.fromLat ? [Number(params.fromLng), Number(params.fromLat)] : undefined,
        riderEndCoords: params.toLng && params.toLat ? [Number(params.toLng), Number(params.toLat)] : undefined,
        riderStartTime: ride?.startTime
      };

      AnalyticsService.trackEvent('ride_seat_requested', {
        ride_id: id,
        rider_id: user?.id,
        is_custom_path: !!(params.fromLng && params.fromLat) ? 'true' : 'false',
      }).catch(() => {});

      const { data } = await api.post(`/rides/${id}/book`, payload);
      success();
      Alert.alert('Request Sent!', 'Your booking request has been sent. You will be notified once the driver accepts.');
      load(); // refresh to show updated state
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(e?.response?.data?.message || 'Request Seat Failed', false, { ride_id: id }).catch(() => {});
      Alert.alert('Failed', e?.response?.data?.message || e?.response?.data?.detail || 'Try again');
    } finally { setBooking(false); }
  };

  const onAcceptRequest = async (requestId: string) => {
    tap();
    try {
      AnalyticsService.trackEvent('ride_request_accepted', { request_id: requestId, ride_id: id }).catch(() => {});
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'ACCEPTED' });
      success();
      Alert.alert('Request Accepted', 'The passenger has been added to your ride.');
      load(); // refresh
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(e?.response?.data?.message || 'Accept Request Failed', false, { request_id: requestId }).catch(() => {});
      Alert.alert('Error', e?.response?.data?.message || 'Failed to accept request');
    }
  };

  const onRejectRequest = async (requestId: string) => {
    tap();
    try {
      AnalyticsService.trackEvent('ride_request_rejected', { request_id: requestId, ride_id: id }).catch(() => {});
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'REJECTED' });
      success();
      Alert.alert('Request Rejected', 'The request has been declined.');
      load(); // refresh
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(e?.response?.data?.message || 'Reject Request Failed', false, { request_id: requestId }).catch(() => {});
      Alert.alert('Error', e?.response?.data?.message || 'Failed to reject request');
    }
  };

  const onCancelBooking = () => {
    tap();
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking/request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            tap();
            try {
              await api.patch(`/matchmaking/requests/${ride.my_request_id}`, { status: 'CANCELLED' });
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
    setBooking(true);
    try {
      await api.patch(`/matchmaking/requests/${ride.my_request_id}`, { status: 'ACCEPTED' });
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
    setBooking(true);
    try {
      await api.patch(`/matchmaking/requests/${ride.my_request_id}`, { status: 'REJECTED' });
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
              Alert.alert('Withdrawn', 'Your offered ride has been withdrawn.');
              load();
            } catch (e: any) {
              errorH();
              Alert.alert('Error', e?.response?.data?.message || 'Failed to withdraw ride');
            }
          }
        }
      ]
    );
  };

  if (!ride) return (
    <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={t.primary} />
    </View>
  );

  // Determine user's role on this ride
  const driverId = ride.driverId || ride.driver_id;
  const isDriver = user?.id === driverId;
  const passengers: any[] = ride.passengers || [];

  const isCab = ride.vehicleType === 'CAB';
  const firstPassenger = passengers?.[0];

  // Normalize variables for CarPool backend
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
  const isPast = new Date(departureTime) < new Date();
  
  const myFare = ride.my_fare_cents ? ride.my_fare_cents / 100 : null;
  const price = myFare ?? (parsedFare ? parsedFare.finalFare : (ride.chargeCents ? ride.chargeCents / 100 : (ride.price_per_seat ?? 0)));
  
  let origin_lat: number | undefined, origin_lng: number | undefined;
  let dest_lat: number | undefined, dest_lng: number | undefined;

  if (ride.startPointGeoJson) {
    try { const p = JSON.parse(ride.startPointGeoJson); origin_lng = p.coordinates[0]; origin_lat = p.coordinates[1]; } catch {}
  }
  if (ride.endPointGeoJson) {
    try { const p = JSON.parse(ride.endPointGeoJson); dest_lng = p.coordinates[0]; dest_lat = p.coordinates[1]; } catch {}
  }
  
  const co2 = ride.co2_saved_kg ?? 0;
  const dist = ride.distance_km ?? 0;
  const vehicle = isCab ? null : (ride.driver_vehicle || ride.vehicle);
  const time = new Date(departureTime);

  // Rider's own request state
  const myRequestStatus = ride.my_request_status; // 'REQUESTED' | 'ACCEPTED' | undefined
  const myChatId = ride.my_chat_id;

  // What FAB to show
  // - Driver: no FAB (has passenger list below)
  // - Rider with ACCEPTED request: "Chat with Driver"
  // - Rider with REQUESTED (pending): "Awaiting Approval"
  // - Rider with no request: "Book Seat"
  const fabContent = () => {
    if (ride.status === 'CANCELLED') {
      return (
        <View style={[styles.cta, { backgroundColor: t.muted, width: '100%' }]}>
          <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: '700' }}>Ride Cancelled</Text>
        </View>
      );
    }
    if (isPast) {
      if (!isDriver && myRequestStatus === 'ACCEPTED') {
        const hasRated = ride.my_review_rating !== null && ride.my_review_rating !== undefined;
        return (
          <View style={{ width: '100%', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }}>
              {hasRated ? 'Your rating for this driver' : 'Rate this ride'}
            </Text>
            <View style={{ flexDirection: 'row', gap: hasRated ? 4 : 8 }}>
              {hasRated ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    color={i <= ride.my_review_rating ? '#f59e0b' : t.textTertiary}
                    fill={i <= ride.my_review_rating ? '#f59e0b' : 'transparent'}
                    size={20}
                  />
                ))
              ) : (
                [1, 2, 3, 4, 5].map((i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.7}
                    onPress={() => {
                      setReviewTarget({ peerName: dName, peerAvatar: dAvatar, rideId: id, toUserId: driverId });
                      setReviewModalVisible(true);
                    }}
                  >
                    <Star color={t.textTertiary} size={24} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        );
      }
      return (
        <View style={[styles.cta, { backgroundColor: t.muted, width: '100%' }]}>
          <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: '700' }}>Ride Completed</Text>
        </View>
      );
    }
    if (isDriver) {
      if (ride.status !== 'CANCELLED') {
        return (
          <TouchableOpacity
            testID="withdraw-ride"
            onPress={onWithdrawRide}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: '#ef4444', width: '100%' }]}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {isCab ? 'Cancel Match' : 'Withdraw Offered Ride'}
            </Text>
          </TouchableOpacity>
        );
      }
      return null;
    }
    if (myRequestStatus === 'ACCEPTED') {
      return (
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <TouchableOpacity
            testID="chat-driver"
            onPress={() => router.push(`/chat/${encodeURIComponent(myChatId)}?name=${encodeURIComponent(dName)}` as any)}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary, flex: 1 }]}
          >
            <MessageCircle color={t.primaryContrast} size={18} />
            <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="cancel-booking"
            onPress={onCancelBooking}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: '#ef4444', flex: 1 }]}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {isCab ? 'Cancel Match' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    if (myRequestStatus === 'REQUESTED') {
      if ((ride as any).my_request_is_invitation) {
        return (
          <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
            <TouchableOpacity
              testID="accept-invite"
              onPress={onAcceptInvite}
              disabled={booking}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: t.primary, flex: 1 }]}
            >
              {booking ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Accept Offer</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              testID="reject-invite"
              onPress={onRejectInvite}
              disabled={booking}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: '#ef4444', flex: 1 }]}
            >
              {booking ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Reject</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <View style={[styles.cta, { backgroundColor: t.muted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 2 }]}>
            <Clock color={t.textSecondary} size={18} />
            <Text style={{ color: t.textSecondary, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>Awaiting Approval</Text>
          </View>
          <TouchableOpacity
            testID="withdraw-request"
            onPress={onCancelBooking}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: '#ef4444', flex: 1 }]}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              {isCab ? 'Cancel Match' : 'Withdraw'}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    // No request yet
    const isFull = (ride.seatsAvailable ?? 0) <= 0;
    const notEnoughSeats = (ride.seatsAvailable ?? 0) < requestedSeats;

    if (isFull) {
      return (
        <View style={[styles.cta, { backgroundColor: t.muted, width: '100%' }]}>
          <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: '700' }}>Ride is Full</Text>
        </View>
      );
    }

    if (notEnoughSeats) {
      return (
        <View style={[styles.cta, { backgroundColor: t.muted, width: '100%' }]}>
          <Text style={{ color: t.textSecondary, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>
            Not Enough Seats Left (Only {ride.seatsAvailable ?? 0} available)
          </Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        testID="book-ride"
        onPress={onBook}
        disabled={booking}
        activeOpacity={0.85}
        style={[styles.cta, { backgroundColor: t.primary }]}
      >
        {booking ? <ActivityIndicator color={t.primaryContrast} /> : (
          <>
            <MessageCircle color={t.primaryContrast} size={18} />
            <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>
              {`Request ${requestedSeats} ${requestedSeats === 1 ? 'Seat' : 'Seats'} · ₹${Math.round((price || 0) * requestedSeats)}`}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Ride Details" />

      {/* Absolute Map Background */}
      <View style={[StyleSheet.absoluteFillObject, { top: Platform.OS === 'ios' ? 90 : 60 }]}>
        <RouteMap
          origin={{ lat: origin_lat ?? 0, lng: origin_lng ?? 0, name: origin }}
          destination={{ lat: dest_lat ?? 0, lng: dest_lng ?? 0, name: destination }}
          t={t}
          style={{ height: '100%', borderRadius: 0 }}
        />
      </View>

      {/* Draggable Bottom Sheet */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          {
            backgroundColor: t.background,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Drag Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: t.border }]} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Driver card */}
          <View style={[styles.card, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  tap();
                  router.push(`/user/${ride.driverId}` as any);
                }}
                activeOpacity={0.8}
                style={{ borderRadius: 9999, borderWidth: 2, borderColor: '#E5E7EB' }}
              >
                <VerifiedAvatar uri={dAvatar} name={dName} verified={ride.driver_verified || ride.driverVerified} t={t} size={40} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: t.textPrimary }} numberOfLines={1}>{dName}</Text>
                  {ride.driverGender && (
                    <Text style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                      ({ride.driverGender})
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Star color="#FBBF24" size={11} fill="#FBBF24" />
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>{dRating % 1 === 0 ? dRating.toFixed(0) : dRating.toFixed(1)}</Text>
                  <Text style={{ fontSize: 12, color: t.textTertiary }}>·</Text>
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>
                    {ride.seatsAvailable ?? 0} { (ride.seatsAvailable ?? 0) === 1 ? 'seat' : 'seats' } available
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                  {isNaN(time.getTime()) ? '' : time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Clock color={t.textSecondary} size={10} />
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>
                    {isNaN(time.getTime()) ? '--:--' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Route card */}
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                <View style={[styles.dot, { backgroundColor: t.primary }]} />
                <View style={{ width: 2, flex: 1, backgroundColor: t.border, marginVertical: 4 }} />
                <View style={[styles.dot, { backgroundColor: t.error }]} />
              </View>
              <View style={{ flex: 1, gap: 18 }}>
                <View>
                  <Text style={[styles.label, { color: t.textSecondary }]}>PICKUP</Text>
                  <Text style={[styles.loc, { color: t.textPrimary }]}>{origin}</Text>
                  <Text style={[styles.time, { color: t.textSecondary }]}>
                    {isNaN(time.getTime()) ? '???' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.label, { color: t.textSecondary }]}>DROPOFF</Text>
                  <Text style={[styles.loc, { color: t.textPrimary }]}>{destination}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pricing Breakdown Dropdown */}
          {parsedFare && (
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
              <TouchableOpacity 
                onPress={() => { 
                  tap(); 
                  const nextState = !showPricingDetails;
                  setShowPricingDetails(nextState); 
                  if (nextState) {
                    AnalyticsService.trackEvent('price_breakdown_expanded', {
                      ride_id: id,
                      final_fare: parsedFare.finalFare
                    }).catch(() => {});
                  }
                }}
                activeOpacity={0.855}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>🏷️</Text>
                  <Text style={[styles.section, { color: t.textPrimary }]}>Fare Breakdown</Text>
                </View>
                <Text style={{ color: t.primary, fontWeight: '700', fontSize: 13 }}>
                  {showPricingDetails ? 'Hide details' : 'Show details'}
                </Text>
              </TouchableOpacity>
              
              {showPricingDetails && (
                <View style={{ marginTop: 12, gap: 10, borderTopWidth: 1, borderTopColor: t.border, paddingTop: 12 }}>
                  <View style={styles.breakdownRow}>
                    <Text style={{ color: t.textSecondary, fontSize: 13 }}>Base Fare ({parsedFare.vehicleType})</Text>
                    <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>₹{parsedFare.baseFare.toFixed(2)}</Text>
                  </View>
                  {parsedFare.locationPremium > 0 && (
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: t.textSecondary, fontSize: 13 }}>📍 Location NCR Premium</Text>
                      <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>+₹{parsedFare.locationPremium.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={styles.breakdownRow}>
                    <Text style={{ color: t.textSecondary, fontSize: 13 }}>🚗 Distance Fare ({parsedFare.distanceKm} km)</Text>
                    <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>+₹{parsedFare.distanceFare.toFixed(2)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={{ color: t.textSecondary, fontSize: 13 }}>⛽ {parsedFare.fuelType} Fuel Surcharge</Text>
                    <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>+₹{parsedFare.fuelSurcharge.toFixed(2)}</Text>
                  </View>
                  {parsedFare.deviationSurcharge > 0 && (
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: t.textSecondary, fontSize: 13 }}>↩️ detours Detour ({parsedFare.deviationKm} km)</Text>
                      <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600' }}>+₹{parsedFare.deviationSurcharge.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: t.border, paddingTop: 6 }]}>
                    <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '700' }}>Subtotal</Text>
                    <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '700' }}>₹{parsedFare.subtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={{ color: t.success, fontSize: 13, fontWeight: '600' }}>♻️ Pooling Discount (40% off)</Text>
                    <Text style={{ color: t.success, fontSize: 13, fontWeight: '700' }}>-₹{parsedFare.poolingDiscount.toFixed(2)}</Text>
                  </View>
                  {parsedFare.poolingFare > parsedFare.cabCapFare && (
                    <View style={styles.breakdownRow}>
                      <Text style={{ color: t.error, fontSize: 13, fontWeight: '600' }}>🛡️ Private Cab Safety Surcharge Cap</Text>
                      <Text style={{ color: t.error, fontSize: 13, fontWeight: '700' }}>₹{parsedFare.cabCapFare.toFixed(2)}</Text>
                    </View>
                  )}
                  <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: t.border, paddingTop: 6 }]}>
                    <Text style={{ color: t.primary, fontSize: 14, fontWeight: '800' }}>Final Rider Pooling Fare</Text>
                    <Text style={{ color: t.primary, fontSize: 15, fontWeight: '800' }}>₹{parsedFare.finalFare}</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Vehicle */}
          {vehicle && (
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Car color={t.primary} size={18} />
                <Text style={[styles.section, { color: t.textPrimary }]}>Vehicle</Text>
              </View>
              <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 8 }}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </Text>
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>{vehicle.color} · {vehicle.license_plate}</Text>
            </View>
          )}

          {/* Eco badge */}
          <View style={[styles.eco, { backgroundColor: t.isDark ? '#0f1f17' : '#EAF5EC' }]}>
            <Leaf color={t.primary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.primary, fontWeight: '800', fontSize: 14 }}>Eco impact</Text>
              <Text style={{ color: t.primary, fontSize: 12, marginTop: 2 }}>
                {(co2 || 0).toFixed(1)} kg CO₂ avoided · {(dist || 0).toFixed(0)} km route
              </Text>
            </View>
          </View>

          {/* DRIVER or ACCEPTED PASSENGER: Passengers / Booking Requests */}
          {(isDriver || myRequestStatus === 'ACCEPTED') && (
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Users color={t.primary} size={18} />
                <Text style={[styles.section, { color: t.textPrimary }]}>
                  {isCab
                    ? 'Cab Buddy Match'
                    : (isDriver 
                      ? (passengers.length === 0 ? 'No passengers yet' : `Passengers (${passengers.length})`)
                      : `Co-passengers (${passengers.filter(p => p.status === 'ACCEPTED' && p.rider_id !== user?.id).length})`)}
                </Text>
              </View>
              {isDriver && passengers.length === 0 ? (
                <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                  When riders book this ride, they'll appear here.
                </Text>
              ) : !isDriver && passengers.filter(p => p.status === 'ACCEPTED' && p.rider_id !== user?.id).length === 0 ? (
                <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                  No other passengers have joined this ride yet.
                </Text>
              ) : (
                passengers
                  .filter(p => isDriver || (p.status === 'ACCEPTED' && p.rider_id !== user?.id))
                  .map((p: any) => (
                    <View key={p.request_id} style={{ borderWidth: 1, borderColor: t.border, borderRadius: radius.md, padding: 12, marginBottom: 12, backgroundColor: t.surface }}>
                      {/* Top row: Avatar, Name & Fare, Status */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <TouchableOpacity
                          onPress={() => {
                            tap();
                            router.push(`/user/${p.rider_id}` as any);
                          }}
                          activeOpacity={0.8}
                        >
                          <VerifiedAvatar uri={p.rider_avatar} name={p.rider_name} verified={false} t={t} size={40} />
                        </TouchableOpacity>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: t.textPrimary, fontWeight: '600', fontSize: 14 }}>
                            {p.rider_name} • {p.seats ?? 1} {(p.seats ?? 1) === 1 ? 'seat' : 'seats'} • ₹{Math.round((p.fareCents ?? 1000) / 100)}
                          </Text>
                          <Text style={{ color: p.status === 'ACCEPTED' ? t.success : p.status === 'REJECTED' ? t.error : t.warning, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                            {p.status === 'ACCEPTED' ? 'Accepted' : p.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                          </Text>
                        </View>
                      </View>

                      {/* Bottom row: Action Buttons / Ratings (Driver only) */}
                      {isDriver && (
                        isPast && p.status === 'ACCEPTED' ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
                            <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                              {p.my_review_rating !== null && p.my_review_rating !== undefined ? 'Your rating' : 'Rate passenger'}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: p.my_review_rating !== null && p.my_review_rating !== undefined ? 3 : 6 }}>
                              {p.my_review_rating !== null && p.my_review_rating !== undefined ? (
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
                                    onPress={() => {
                                      setReviewTarget({ peerName: p.rider_name, peerAvatar: p.rider_avatar, rideId: id, toUserId: p.rider_id });
                                      setReviewModalVisible(true);
                                    }}
                                  >
                                    <Star color={t.textTertiary} size={18} />
                                  </TouchableOpacity>
                                ))
                              )}
                            </View>
                          </View>
                        ) : (
                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                            {p.status === 'REQUESTED' && !isPast && (
                              <>
                                <TouchableOpacity
                                  onPress={() => onAcceptRequest(p.request_id)}
                                  activeOpacity={0.8}
                                  style={{ backgroundColor: t.success, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, flex: 1, alignItems: 'center' }}
                                >
                                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => onRejectRequest(p.request_id)}
                                  activeOpacity={0.8}
                                  style={{ backgroundColor: t.error, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, flex: 1, alignItems: 'center' }}
                                >
                                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Decline</Text>
                                </TouchableOpacity>
                              </>
                            )}
                            {!isPast && (
                              <TouchableOpacity
                                onPress={() => router.push(`/chat/${encodeURIComponent(p.chat_id)}?name=${encodeURIComponent(p.rider_name)}` as any)}
                                activeOpacity={0.8}
                                style={{ backgroundColor: t.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, flex: p.status === 'REQUESTED' ? 1 : 0 }}
                              >
                                <MessageCircle color="#fff" size={12} />
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Chat</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )
                      )}
                    </View>
                  ))
              )}
            </View>
          )}

          {ride.notes ? (
            <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
              <Text style={[styles.section, { color: t.textPrimary }]}>Notes from driver</Text>
              <Text style={{ color: t.textSecondary, marginTop: 6 }}>{ride.notes}</Text>
            </View>
          ) : null}
          {/* Inline FAB Area */}
          {fabContent() !== null && (
            <View style={{ marginTop: spacing.md, width: '100%', paddingBottom: 20 }}>
              {fabContent()}
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {reviewTarget && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => setReviewModalVisible(false)}
          peerName={reviewTarget.peerName}
          peerAvatar={reviewTarget.peerAvatar}
          rideId={reviewTarget.rideId}
          toUserId={reviewTarget.toUserId}
          onSubmitSuccess={() => {
            load().catch(() => {});
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 12, left: 12, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  handleContainer: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  driver: { fontSize: 18, fontWeight: '800' },
  price: { fontSize: 24, fontWeight: '800' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  loc: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  time: { fontSize: 13, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700' },
  eco: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.md },
  sheetFab: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  cta: { flex: 1, height: 54, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
