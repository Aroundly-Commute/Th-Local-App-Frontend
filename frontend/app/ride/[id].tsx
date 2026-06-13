import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Platform } from 'react-native';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';

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
  
  const params = useLocalSearchParams<{
    id: string;
    fromName?: string;
    toName?: string;
    fromLat?: string;
    fromLng?: string;
    toLat?: string;
    toLng?: string;
    estimatedFare?: string;
  }>();

  const id = params.id;
  const parsedFare = params.estimatedFare ? JSON.parse(params.estimatedFare) : null;
  const { user } = useAuth();
  const [booking, setBooking] = useState(false);
  const [showPricingDetails, setShowPricingDetails] = useState(false);

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

  const onBook = async () => {
    tap();
    setBooking(true);
    try {
      const payload = {
        seats: 1,
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

  if (!ride) return (
    <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={t.primary} />
    </View>
  );

  // Normalize variables for CarPool backend
  const dName = ride.driverName || ride.driver_name || 'Unknown';
  const dAvatar = ride.driverAvatar || ride.driver_avatar;
  const dRating = ride.driverRating ?? ride.driver_rating ?? 5.0;
  
  const origin = ride.startPlaceName || ride.origin || 'Unknown';
  const destination = ride.endPlaceName || ride.destination || 'Unknown';
  const departureTime = ride.startTime || ride.departure_time;
  
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
  const vehicle = ride.driver_vehicle || ride.vehicle;
  const time = new Date(departureTime);

  // Determine user's role on this ride
  const driverId = ride.driverId || ride.driver_id;
  const isDriver = user?.id === driverId;
  const passengers: any[] = ride.passengers || [];

  // Rider's own request state
  const myRequestStatus = ride.my_request_status; // 'REQUESTED' | 'ACCEPTED' | undefined
  const myChatId = ride.my_chat_id;

  // What FAB to show
  // - Driver: no FAB (has passenger list below)
  // - Rider with ACCEPTED request: "Chat with Driver"
  // - Rider with REQUESTED (pending): "Awaiting Approval"
  // - Rider with no request: "Book Seat"
  const fabContent = () => {
    if (isDriver) return null;
    if (myRequestStatus === 'ACCEPTED') {
      return (
        <TouchableOpacity
          testID="chat-driver"
          onPress={() => router.push(`/chat/${encodeURIComponent(myChatId)}?name=${encodeURIComponent(dName)}` as any)}
          activeOpacity={0.85}
          style={[styles.cta, { backgroundColor: t.primary }]}
        >
          <MessageCircle color={t.primaryContrast} size={18} />
          <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Chat with Driver</Text>
        </TouchableOpacity>
      );
    }
    if (myRequestStatus === 'REQUESTED') {
      return (
        <View style={[styles.cta, { backgroundColor: t.muted, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }]}>
          <Clock color={t.textSecondary} size={18} />
          <Text style={{ color: t.textSecondary, fontSize: 15, fontWeight: '600' }}>Awaiting Driver Approval</Text>
        </View>
      );
    }
    // No request yet
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
              {`Request Seat · ₹${Math.round(price || 0)}`}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Ride Details" />
      <View style={{ height: '35%' }}>
        <RouteMap
          origin={{ lat: origin_lat ?? 0, lng: origin_lng ?? 0, name: origin }}
          destination={{ lat: dest_lat ?? 0, lng: dest_lng ?? 0, name: destination }}
          t={t}
        />
      </View>

      <ScrollView style={[styles.sheet, { backgroundColor: t.background }]} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
        {/* Driver card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <VerifiedAvatar uri={dAvatar} name={dName} verified={true} t={t} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.driver, { color: t.textPrimary }]}>{dName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Star color={t.primary} size={13} fill={t.primary} />
                <Text style={{ color: t.textSecondary, fontSize: 13 }}>{dRating.toFixed(1)} · {isDriver ? 'Your ride' : 'Verified driver'}</Text>
              </View>
            </View>
            <Text style={[styles.price, { color: t.primary }]}>₹{Math.round(price || 0)}</Text>
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

        {/* DRIVER: Passengers / Booking Requests */}
        {isDriver && (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Users color={t.primary} size={18} />
              <Text style={[styles.section, { color: t.textPrimary }]}>
                {passengers.length === 0 ? 'No passengers yet' : `Passengers (${passengers.length})`}
              </Text>
            </View>
            {passengers.length === 0 ? (
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                When riders book this ride, they'll appear here.
              </Text>
            ) : (
              passengers.map((p: any) => (
                <View key={p.request_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <VerifiedAvatar uri={p.rider_avatar} name={p.rider_name} verified={false} t={t} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: t.textPrimary, fontWeight: '600', fontSize: 14 }}>
                      {p.rider_name} • ₹{Math.round((p.fareCents ?? 1000) / 100)}
                    </Text>
                    <Text style={{ color: p.status === 'ACCEPTED' ? t.success : p.status === 'REJECTED' ? t.error : t.warning, fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                      {p.status === 'ACCEPTED' ? 'Accepted' : p.status === 'REJECTED' ? 'Rejected' : 'Pending'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                    {p.status === 'REQUESTED' && (
                      <>
                        <TouchableOpacity
                          onPress={() => onAcceptRequest(p.request_id)}
                          activeOpacity={0.8}
                          style={{ backgroundColor: t.success, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999 }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => onRejectRequest(p.request_id)}
                          activeOpacity={0.8}
                          style={{ backgroundColor: t.error, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999 }}
                        >
                          <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Decline</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity
                      onPress={() => router.push(`/chat/${encodeURIComponent(p.chat_id)}?name=${encodeURIComponent(p.rider_name)}` as any)}
                      activeOpacity={0.8}
                      style={{ backgroundColor: t.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                    >
                      <MessageCircle color="#fff" size={12} />
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Chat</Text>
                    </TouchableOpacity>
                  </View>
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
      </ScrollView>

      {/* FAB */}
      {!isDriver && (
        <View style={[styles.fab, { backgroundColor: t.background, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {fabContent()}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { position: 'absolute', top: 12, left: 12, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  sheet: { flex: 1, marginTop: -32, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  driver: { fontSize: 18, fontWeight: '800' },
  price: { fontSize: 24, fontWeight: '800' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  loc: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  time: { fontSize: 13, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700' },
  eco: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.md },
  fab: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1 },
  cta: { flex: 1, height: 54, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
