import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, Leaf, Clock } from 'lucide-react-native';
import { Theme, radius, spacing } from '../../../core/theme/theme';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';

export const RideCard: React.FC<{ ride: any; t: Theme; onPress: () => void; testID?: string; compact?: boolean }> = ({
  ride,
  t,
  onPress,
  testID,
  compact,
}) => {
  // Map fields from both Python and NestJS backends
  const driverName = ride.driver_name || ride.driverName || 'Unknown';
  const driverAvatar = ride.driver_avatar || ride.driverAvatar;
  const driverVerified = ride.driver_verified || ride.driverVerified;
  const driverRating = ride.driver_rating ?? ride.driverRating ?? 5.0;
  
  const origin = ride.origin || ride.startPlaceName || 'Unknown';
  const destination = ride.destination || ride.endPlaceName || 'Unknown';
  const departureTime = ride.departure_time || ride.startTime;
  
  const seatsAvailable = ride.seats_available ?? ride.seatsAvailable ?? 0;
  
  // Price handling: chargeCents (NestJS) vs price_per_seat (Python)
  const price = ride.price_per_seat ?? (ride.chargeCents ? ride.chargeCents / 100 : 0);
  const co2 = ride.co2_saved_kg ?? 0;

  const time = new Date(departureTime);
  const timeStr = isNaN(time.getTime()) ? '--:--' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  
  const vehicle = ride.driver_vehicle || ride.vehicle;

  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7}
      style={[s.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <View style={s.row}>
        <VerifiedAvatar uri={driverAvatar} name={driverName} verified={driverVerified} t={t} size={44} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.driver, { color: t.textPrimary }]} numberOfLines={1}>{driverName}</Text>
          <View style={[s.row, { gap: 6, marginTop: 2 }]}>
            <Star color={t.warning} size={11} fill={t.warning} />
            <Text style={[s.meta, { color: t.textSecondary }]}>{driverRating.toFixed(1)}</Text>
            <Text style={[s.meta, { color: t.textTertiary }]}>·</Text>
            <Text style={[s.meta, { color: t.textSecondary }]}>{seatsAvailable} seats</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[s.price, { color: t.textPrimary }]}>${price.toFixed(2)}</Text>
          <Text style={[s.meta, { color: t.textSecondary }]}>per seat</Text>
        </View>
      </View>

      <View style={[s.route, { borderTopColor: t.border }]}>
        <View style={s.locRow}>
          <View style={[s.dot, { backgroundColor: t.textPrimary }]} />
          <Text style={[s.loc, { color: t.textPrimary }]} numberOfLines={1}>{origin}</Text>
          <View style={[s.timePill, { backgroundColor: t.muted }]}>
            <Clock color={t.textSecondary} size={10} />
            <Text style={[s.timeText, { color: t.textSecondary }]}>{timeStr}</Text>
          </View>
        </View>
        <View style={[s.vLine, { backgroundColor: t.border }]} />
        <View style={s.locRow}>
          <View style={[s.dot, { borderColor: t.textPrimary, borderWidth: 2, backgroundColor: t.background }]} />
          <Text style={[s.loc, { color: t.textPrimary }]} numberOfLines={1}>{destination}</Text>
        </View>
      </View>

      {!compact && (
        <View style={[s.row, { justifyContent: 'space-between' }]}>
          <View style={[s.row, { gap: 6 }]}>
            <Leaf color={t.success} size={12} />
            <Text style={[s.ecoText, { color: t.success }]}>{co2.toFixed(1)} kg CO₂</Text>
          </View>
          {vehicle?.model && (
            <Text style={[s.meta, { color: t.textTertiary }]}>{vehicle.make} {vehicle.model}</Text>
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
});
