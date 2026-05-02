import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BadgeCheck, Star, Users, Leaf, Clock } from 'lucide-react-native';
import { Theme, radius, spacing } from './theme';

export const VerifiedAvatar: React.FC<{ uri?: string; size?: number; name: string; verified?: boolean; t: Theme }>
  = ({ uri, size = 48, name, verified, t }) => (
  <View style={{ width: size, height: size }}>
    {uri ? (
      <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
    ) : (
      <View style={[s.placeholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.muted }]}>
        <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: size * 0.38 }}>{name.charAt(0).toUpperCase()}</Text>
      </View>
    )}
    {verified ? (
      <View style={[s.badge, { backgroundColor: t.background }]}>
        <BadgeCheck color={t.success} size={size * 0.34} fill={t.background} />
      </View>
    ) : null}
  </View>
);

export const Chip: React.FC<{ label: string; t: Theme; variant?: 'default' | 'success' | 'accent' | 'warning' }>
  = ({ label, t, variant = 'default' }) => {
  const bg =
    variant === 'success' ? t.successBg :
    variant === 'accent' ? t.accentBg :
    variant === 'warning' ? t.warningBg : t.muted;
  const fg =
    variant === 'success' ? t.success :
    variant === 'accent' ? t.accent :
    variant === 'warning' ? t.warning : t.textSecondary;
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      <Text style={[s.chipText, { color: fg }]}>{label}</Text>
    </View>
  );
};

export const RideCard: React.FC<{ ride: any; t: Theme; onPress: () => void; testID?: string; compact?: boolean }>
  = ({ ride, t, onPress, testID, compact }) => {
  const time = new Date(ride.departure_time);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7}
      style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={s.row}>
        <VerifiedAvatar uri={ride.driver_avatar} name={ride.driver_name} verified={ride.driver_verified} t={t} size={44} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.driver, { color: t.textPrimary }]} numberOfLines={1}>{ride.driver_name}</Text>
          <View style={[s.row, { gap: 6, marginTop: 2 }]}>
            <Star color={t.warning} size={11} fill={t.warning} />
            <Text style={[s.meta, { color: t.textSecondary }]}>{ride.driver_rating?.toFixed(1)}</Text>
            <Text style={[s.meta, { color: t.textTertiary }]}>·</Text>
            <Text style={[s.meta, { color: t.textSecondary }]}>{ride.seats_available} seats</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.price, { color: t.textPrimary }]}>${ride.price_per_seat?.toFixed(2)}</Text>
          <Text style={[s.meta, { color: t.textSecondary }]}>per seat</Text>
        </View>
      </View>

      <View style={[s.route, { borderTopColor: t.border }]}>
        <View style={s.locRow}>
          <View style={[s.dot, { backgroundColor: t.textPrimary }]} />
          <Text style={[s.loc, { color: t.textPrimary }]} numberOfLines={1}>{ride.origin}</Text>
          <View style={[s.timePill, { backgroundColor: t.muted }]}>
            <Clock color={t.textSecondary} size={10} />
            <Text style={[s.timeText, { color: t.textSecondary }]}>{timeStr}</Text>
          </View>
        </View>
        <View style={[s.vLine, { backgroundColor: t.border }]} />
        <View style={s.locRow}>
          <View style={[s.dot, { borderColor: t.textPrimary, borderWidth: 2, backgroundColor: t.background }]} />
          <Text style={[s.loc, { color: t.textPrimary }]} numberOfLines={1}>{ride.destination}</Text>
        </View>
      </View>

      {!compact && (
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={[s.row, { gap: 6 }]}>
            <Leaf color={t.success} size={12} />
            <Text style={[s.ecoText, { color: t.success }]}>{ride.co2_saved_kg?.toFixed(1)} kg CO₂</Text>
          </View>
          {ride.driver_vehicle?.model && (
            <Text style={[s.meta, { color: t.textTertiary }]}>{ride.driver_vehicle.make} {ride.driver_vehicle.model}</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.md, gap: 12, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  driver: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12 },
  price: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  route: { borderTopWidth: 1, paddingTop: 12, gap: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  vLine: { width: 2, height: 14, marginLeft: 3 },
  loc: { flex: 1, fontSize: 14, fontWeight: '500' },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  timeText: { fontSize: 11, fontWeight: '600' },
  ecoText: { fontSize: 12, fontWeight: '600' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -2, bottom: -2, borderRadius: 9999 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  chipText: { fontSize: 11, fontWeight: '600' },
});
