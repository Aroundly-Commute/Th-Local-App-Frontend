import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Platform } from 'react-native';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';

import { RouteMap } from '../../src/modules/commute/components/RouteMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Leaf, Car, MessageCircle, Users, Clock } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { tap, success, errorH } from '../../src/core/utils/haptics';

export default function RideDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const [booking, setBooking] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/rides/${id}`);
      setRide(data);
    } catch (e) { errorH(); }
  };

  useEffect(() => { load(); }, [id]);

  const onBook = async () => {
    tap();
    setBooking(true);
    try {
      const { data } = await api.post(`/rides/${id}/book`, { seats: 1 });
      success();
      Alert.alert('Request Sent!', 'Your booking request has been sent. You will be notified once the driver accepts.');
      load(); // refresh to show updated state
    } catch (e: any) {
      errorH();
      Alert.alert('Failed', e?.response?.data?.message || e?.response?.data?.detail || 'Try again');
    } finally { setBooking(false); }
  };

  const onAcceptRequest = async (requestId: string) => {
    tap();
    try {
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'ACCEPTED' });
      success();
      Alert.alert('Request Accepted', 'The passenger has been added to your ride.');
      load(); // refresh
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Failed to accept request');
    }
  };

  const onRejectRequest = async (requestId: string) => {
    tap();
    try {
      await api.patch(`/matchmaking/requests/${requestId}`, { status: 'REJECTED' });
      success();
      Alert.alert('Request Rejected', 'The request has been declined.');
      load(); // refresh
    } catch (e: any) {
      errorH();
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
  const price = ride.chargeCents ? ride.chargeCents / 100 : (ride.price_per_seat ?? 0);
  
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
              {`Request Seat · $${(price || 0).toFixed(0)}`}
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
            <Text style={[styles.price, { color: t.primary }]}>${(price || 0).toFixed(0)}</Text>
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
                    <Text style={{ color: t.textPrimary, fontWeight: '600', fontSize: 14 }}>{p.rider_name}</Text>
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
});
