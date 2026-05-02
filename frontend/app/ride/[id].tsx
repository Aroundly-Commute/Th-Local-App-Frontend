import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Alert, SafeAreaView, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from '../../src/MapWrapper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Star, ShieldCheck, Leaf, Car, MessageCircle } from 'lucide-react-native';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { VerifiedAvatar } from '../../src/components';
import { tap, success, errorH } from '../../src/haptics';

export default function RideDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [ride, setRide] = useState<any>(null);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/rides/${id}`);
        setRide(data);
      } catch (e) { errorH(); }
    })();
  }, [id]);

  const onBook = async () => {
    tap();
    setBooking(true);
    try {
      const { data } = await api.post(`/rides/${id}/book`, { seats: 1 });
      success();
      Alert.alert('Booked!', 'Your seat is confirmed. Chat with your driver.');
      router.replace(`/chat/${encodeURIComponent(data.chat_id)}?name=${encodeURIComponent(ride.driver_name)}` as any);
    } catch (e: any) {
      errorH();
      Alert.alert('Booking failed', e?.response?.data?.detail || 'Try again');
    } finally { setBooking(false); }
  };

  if (!ride) return (
    <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={t.primary} />
    </View>
  );

  const time = new Date(ride.departure_time);
  const isOwn = user?.id === ride.driver_id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ height: '40%' }}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: (ride.origin_lat + ride.dest_lat) / 2,
            longitude: (ride.origin_lng + ride.dest_lng) / 2,
            latitudeDelta: Math.abs(ride.origin_lat - ride.dest_lat) * 2 + 0.2,
            longitudeDelta: Math.abs(ride.origin_lng - ride.dest_lng) * 2 + 0.2,
          }}
        >
          {Platform.OS === 'android' && <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />}
          <Marker coordinate={{ latitude: ride.origin_lat, longitude: ride.origin_lng }} pinColor={t.primary} />
          <Marker coordinate={{ latitude: ride.dest_lat, longitude: ride.dest_lng }} pinColor={t.error} />
          <Polyline
            coordinates={[
              { latitude: ride.origin_lat, longitude: ride.origin_lng },
              { latitude: ride.dest_lat, longitude: ride.dest_lng },
            ]}
            strokeColor={t.primary} strokeWidth={4}
          />
        </MapView>
        <TouchableOpacity testID="ride-back" onPress={() => { tap(); router.back(); }}
          style={[styles.back, { backgroundColor: t.surface }]}>
          <ChevronLeft color={t.textPrimary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.sheet, { backgroundColor: t.background }]} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140 }}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <VerifiedAvatar uri={ride.driver_avatar} name={ride.driver_name} verified={ride.driver_verified} t={t} size={56} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.driver, { color: t.textPrimary }]}>{ride.driver_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <Star color={t.primary} size={13} fill={t.primary} />
                <Text style={{ color: t.textSecondary, fontSize: 13 }}>{ride.driver_rating?.toFixed(1)} · Verified driver</Text>
              </View>
            </View>
            <Text style={[styles.price, { color: t.primary }]}>${ride.price_per_seat.toFixed(0)}</Text>
          </View>
        </View>

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
                <Text style={[styles.loc, { color: t.textPrimary }]}>{ride.origin}</Text>
              </View>
              <View>
                <Text style={[styles.label, { color: t.textSecondary }]}>DROPOFF</Text>
                <Text style={[styles.loc, { color: t.textPrimary }]}>{ride.destination}</Text>
              </View>
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>
                Departs {time.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
        </View>

        {ride.driver_vehicle && (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Car color={t.primary} size={18} />
              <Text style={[styles.section, { color: t.textPrimary }]}>Vehicle</Text>
            </View>
            <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 8 }}>
              {ride.driver_vehicle.year} {ride.driver_vehicle.make} {ride.driver_vehicle.model}
            </Text>
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>{ride.driver_vehicle.color} · {ride.driver_vehicle.license_plate}</Text>
          </View>
        )}

        <View style={[styles.eco, { backgroundColor: t.isDark ? '#0f1f17' : '#EAF5EC' }]}>
          <Leaf color={t.primary} size={18} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: t.primary, fontWeight: '800', fontSize: 14 }}>Eco impact</Text>
            <Text style={{ color: t.primary, fontSize: 12, marginTop: 2 }}>
              {ride.co2_saved_kg.toFixed(1)} kg CO₂ avoided · {ride.distance_km.toFixed(0)} km route
            </Text>
          </View>
        </View>

        {ride.notes ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
            <Text style={[styles.section, { color: t.textPrimary }]}>Notes from driver</Text>
            <Text style={{ color: t.textSecondary, marginTop: 6 }}>{ride.notes}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.fab, { backgroundColor: t.background, borderColor: t.border }]}>
        <TouchableOpacity
          testID="book-ride"
          onPress={onBook}
          disabled={booking || isOwn}
          activeOpacity={0.85}
          style={[styles.cta, { backgroundColor: isOwn ? t.textSecondary : t.primary }]}
        >
          {booking
            ? <ActivityIndicator color={t.primaryContrast} />
            : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MessageCircle color={t.primaryContrast} size={18} />
                <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>
                  {isOwn ? 'Your ride' : `Book seat · $${ride.price_per_seat.toFixed(0)}`}
                </Text>
              </View>
            )}
        </TouchableOpacity>
      </View>
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
  section: { fontSize: 16, fontWeight: '700' },
  eco: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.md },
  fab: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.md, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1 },
  cta: { height: 54, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' },
});
