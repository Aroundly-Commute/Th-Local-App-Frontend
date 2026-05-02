import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ShieldCheck, Star, Users } from 'lucide-react-native';
import { Theme, radius, spacing } from './theme';

export const VerifiedAvatar: React.FC<{ uri?: string; size?: number; name: string; verified?: boolean; t: Theme }>
  = ({ uri, size = 56, name, verified, t }) => (
  <View style={{ width: size, height: size }}>
    {uri ? (
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
    ) : (
      <View style={[s.placeholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.secondary }]}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{name.charAt(0).toUpperCase()}</Text>
      </View>
    )}
    {verified ? (
      <View style={[s.badge, { backgroundColor: t.primary, borderColor: t.surface }]}>
        <ShieldCheck color="#fff" size={size * 0.3} />
      </View>
    ) : null}
  </View>
);

export const RideCard: React.FC<{ ride: any; t: Theme; onPress: () => void; testID?: string }> = ({ ride, t, onPress, testID }) => {
  const { TouchableOpacity } = require('react-native');
  const time = new Date(ride.departure_time);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.85}
      style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={s.row}>
        <VerifiedAvatar uri={ride.driver_avatar} name={ride.driver_name} verified={ride.driver_verified} t={t} size={48} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[s.driver, { color: t.textPrimary }]} numberOfLines={1}>{ride.driver_name}</Text>
          <View style={[s.row, { gap: 6 }]}>
            <Star color={t.primary} size={12} fill={t.primary} />
            <Text style={[s.meta, { color: t.textSecondary }]}>{ride.driver_rating?.toFixed(1)}</Text>
            <Text style={[s.meta, { color: t.textSecondary }]}>·</Text>
            <Users color={t.textSecondary} size={12} />
            <Text style={[s.meta, { color: t.textSecondary }]}>{ride.seats_available} seats</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.price, { color: t.primary }]}>${ride.price_per_seat?.toFixed(0)}</Text>
          <Text style={[s.meta, { color: t.textSecondary }]}>{timeStr}</Text>
        </View>
      </View>
      <View style={[s.routeBox, { borderColor: t.border }]}>
        <View style={s.routeLine}>
          <View style={[s.dot, { backgroundColor: t.primary }]} />
          <View style={[s.connector, { backgroundColor: t.border }]} />
          <View style={[s.dot, { backgroundColor: t.error }]} />
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <Text style={[s.loc, { color: t.textPrimary }]} numberOfLines={1}>{ride.origin}</Text>
          <Text style={[s.loc, { color: t.textPrimary }]} numberOfLines={1}>{ride.destination}</Text>
        </View>
      </View>
      <View style={[s.eco, { backgroundColor: t.isDark ? '#0f1f17' : '#EAF5EC' }]}>
        <Text style={[s.ecoText, { color: t.primary }]}>
          🌱 {ride.co2_saved_kg?.toFixed(1)} kg CO₂ saved · {ride.distance_km?.toFixed(0)} km
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: {
    borderRadius: radius.lg, padding: spacing.md, gap: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  driver: { fontSize: 15, fontWeight: '700' },
  meta: { fontSize: 12 },
  price: { fontSize: 18, fontWeight: '800' },
  routeBox: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  routeLine: { alignItems: 'center', justifyContent: 'center', height: 50 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  connector: { width: 2, flex: 1, marginVertical: 2 },
  loc: { fontSize: 14, fontWeight: '500' },
  eco: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  ecoText: { fontSize: 12, fontWeight: '700' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
