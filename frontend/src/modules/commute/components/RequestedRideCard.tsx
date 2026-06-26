import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, Star } from 'lucide-react-native';
import { Theme, radius, spacing } from '../../../core/theme/theme';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';

type RequestedRideCardProps = {
  ride: any;
  t: Theme;
  onPress: () => void;
  testID?: string;
  style?: any;
};

export const RequestedRideCard: React.FC<RequestedRideCardProps> = ({
  ride,
  t,
  onPress,
  testID,
  style,
}) => {
  const driverName = ride.driver_name || ride.driverName || 'Unknown';
  const driverAvatar = ride.driver_avatar || ride.driverAvatar;
  const driverVerified = ride.driver_verified || ride.driverVerified;
  const driverRating = ride.driver_rating ?? ride.driverRating ?? 5.0;
  const driverGender = ride.driver_gender || ride.driverGender || ride.driver?.gender;
  const seats = ride.seats ?? ride.seatsNeeded ?? ride.seats_requested ?? ride.seatsRequested ?? 1;
  
  const origin = ride.origin || ride.startPlaceName || 'Unknown';
  const destination = ride.destination || ride.endPlaceName || 'Unknown';
  const departureTime = ride.departure_time || ride.startTime;
  
  const time = new Date(departureTime);
  const timeStr = isNaN(time.getTime()) ? '--:--' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const dateStr = isNaN(time.getTime()) ? '' : time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); // e.g. "24 Jun"

  return (
    <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7}
      style={[styles.card, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }, style]}>
      
      {/* Top Row: Avatar, Name & Rating (Date on right) */}
      <View style={styles.row}>
        <View style={{ borderRadius: 9999, borderWidth: 2, borderColor: '#E5E7EB' }}>
          <VerifiedAvatar uri={driverAvatar} name={driverName} verified={driverVerified} t={t} size={40} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: t.textPrimary }} numberOfLines={1}>
              {driverName}
            </Text>
            {driverGender && (
              <Text style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                ({driverGender})
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Star color="#FBBF24" size={11} fill="#FBBF24" />
            <Text style={{ fontSize: 12, color: t.textSecondary }}>{driverRating.toFixed(1)}</Text>
            <Text style={{ fontSize: 12, color: t.textTertiary }}>·</Text>
            <Text style={{ fontSize: 12, color: t.textSecondary }}>
              {seats} {seats === 1 ? 'seat' : 'seats'} requested
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>{dateStr}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Clock color={t.textSecondary} size={10} />
            <Text style={{ fontSize: 12, color: t.textSecondary }}>{timeStr}</Text>
          </View>
        </View>
      </View>

      {/* Route Row (No CO2 or vehicle info) */}
      <View style={[styles.route, { borderTopColor: '#E5E7EB' }]}>
        <View style={styles.locRow}>
          <View style={[styles.dot, { backgroundColor: t.textPrimary }]} />
          <Text style={[styles.loc, { color: t.textPrimary }]} numberOfLines={1}>{origin}</Text>
        </View>
        <View style={[styles.vLine, { backgroundColor: '#E5E7EB' }]} />
        <View style={styles.locRow}>
          <View style={[styles.dot, { borderColor: t.textPrimary, borderWidth: 2, backgroundColor: 'transparent' }]} />
          <Text style={[styles.loc, { color: t.textPrimary }]} numberOfLines={1}>{destination}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.md, gap: 12, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  route: { borderTopWidth: 1, paddingTop: 12, gap: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  vLine: { width: 2, height: 14, marginLeft: 3 },
  loc: { flex: 1, fontSize: 14, fontWeight: '500' },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  timeText: { fontSize: 11, fontWeight: '600' },
});
