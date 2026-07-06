import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Platform, Vibration } from 'react-native';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Leaf, MessageCircle, Users, Award, Building2, Briefcase, BadgeCheck, ShieldAlert, Car } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { tap, success } from '../../src/core/utils/haptics';

export default function UserDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user: me } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: async () => {
      const { data } = await api.get(`/auth/users/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const handleMessage = () => {
    if (!me?.id || !userProfile?.id) return;
    tap();
    const sorted = [me.id, userProfile.id].sort();
    const chatId = `chat_${sorted[0]}_${sorted[1]}`;
    router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(userProfile.name)}` as any);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
        <ScreenHeader title="Loading User..." />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !userProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
        <ScreenHeader title="Error" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <ShieldAlert size={48} color="#ef4444" />
          <Text style={{ fontSize: 16, fontWeight: '600', color: t.textPrimary, marginTop: 12, textAlign: 'center' }}>
            Failed to load user profile details.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const ridesCount = userProfile.rides_count || 0;
  const progress = (ridesCount % 25) * 4;
  const level = ridesCount < 25 ? 'Green Pooler' : ridesCount < 75 ? 'Silver Pooler' : 'Gold Pooler';
  const nextLevel = ridesCount < 25 ? 'Silver Pooler' : ridesCount < 75 ? 'Gold Pooler' : 'Elite Pooler';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
      <ScreenHeader title={`${userProfile.name}'s Profile`} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 100 }}>
        {/* Header Profile Info */}
        <View style={[styles.header, { backgroundColor: t.surface, borderColor: t.border }]}>
          <VerifiedAvatar uri={userProfile.avatar_url || undefined} name={userProfile.name} verified={userProfile.is_verified} t={t} size={88} />
          <Text numberOfLines={1} style={[styles.name, { color: t.textPrimary }]}>{userProfile.name}</Text>
          <Text numberOfLines={1} style={[styles.email, { color: t.textSecondary }]}>{userProfile.email}</Text>

          {/* User Bio */}
          {userProfile.bio ? (
            <Text style={[styles.bioText, { color: t.textSecondary }]}>
              "{userProfile.bio}"
            </Text>
          ) : null}

          {/* Society & Workplace */}
          {(userProfile.society || userProfile.workplace) ? (
            <View style={styles.communityContainer}>
              {userProfile.society ? (
                <View style={[styles.communityRow, { backgroundColor: t.surfaceElevated }]}>
                  <Building2 size={13} color={t.textSecondary} />
                  <Text numberOfLines={1} style={[styles.communityText, { color: t.textSecondary }]}>
                    {userProfile.society}
                  </Text>
                </View>
              ) : null}
              {userProfile.workplace ? (
                <View style={[styles.communityRow, { backgroundColor: t.surfaceElevated }]}>
                  <Briefcase size={13} color={t.textSecondary} />
                  <Text numberOfLines={1} style={[styles.communityText, { color: t.textSecondary }]}>
                    {userProfile.workplace}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Rating and count */}
          <View style={styles.metaRow}>
            <Star color={t.warning} size={13} fill={t.warning} />
            <Text style={[styles.metaText, { color: t.textPrimary }]}>
              {userProfile.rating % 1 === 0 ? userProfile.rating.toFixed(0) : userProfile.rating.toFixed(1)}
            </Text>
            <Text style={[styles.metaDot, { color: t.textTertiary }]}>·</Text>
            <Text style={[styles.metaText, { color: t.textSecondary }]}>{ridesCount} rides</Text>
            {userProfile.is_verified && (
              <>
                <Text style={[styles.metaDot, { color: t.textTertiary }]}>·</Text>
                <BadgeCheck color={t.success} size={14} />
                <Text style={[styles.metaText, { color: t.success, fontWeight: '600' }]}>Verified</Text>
              </>
            )}
          </View>
        </View>

        {/* Level progress */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.levelIcon, { backgroundColor: t.successBg }]}>
                <Award color={t.success} size={16} />
              </View>
              <View>
                <Text style={[styles.levelName, { color: t.textPrimary }]}>{level}</Text>
                <Text style={[styles.levelHint, { color: t.textSecondary }]}>
                  {Math.round(100 - progress)}% to {nextLevel}
                </Text>
              </View>
            </View>
            <View style={[styles.levelPill, { backgroundColor: t.muted }]}>
              <Text style={[styles.levelPillText, { color: t.textPrimary }]}>Level {Math.floor(ridesCount / 25) + 1}</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: t.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: t.success, width: `${progress}%` }]} />
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.statValue, { color: t.textPrimary }]}>{ridesCount}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Total Rides</Text>
            <Text style={[styles.statHint, { color: t.textTertiary }]}>
              {userProfile.role === 'driver' ? 'Driver' : 'Passenger'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.successBg, borderColor: t.successBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Leaf color={t.success} size={14} />
              <Text style={[styles.statValue, { color: t.success }]}>{(userProfile.co2_saved_kg || 0).toFixed(0)}kg</Text>
            </View>
            <Text style={[styles.statLabel, { color: t.success }]}>CO₂ Saved</Text>
            <Text style={[styles.statHint, { color: t.success, opacity: 0.75 }]}>₹{(userProfile.money_saved || 0).toFixed(0)} saved</Text>
          </View>
        </View>

        {/* Registered Vehicle detail */}
        {userProfile.vehicle ? (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Car color={t.primary} size={18} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>Registered Vehicle</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ fontSize: 11, color: t.textSecondary }}>Vehicle Number</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary, marginTop: 2 }}>{userProfile.vehicle.vehicleNumber}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ fontSize: 11, color: t.textSecondary }}>Vehicle Type</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary, marginTop: 2 }}>{userProfile.vehicle.type}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ fontSize: 11, color: t.textSecondary }}>Capacity / Fuel</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary, marginTop: 2 }}>
                  {userProfile.vehicle.capacity} seats ({userProfile.vehicle.fuelType})
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Message Sticky Action Button */}
      {me?.id !== userProfile.id && (
        <View style={[styles.stickyCtaContainer, { backgroundColor: t.surface, borderTopColor: t.border }]}>
          <TouchableOpacity activeOpacity={0.8} style={[styles.messageBtn, { backgroundColor: t.primary }]} onPress={handleMessage}>
            <MessageCircle color={t.primaryContrast} size={18} />
            <Text style={[styles.messageBtnText, { color: t.primaryContrast }]}>Message {userProfile.name}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, gap: 6 },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginTop: 12, textAlign: 'center', width: '100%' },
  email: { fontSize: 13, textAlign: 'center', width: '100%' },
  bioText: {
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: spacing.md,
    lineHeight: 18,
  },
  communityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  communityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  communityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  metaText: { fontSize: 12 },
  metaDot: { fontSize: 14 },
  card: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 12 },
  levelIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levelName: { fontSize: 14, fontWeight: '700' },
  levelHint: { fontSize: 11, marginTop: 2 },
  levelPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  levelPillText: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statHint: { fontSize: 10 },
  stickyCtaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  messageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  messageBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
