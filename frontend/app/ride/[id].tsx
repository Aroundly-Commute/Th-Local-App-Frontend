import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, TextInput, Modal, Linking, Platform, KeyboardAvoidingView } from 'react-native';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';
import { ReviewModal } from '../../src/core/components/ReviewModal';

import { RouteMap } from '../../src/modules/commute/components/RouteMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Leaf, Car, MessageCircle, Clock, Send, KeyRound, CheckCircle2, Info } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { AnalyticsService } from '../../src/core/services/analytics';
import { formatISTDate, formatISTTime } from '../../src/core/utils/datetime';

function parseCoords(geoJson: any, latProp?: any, lngProp?: any, fallbackLatStr?: string, fallbackLngStr?: string) {
  let lat: number | undefined;
  let lng: number | undefined;
  if (geoJson) {
    try {
      const obj = typeof geoJson === 'string' ? JSON.parse(geoJson) : geoJson;
      if (obj && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
        lng = Number(obj.coordinates[0]);
        lat = Number(obj.coordinates[1]);
      }
    } catch {}
  }
  if ((lat === undefined || isNaN(lat)) && latProp !== undefined) lat = Number(latProp);
  if ((lng === undefined || isNaN(lng)) && lngProp !== undefined) lng = Number(lngProp);
  if ((lat === undefined || isNaN(lat)) && fallbackLatStr) lat = parseFloat(fallbackLatStr);
  if ((lng === undefined || isNaN(lng)) && fallbackLngStr) lng = parseFloat(fallbackLngStr);

  return { lat: (lat && !isNaN(lat)) ? lat : undefined, lng: (lng && !isNaN(lng)) ? lng : undefined };
}

