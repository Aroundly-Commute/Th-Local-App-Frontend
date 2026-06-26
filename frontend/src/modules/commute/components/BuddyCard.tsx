import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Users, Clock, Star } from 'lucide-react-native';
import { Theme, spacing, radius } from '../../../core/theme/theme';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';

type BuddyCardProps = {
  buddy: any;
  t: Theme;
  onPress: () => void;
  style?: any;
};

export const BuddyCard: React.FC<BuddyCardProps> = ({
  buddy,
  t,
  onPress,
  style,
}) => {
  const riderName = buddy.rider?.name || 'Unknown';
  const riderAvatar = buddy.rider?.profilePic;
  const riderRating = buddy.rider_rating ?? buddy.riderRating ?? buddy.rider?.rating ?? 5.0;
  const origin = buddy.startPlaceName || 'Unknown';
  const destination = buddy.endPlaceName || 'Unknown';
  const seatsNeeded = buddy.seatsNeeded ?? 1;
  const time = new Date(buddy.startTime);
  const timeStr = isNaN(time.getTime()) ? '--:--' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const dateStr = isNaN(time.getTime()) ? '' : time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}
      style={[
        {
          borderRadius: radius.lg,
          padding: spacing.md,
          gap: 12,
          borderWidth: 1,
          backgroundColor: '#F9FAFB',
          borderColor: '#E5E7EB'
        },
        style
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ borderRadius: 9999, borderWidth: 2, borderColor: '#E5E7EB' }}>
          <VerifiedAvatar uri={riderAvatar} name={riderName} verified={false} t={t} size={40} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: t.textPrimary }} numberOfLines={1}>
              {riderName}
            </Text>
            {buddy.rider?.gender && (
              <Text style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                ({buddy.rider.gender})
              </Text>
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Star color="#FBBF24" size={11} fill="#FBBF24" />
            <Text style={{ fontSize: 12, color: t.textSecondary }}>{riderRating.toFixed(1)}</Text>
            <Text style={{ fontSize: 12, color: t.textTertiary }}>·</Text>
            <Users color={t.textSecondary} size={11} style={{ marginRight: -2 }} />
            <Text style={{ fontSize: 12, color: t.textSecondary }}>
              {seatsNeeded} {seatsNeeded === 1 ? 'seat' : 'seats'}
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

      <View style={{ borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 12, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.textPrimary }} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: t.textPrimary }} numberOfLines={1}>
            {origin}
          </Text>
        </View>
        <View style={{ width: 2, height: 14, marginLeft: 3, backgroundColor: '#E5E7EB' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, borderColor: t.textPrimary, borderWidth: 2, backgroundColor: 'transparent' }} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: t.textPrimary }} numberOfLines={1}>
            {destination}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