export default function RideDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const insets = useSafeAreaInsets();

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

  const [cabLauncherModalVisible, setCabLauncherModalVisible] = useState(false);
  const [availableCabApps, setAvailableCabApps] = useState<{ id: 'uber' | 'ola' | 'rapido'; name: string; bg: string; color: string; url: string; webUrl: string }[]>([]);
  const [checkingApps, setCheckingApps] = useState(false);

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewTarget, setReviewTarget] = useState<{
    peerName: string;
    peerAvatar: string | null;
    rideId: string;
    toUserId: string;
  } | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

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

  const checkInstalledCabApps = async () => {
    setCheckingApps(true);
    const allApps = [
      { id: 'uber' as const, name: 'UBER', bg: '#000000', color: '#ffffff', urls: ['uber://?action=setPickup&pickup=my_location', 'uber://'], webUrl: 'https://m.uber.com' },
      { id: 'ola' as const, name: 'OLA', bg: '#a6c307', color: '#000000', urls: ['olacabs://', 'olacabs://app/launch', 'olacabs://open'], webUrl: 'https://www.olacabs.com' },
      { id: 'rapido' as const, name: 'Rapido', bg: '#ffd700', color: '#000000', urls: ['rapido://', 'rapido://open', 'rapido://home'], webUrl: 'https://www.rapido.bike' },
    ];

    setAvailableCabApps(allApps as any);
    setCheckingApps(false);
  };

  const handleOpenCabModal = async () => {
    tap();
    await checkInstalledCabApps();
    setCabLauncherModalVisible(true);
  };

  const handleLaunchCabApp = async (app: { urls?: string[]; url?: string; webUrl: string }) => {
    tap();
    setCabLauncherModalVisible(false);
    if (Platform.OS !== 'web') {
      const schemeList = app.urls || (app.url ? [app.url] : []);
      for (const schemeUrl of schemeList) {
        try {
          await Linking.openURL(schemeUrl);
          return;
        } catch (e) {
          console.log(`Failed to launch scheme ${schemeUrl}:`, e);
        }
      }
    }
    try {
      await Linking.openURL(app.webUrl);
    } catch {
      Linking.openURL(app.webUrl);
    }
  };

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
      AnalyticsService.trackEvent('ride_booked', { rideId: id, seats: requestedSeats }).catch(() => {});
      Alert.alert(
        'Request Sent',
        'Your ride request has been sent successfully! The ride will now appear under your Upcoming Rides tab.',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/rides' as any) }]
      );
      load();
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(`Book Ride Error: ${e?.message}`, false, { rideId: id }).catch(() => {});
      
      let userMessage = 'Failed to send ride request';
      const errMsg = e?.response?.data?.message || e?.message || '';
      const status = e?.response?.status;
      
      if (status === 500 || errMsg.includes('Prisma') || errMsg.includes('invocation') || errMsg.includes('Raw query') || errMsg.includes('st_linesubstring') || errMsg.includes('SQL')) {
        userMessage = 'An unexpected server error occurred. Please try again later.';
      } else if (e?.response?.data?.message) {
        userMessage = e.response.data.message;
      }
      
      Alert.alert('Booking Error', userMessage);
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
              AnalyticsService.trackEvent('ride_booking_cancelled', { rideId: id, requestId }).catch(() => {});
              Alert.alert('Cancelled', 'Your booking/request has been cancelled.');
              load();
            } catch (e: any) {
              errorH();
              AnalyticsService.trackError(`Cancel Booking Error: ${e?.message}`, false, { rideId: id, requestId }).catch(() => {});
              Alert.alert('Error', e?.response?.data?.message || 'Failed to cancel booking');
            }
          }
        }
      ]
    );
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
              AnalyticsService.trackEvent('ride_withdrawn', { rideId: id }).catch(() => {});
              Alert.alert('Withdrawn', 'Your ride offer has been withdrawn.');
              router.push('/(tabs)/rides' as any);
            } catch (e: any) {
              errorH();
              AnalyticsService.trackError(`Withdraw Ride Error: ${e?.message}`, false, { rideId: id }).catch(() => {});
              Alert.alert('Error', e?.response?.data?.message || 'Failed to withdraw ride');
            }
          }
        }
      ]
    );
  };

  const onVerifyOtp = async (targetReqId?: string) => {
    const requestId = targetReqId || ride?.my_request_id || ride?.passengers?.find((p: any) => p.status === 'ACCEPTED')?.request_id || ride?.passengers?.[0]?.request_id;
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
      await api.patch(`/matchmaking/requests/${requestId}/verify-otp`, { otp: otpInput.trim() });
      await api.patch(`/matchmaking/requests/${requestId}/start-ride`).catch(() => {});
      success();
      AnalyticsService.trackEvent('ride_otp_verified', { rideId: id, requestId }).catch(() => {});
      Alert.alert('OTP Verified!', 'OTP verified successfully! Ride started.');
      setOtpInput('');
      load();
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(`Verify OTP Error: ${e?.message}`, false, { rideId: id, requestId }).catch(() => {});
      Alert.alert('Verification Error', e?.response?.data?.message || 'Invalid OTP. Please check with your co-passenger and try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onStartRideOnly = async (targetReqId?: string) => {
    const requestId = targetReqId || ride?.my_request_id || ride?.passengers?.find((p: any) => p.status === 'ACCEPTED' || p.status === 'STARTED')?.request_id || ride?.passengers?.[0]?.request_id;
    if (!requestId) {
      Alert.alert('Error', 'No active request found to start');
      return;
    }
    tap();
    setBooking(true);
    try {
      await api.patch(`/matchmaking/requests/${requestId}/start-ride`);
      success();
      AnalyticsService.trackEvent('ride_started', { rideId: id, requestId }).catch(() => {});
      if (isCab) {
        handleOpenCabModal();
      } else {
        Alert.alert('Ride Started!', 'Have a safe journey!');
      }
      load();
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(`Start Ride Error: ${e?.message}`, false, { rideId: id, requestId }).catch(() => {});
      Alert.alert('Error', e?.response?.data?.message || 'Failed to start ride');
    } finally {
      setBooking(false);
    }
  };

  const onCompleteRide = async () => {
    const requestId = ride?.my_request_id || ride?.passengers?.find((p: any) => p.status === 'ACCEPTED' || p.status === 'STARTED')?.request_id || ride?.passengers?.[0]?.request_id || ride?.request_id || id;
    if (!requestId || requestId === 'undefined') {
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
  const isCab = ride.vehicleType === 'CAB' || ride.role === 'SEEKING' || ride.ride_role === 'SEEKING';
  const firstPassenger = passengers?.[0];

  const myRequestStatus = ride.my_request_status;
  const currentStatus = ride.status || 'OPEN';
  const hasActivePassenger = passengers.some((p: any) => p.status === 'ACCEPTED' || p.status === 'STARTED');
  const isConfirmed = currentStatus === 'ACCEPTED' || currentStatus === 'STARTED' || currentStatus === 'COMPLETED' || myRequestStatus === 'ACCEPTED' || myRequestStatus === 'STARTED' || hasActivePassenger;

  const otherPassenger = passengers.find((p: any) => p.rider_id && p.rider_id !== user?.id);
  const pendingPassenger = passengers.find((p: any) => p.status === 'REQUESTED');
  const targetPassenger = pendingPassenger || otherPassenger || passengers.find((p: any) => p.rider_id && p.rider_id !== user?.id);

  const isInvitation = Boolean(
    ride?.my_request_is_invitation ||
    ride?.is_invitation ||
    ride?.isInvitation ||
    pendingPassenger?.is_invitation ||
    pendingPassenger?.isInvitation
  );
  const hasPendingRequest = !isConfirmed && (myRequestStatus === 'REQUESTED' || Boolean(pendingPassenger));

  // The user who RECEIVED the request or invitation -> sees Chat, Reject, Accept
  const isRecipientOfRequest = hasPendingRequest && (
    isInvitation ? !isDriver : isDriver
  );

  // The user who SENT the request or invitation -> sees Awaiting Approval (+ Cancel)
  const isSenderOfRequest = hasPendingRequest && (
    isInvitation ? isDriver : !isDriver
  );

  const openChat = (targetUserId?: string, targetUserName?: string, targetChatId?: string) => {
    tap();
    const peerUserId = targetUserId || targetPassenger?.rider_id || ride?.peer_id || (isDriver ? undefined : driverId);
    const peerName = targetUserName || targetPassenger?.rider_name || ride?.peer_name || ride?.driverName || ride?.driver_name || 'User';
    const chatId = targetChatId || targetPassenger?.chat_id || ride?.my_chat_id || (user?.id && peerUserId ? `chat_${[user.id, peerUserId].sort().join('_')}` : '');

    if (chatId) {
      router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(peerName)}` as any);
    } else {
      Alert.alert('Chat Unavailable', 'Cannot start chat with this user at the moment.');
    }
  };

  const onAcceptInvite = async (targetReqId?: string) => {
    tap();
    const requestId = targetReqId || ride?.my_request_id || pendingPassenger?.request_id || ride?.passengers?.find((p: any) => p.status === 'REQUESTED')?.request_id;
    if (!requestId) return;
    setBooking(true);
    try {
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'ACCEPTED' });
      success();
      AnalyticsService.trackEvent('ride_invite_accepted', { rideId: id, requestId }).catch(() => {});
      Alert.alert('Request Accepted', 'You have accepted the ride request!');
      load();
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(`Accept Invite Error: ${e?.message}`, false, { rideId: id, requestId }).catch(() => {});
      Alert.alert('Error', e?.response?.data?.message || 'Failed to accept invitation');
    } finally {
      setBooking(false);
    }
  };

  const onRejectInvite = async (targetReqId?: string) => {
    tap();
    const requestId = targetReqId || ride?.my_request_id || pendingPassenger?.request_id || ride?.passengers?.find((p: any) => p.status === 'REQUESTED')?.request_id;
    if (!requestId) return;
    setBooking(true);
    try {
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'REJECTED' });
      success();
      AnalyticsService.trackEvent('ride_invite_rejected', { rideId: id, requestId }).catch(() => {});
      Alert.alert('Request Rejected', 'You have rejected the ride request.');
      load();
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(`Reject Invite Error: ${e?.message}`, false, { rideId: id, requestId }).catch(() => {});
      Alert.alert('Error', e?.response?.data?.message || 'Failed to reject invitation');
    } finally {
      setBooking(false);
    }
  };

  let displayUserId: string | undefined;
  let dName: string;
  let dAvatar: string | undefined = undefined;
  let dRating: number = 5.0;
  let dGender: string | null = null;
  let dVerified: boolean = false;

  if (isDriver && targetPassenger) {
    displayUserId = targetPassenger.rider_id;
    dName = targetPassenger.rider_name || 'Requestor';
    dAvatar = targetPassenger.rider_avatar || undefined;
    dRating = targetPassenger.rider_rating ?? 5.0;
    dGender = targetPassenger.rider_gender || null;
    dVerified = false;
  } else if (isConfirmed) {
    if (otherPassenger) {
      displayUserId = otherPassenger.rider_id;
      dName = otherPassenger.rider_name || 'Co-Passenger';
      dAvatar = otherPassenger.rider_avatar || undefined;
      dRating = otherPassenger.rider_rating ?? 5.0;
      dGender = otherPassenger.rider_gender || null;
      dVerified = false;
    } else if (ride.peer_name) {
      displayUserId = ride.peer_id;
      dName = ride.peer_name;
      dAvatar = ride.peer_avatar || undefined;
      dRating = ride.peer_rating ?? 5.0;
      dGender = ride.peer_gender || null;
      dVerified = false;
    } else if (!isDriver) {
      displayUserId = driverId;
      dName = ride.driverName || ride.driver_name || 'Driver';
      dAvatar = ride.driverAvatar || ride.driver_avatar || undefined;
      dRating = ride.driverRating ?? ride.driver_rating ?? 5.0;
      dGender = ride.driverGender || null;
      dVerified = ride.driver_verified || ride.driverVerified || false;
    } else {
      displayUserId = driverId;
      dName = ride.driverName || ride.driver_name || 'Unknown';
      dAvatar = ride.driverAvatar || ride.driver_avatar || undefined;
      dRating = ride.driverRating ?? ride.driver_rating ?? 5.0;
      dGender = ride.driverGender || null;
      dVerified = ride.driver_verified || ride.driverVerified || false;
    }
  } else {
    displayUserId = driverId;
    dName = isCab && isDriver && firstPassenger
      ? (firstPassenger.rider_name || 'Cab Buddy')
      : (ride.driverName || ride.driver_name || 'Unknown');
    dAvatar = isCab && isDriver && firstPassenger
      ? (firstPassenger.rider_avatar || undefined)
      : (ride.driverAvatar || ride.driver_avatar || undefined);
    dRating = isCab && isDriver && firstPassenger
      ? 5.0
      : (ride.driverRating ?? ride.driver_rating ?? 5.0);
    dGender = ride.driverGender || null;
    dVerified = ride.driver_verified || ride.driverVerified || false;
  }

  const origin = ride.startPlaceName || ride.origin || 'Unknown';
  const destination = ride.endPlaceName || ride.destination || 'Unknown';
  const departureTime = ride.startTime || ride.departure_time;
  const time = new Date(departureTime);
  const isPast = (() => {
    const tzOffset = 5.5 * 60 * 60 * 1000;
    const nowKolkata = new Date(Date.now() + tzOffset);
    const rideKolkata = new Date(time.getTime() + tzOffset);
    
    const nowYear = nowKolkata.getUTCFullYear();
    const nowMonth = nowKolkata.getUTCMonth();
    const nowDate = nowKolkata.getUTCDate();
    
    const rideYear = rideKolkata.getUTCFullYear();
    const rideMonth = rideKolkata.getUTCMonth();
    const rideDate = rideKolkata.getUTCDate();
    
    if (nowYear > rideYear) return true;
    if (nowYear < rideYear) return false;
    if (nowMonth > rideMonth) return true;
    if (nowMonth < rideMonth) return false;
    return nowDate > rideDate;
  })();

  const startCoords = parseCoords(ride.startPointGeoJson, (ride as any).startLat || (ride as any).start_lat, (ride as any).startLng || (ride as any).start_lng, params.fromLat, params.fromLng);
  const endCoords = parseCoords(ride.endPointGeoJson, (ride as any).endLat || (ride as any).end_lat, (ride as any).endLng || (ride as any).end_lng, params.toLat, params.toLng);
  const origin_lat = startCoords.lat;
  const origin_lng = startCoords.lng;
  const dest_lat = endCoords.lat;
  const dest_lng = endCoords.lng;

  const dist = ride.distance_km ?? 0;
  const co2 = ride.co2_saved_kg ?? 0;

  const passengerRoutes = (passengers || [])
    .filter((p: any) => p.status === 'ACCEPTED' || p.status === 'STARTED' || p.status === 'COMPLETED')
    .map((p: any) => {
      const start = parseCoords(p.riderStartGeoJson);
      const end = parseCoords(p.riderEndGeoJson);
      if (!start.lat || !start.lng || !end.lat || !end.lng) return null;
      return {
        origin: { lat: start.lat, lng: start.lng, name: p.riderStartName || 'Pickup' },
        destination: { lat: end.lat, lng: end.lng, name: p.riderEndName || 'Drop-off' },
        label: p.rider_name || 'Passenger',
      };
    })
    .filter(Boolean);

  const displayFare = ride.price_per_seat ?? (firstPassenger?.fareCents ? firstPassenger.fareCents / 100 : (ride.chargeCents ? ride.chargeCents / 100 : 0));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Ride Details" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 250 + insets.bottom }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Fixed Top Map */}
        <View style={{ height: 220, width: '100%', borderRadius: radius.lg, overflow: 'hidden', marginVertical: spacing.md, borderWidth: 1, borderColor: t.border }}>
          <RouteMap
            origin={{ lat: origin_lat ?? 0, lng: origin_lng ?? 0, name: origin }}
            destination={{ lat: dest_lat ?? 0, lng: dest_lng ?? 0, name: destination }}
            passengerRoutes={passengerRoutes as any}
            t={t}
            style={{ height: '100%', width: '100%' }}
          />
        </View>

        {/* Driver / Co-Passenger Participant Card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                if (displayUserId) {
                  tap();
                  router.push(`/user/${displayUserId}` as any);
                }
              }}
              activeOpacity={0.8}
              style={{ borderRadius: 9999, borderWidth: 2, borderColor: '#E5E7EB' }}
            >
              <VerifiedAvatar uri={dAvatar} name={dName} verified={dVerified} t={t} size={44} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }} numberOfLines={1}>{dName}</Text>
                {dGender && (
                  <Text style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                    ({dGender})
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Star color="#FBBF24" size={12} fill="#FBBF24" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.textSecondary }}>{dRating % 1 === 0 ? dRating.toFixed(0) : dRating.toFixed(1)}</Text>
                {!isConfirmed && (
                  <>
                    <Text style={{ fontSize: 12, color: t.textTertiary }}>·</Text>
                    <Text style={{ fontSize: 13, color: t.textSecondary }}>
                      {ride.seatsAvailable ?? 0} {(ride.seatsAvailable ?? 0) === 1 ? 'seat' : 'seats'} available
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                {formatISTDate(departureTime)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Clock color={t.textSecondary} size={11} />
                <Text style={{ fontSize: 12, color: t.textSecondary }}>
                  {formatISTTime(departureTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Pricing Card with Fare Detail Breakdown Option */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
          {isCab ? (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.textSecondary }}>Fare</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: t.primary }}>
                Split the Cab Fare
              </Text>
            </View>
          ) : (
            displayFare > 0 && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: t.textSecondary }}>
                    {isConfirmed ? (isDriver ? "You'll get" : "You'll pay") : 'Fare'}
                  </Text>
                  <TouchableOpacity onPress={() => setShowPricingDetails(true)} activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: t.primary }}>
                      View Fare Breakdown
                    </Text>
                    <Info size={14} color={t.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: t.textPrimary }}>
                  ₹{Number(displayFare).toFixed(0)}
                </Text>
              </View>
            )
          )}
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

        {/* Dynamic OTP Verification & Cab Action Section */}
        {isConfirmed && currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED' && (!isPast) && (() => {
          const myRequestIsInvitation = Boolean(ride.my_request_is_invitation);
          const canEnterOtp = ride.can_enter_otp !== undefined ? Boolean(ride.can_enter_otp) : (!isCab ? isDriver : (myRequestIsInvitation ? !isDriver : isDriver));
          const userOtpCode = ride.my_display_otp || ride.my_otp || (ride.passengers && ride.passengers[0] ? ride.passengers[0].otp : '----');
          const isOtpVerified = Boolean(
            currentStatus === 'STARTED' ||
            ride.status === 'STARTED' ||
            myRequestStatus === 'STARTED' ||
            ride.my_request_otp_verified ||
            (ride.passengers && ride.passengers.some((p: any) => p.otp_verified || p.status === 'STARTED'))
          );

          return (
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {/* For Shared Cab Rides: Show 'Book a Cab and Split' for BOTH users ONLY AFTER OTP verification */}
              {isCab && isOtpVerified && (
                <View style={[styles.card, { backgroundColor: t.surface, borderColor: '#10b981', borderWidth: 1.5 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Car color="#10b981" size={20} />
                    <Text style={{ fontSize: 16, fontWeight: '800', color: t.textPrimary }}>
                      Book Shared Cab
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 12 }}>
                    OTP verified! Either co-passenger can open Uber, OLA, or Rapido to book and split the cab fare:
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenCabModal}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: '#10b981',
                      paddingVertical: 14,
                      borderRadius: radius.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Car color="#ffffff" size={20} />
                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 15 }}>
                      Book a Cab and Split
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* OTP Verification Card (Shown before OTP is verified) */}
              {!isOtpVerified && (
                <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.primary, borderWidth: 1.5 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                      <KeyRound color={t.primary} size={18} />
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: t.textPrimary }}>
                      {canEnterOtp ? 'Enter OTP to verify ride' : 'Your Verification OTP'}
                    </Text>
                  </View>

                  {canEnterOtp ? (
                    // Acceptor screen: enters OTP
                    <View style={{ gap: 10 }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary }}>Enter Co-Passenger's 4-Digit OTP:</Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TextInput
                          value={otpInput}
                          onChangeText={setOtpInput}
                          onFocus={() => setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 250)}
                          placeholder=""
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
                          onPress={() => onVerifyOtp()}
                          disabled={verifyingOtp}
                          activeOpacity={0.85}
                          style={{ backgroundColor: t.primary, paddingHorizontal: 18, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' }}
                        >
                          {verifyingOtp ? <ActivityIndicator color={t.primaryContrast} /> : <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 14 }}>Verify OTP</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    // Passive passenger screen: displays OTP code
                    <View style={{ gap: 10 }}>
                      <View style={{ backgroundColor: t.background, padding: 14, borderRadius: radius.md, borderWidth: 1, borderColor: t.border }}>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Verification OTP</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                          <Text style={{ fontSize: 26, fontWeight: '800', color: t.primary, letterSpacing: 6 }}>
                            {userOtpCode}
                          </Text>
                          <Text style={{ fontSize: 12, color: t.textSecondary, fontStyle: 'italic' }}>
                            Give to co-passenger / driver
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: t.warningBg, padding: 12, borderRadius: radius.md }}>
                        <Clock color={t.warning} size={18} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: t.warning, flex: 1 }}>
                          Waiting for co-passenger to enter your OTP to verify ride...
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })()}

        {/* Cab Apps Selection Modal */}
        <Modal visible={cabLauncherModalVisible} transparent animationType="fade" onRequestClose={() => setCabLauncherModalVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <View style={{ width: '100%', maxWidth: 360, backgroundColor: t.surface, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: t.border }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: t.textPrimary, marginBottom: 4 }}>Choose Cab App</Text>
              <Text style={{ fontSize: 13, color: t.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                Select one of the available cab apps installed on your phone to book your shared ride:
              </Text>

              {checkingApps ? (
                <ActivityIndicator color={t.primary} style={{ marginVertical: 20 }} />
              ) : (
                <View style={{ gap: 12, width: '100%', marginBottom: 16 }}>
                  {availableCabApps.map(app => (
                    <TouchableOpacity
                      key={app.id}
                      onPress={() => handleLaunchCabApp(app)}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: app.bg,
                        paddingVertical: 14,
                        borderRadius: radius.md,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: app.color, fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>{app.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setCabLauncherModalVisible(false)}
                style={{ paddingVertical: 10, paddingHorizontal: 20 }}
              >
                <Text style={{ color: t.textTertiary, fontWeight: '600', fontSize: 14 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
      </KeyboardAvoidingView>

      {/* Bottom Sticky Action Bar */}
      {!isPast && currentStatus !== 'COMPLETED' && currentStatus !== 'CANCELLED' && (
        <View style={[styles.bottomBar, { backgroundColor: t.surface, borderColor: t.border, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
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

          {/* RECIPIENT of request or invitation: Show Chat, Reject, Accept */}
          {isRecipientOfRequest && (
            <View style={{ flexDirection: 'row', gap: 10, width: '100%', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => openChat(targetPassenger?.rider_id || ride?.peer_id, targetPassenger?.rider_name || ride?.peer_name, targetPassenger?.chat_id || ride?.my_chat_id)}
                activeOpacity={0.85}
                style={[styles.cta, { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', gap: 6 }]}
              >
                <MessageCircle color={t.textPrimary} size={18} />
                <Text style={{ color: t.textPrimary, fontSize: 14, fontWeight: '600' }}>Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onRejectInvite(pendingPassenger?.request_id || ride?.my_request_id)}
                disabled={booking}
                activeOpacity={0.85}
                style={[styles.cta, { backgroundColor: '#fee2e2', borderColor: '#ef4444', borderWidth: 1, flex: 1 }]}
              >
                {booking ? <ActivityIndicator color="#ef4444" /> : (
                  <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '700' }}>Reject</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onAcceptInvite(pendingPassenger?.request_id || ride?.my_request_id)}
                disabled={booking}
                activeOpacity={0.85}
                style={[styles.cta, { backgroundColor: t.primary, flex: 1.2 }]}
              >
                {booking ? <ActivityIndicator color={t.primaryContrast} /> : (
                  <Text style={{ color: t.primaryContrast, fontSize: 15, fontWeight: '700' }}>Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* SENDER of request or invitation: Show Awaiting Approval + Cancel */}
          {isSenderOfRequest && (
            <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
              <View style={[styles.cta, { backgroundColor: t.muted, flex: 2 }]}>
                <Text style={{ color: t.textSecondary, fontSize: 14, fontWeight: '600' }}>Awaiting Approval</Text>
              </View>
              <TouchableOpacity
                onPress={isDriver ? onWithdrawRide : onCancelBooking}
                activeOpacity={0.85}
                style={[styles.cta, { backgroundColor: '#ffffff', borderColor: '#ef4444', borderWidth: 1, flex: 1 }]}
              >
                <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ride IS STARTED: Mark Ride as Completed */}
          {(currentStatus === 'STARTED' || myRequestStatus === 'STARTED') && (
            <TouchableOpacity
              onPress={onCompleteRide}
              disabled={booking}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: t.primary, width: '100%' }]}
            >
              {booking ? <ActivityIndicator color={t.primaryContrast} /> : (
                <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Mark Ride as Completed</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Ride NOT STARTED & NO PENDING REQUEST: Withdraw Ride (driver) / Cancel Booking (passenger) */}
          {!hasPendingRequest && (isConfirmed || isDriver || myRequestStatus === 'ACCEPTED') && currentStatus !== 'STARTED' && myRequestStatus !== 'STARTED' && currentStatus !== 'CANCELLED' && currentStatus !== 'COMPLETED' && (
            <TouchableOpacity
              onPress={isDriver ? onWithdrawRide : onCancelBooking}
              disabled={booking}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: '#ffffff', borderColor: '#ef4444', borderWidth: 1, width: '100%' }]}
            >
              {booking ? <ActivityIndicator color="#ef4444" /> : (
                <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700' }}>
                  {isDriver ? 'Withdraw Ride' : 'Cancel Booking'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

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

      {/* Fare Breakdown Modal */}
      {(() => {
        const est = ride.estimatedFare;
        const vType = (ride.vehicle_type || ride.vehicleType || 'CAR').toUpperCase();
        const fType = ride.fuel_type || ride.fuelType || 'Petrol';
        const distVal = est?.distanceKm ?? (dist > 0 ? dist : 10);
        const perKm = vType === 'BIKE' ? 4 : (vType === 'CAR' && (ride.vehicleCapacity || 5) > 5 ? 12 : 10);
        const fuelRate = vType === 'BIKE' ? 2 : (fType.toUpperCase() === 'CNG' ? 3 : (fType.toUpperCase() === 'DIESEL' ? 5 : 6));
        
        const distanceFare = est?.distanceFare ?? Math.round(distVal * perKm);
        const fuelSurcharge = est?.fuelSurcharge ?? Math.round(distVal * fuelRate);
        const baseFareVal = est?.baseFare ?? 0;
        const subtotalVal = est?.subtotal ?? (distanceFare + fuelSurcharge + baseFareVal);
        const discountVal = est?.poolingDiscount ?? Math.round(subtotalVal * 0.40);
        const finalFareVal = est?.finalFare ?? Math.round(displayFare || (subtotalVal - discountVal));

        return (
          <Modal
            visible={showPricingDetails}
            transparent
            animationType="slide"
            onRequestClose={() => setShowPricingDetails(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setShowPricingDetails(false)}
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={{
                  backgroundColor: t.surface,
                  borderTopLeftRadius: radius.xl,
                  borderTopRightRadius: radius.xl,
                  padding: spacing.lg,
                  gap: 16,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: t.textPrimary }}>
                    Fare Breakdown Details
                  </Text>
                  <TouchableOpacity onPress={() => setShowPricingDetails(false)} style={{ padding: 4 }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: t.textSecondary }}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.border, paddingVertical: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: t.textSecondary }}>
                      Distance Rate ({distVal.toFixed(1)} km × ₹{perKm}/km)
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>
                      ₹{distanceFare}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: t.textSecondary }}>
                      Fuel Surcharge ({fType} @ ₹{fuelRate}/km)
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>
                      ₹{fuelSurcharge}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: t.textSecondary }}>Base Fare</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: baseFareVal === 0 ? t.success : t.textPrimary }}>
                      {baseFareVal === 0 ? 'FREE (₹0)' : `₹${Math.round(baseFareVal)}`}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: t.border + '60', paddingTop: 8 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.textSecondary }}>Subtotal</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>₹{subtotalVal}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: t.success, fontWeight: '600' }}>40% Shared Pooling Discount</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: t.success }}>-₹{discountVal}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }}>
                    Total Pooled Fare
                  </Text>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: t.primary }}>
                    ₹{finalFareVal}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowPricingDetails(false)}
                  style={{
                    backgroundColor: t.primary,
                    paddingVertical: 14,
                    borderRadius: radius.md,
                    alignItems: 'center',
                    marginTop: 8,
                  }}
                >
                  <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 15 }}>Close</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        );
      })()}
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
    justifyContent: 'center',
  },
});
