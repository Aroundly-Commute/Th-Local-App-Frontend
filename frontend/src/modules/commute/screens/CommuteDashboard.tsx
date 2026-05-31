import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  RefreshControl, Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  MapPin, Users, Calendar, Leaf, Search as SearchIcon,
  ChevronRight, Star, Clock, Car, Key, Bus, Menu, User
} from 'lucide-react-native';
import { useAuth } from '../../../core/auth/auth';
import { api } from '../../../core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../../core/theme/theme';
import { Shimmer } from '../../../core/components/Shimmer';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';
import { RideCard } from '../components/RideCard';
import { tap } from '../../../core/utils/haptics';
import { useFeatureFlags } from '../../../services/feature-flag/FeatureFlagContext';

const DEFAULT_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCvOV1jObrq5oK5d_aSWk_-gP08TXZGKy2FQfQTkQOj0b9mZZwD3wAzwAVjoaQTqkoAIOzVgev_y_tWS2PVARwC56wJ2gYaXqwiItduC8hpSxEAN6-zH7ZdPvgSSHSz2MlBEQXovbeP8WK5vYC--cHnTw8sqU7tfqiTtT4st9jWMedWQv18afXKW85OwYm_Dtd4eQ_jUPfEFcqJnevBOq6s-9dkNjB9mx6kUC3swb2Pa9epFywK7yl1hafYTSb_RkCmwwb2g_oOqbLT';

const ParkingIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{
    width: size,
    height: size,
    borderWidth: 2.5,
    borderColor: color,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Text style={{
      color: color,
      fontSize: size * 0.65,
      fontWeight: '900',
      lineHeight: size * 0.75,
      textAlign: 'center',
    }}>P</Text>
  </View>
);

export default function CommuteDashboard() {
  const { enableRideSharing, enableParking } = useFeatureFlags();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [myRides, setMyRides] = useState<any>({ upcoming: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const load = useCallback(async () => {
    try {
      const [s, r, m] = await Promise.all([
        api.get('/sustainability/me'),
        api.get('/rides'),
        api.get('/rides/my'),
      ]);
      setStats(s.data);
      setRides(r.data.slice(0, 3));
      setMyRides(m.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const upcoming = myRides.upcoming?.[0];

  const services = [
    {
      label: 'Car Pooling',
      icon: Car,
      onPress: () => router.push('/commute/search'),
    },
    {
      label: 'Parking',
      icon: null,
      onPress: () => router.push('/parking'),
    },
    {
      label: 'Car Rental',
      icon: Key,
      onPress: () => router.push({ pathname: '/coming-soon' as any, params: { feature: 'Car Rental' } }),
    },
    {
      label: 'Transport',
      icon: Bus,
      onPress: () => router.push({ pathname: '/coming-soon' as any, params: { feature: 'Transport' } }),
    },
  ];

  const isDark = cs === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      {/* Top App Bar Header */}
      <View style={[styles.header, { backgroundColor: t.background, borderBottomWidth: 1, borderBottomColor: t.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity activeOpacity={0.7}>
            <Menu color={t.textPrimary} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Aroundly</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings')}
          activeOpacity={0.7}
          style={[styles.profileButton, { borderColor: isDark ? t.border : '#61f8f8' }]}
        >
          <Image
            source={{ uri: user?.avatar_url || DEFAULT_AVATAR }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.textPrimary} />}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[2]}
      >
        {/* Greeting */}
        <Text style={[styles.greet, { color: t.textSecondary }]}>{greeting}</Text>
        <Text style={[styles.title, { color: t.textPrimary }]}>Where to today?</Text>

        {/* Quick search */}
        <View style={{ backgroundColor: t.background, paddingTop: spacing.sm, paddingBottom: spacing.sm, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg }}>
          <TouchableOpacity
            testID="home-search-bar"
            onPress={() => { tap(); router.push('/commute/search'); }}
            activeOpacity={0.7}
            style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <SearchIcon color={t.textSecondary} size={18} />
            <Text style={[styles.searchText, { color: t.textSecondary }]}>Search destination…</Text>
          </TouchableOpacity>
        </View>

        {/* Services Grid */}
        <View style={styles.actions}>
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <TouchableOpacity
                key={s.label}
                testID={`action-${s.label}`}
                onPress={() => { tap(); s.onPress(); }}
                activeOpacity={0.75}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: isDark ? t.surface : '#FFFFFF',
                    borderColor: isDark ? t.border : '#61f8f8',
                  }
                ]}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: isDark ? t.muted : '#eff4ff' }]}>
                  {Icon ? (
                    <Icon color={isDark ? t.primary : '#006a6a'} size={24} strokeWidth={2} />
                  ) : (
                    <ParkingIcon color={isDark ? t.primary : '#006a6a'} size={24} />
                  )}
                </View>
                <Text style={[styles.actionLabel, { color: t.textPrimary }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

      {/* Upcoming ride */}
      {upcoming && (
        <>
          <SectionHeader t={t} title="Upcoming Ride" actionLabel="View all" onAction={() => router.push('/commute/rides')} />
          <TouchableOpacity
            testID="home-upcoming"
            activeOpacity={0.8}
            onPress={() => { tap(); router.push(`/ride/${upcoming.id}` as any); }}
            style={[styles.upcomingCard, { backgroundColor: t.textPrimary }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <VerifiedAvatar uri={upcoming.driver_avatar} name={upcoming.driver_name} verified={upcoming.driver_verified} t={{ ...t, background: '#333' } as Theme} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.upcomingName, { color: t.background }]}>{upcoming.driver_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Star color={t.warning} size={12} fill={t.warning} />
                  <Text style={[styles.upcomingMeta, { color: t.background, opacity: 0.7 }]}>
                    {upcoming.driver_rating?.toFixed(1)}
                  </Text>
                </View>
              </View>
              <View style={[styles.todayPill, { backgroundColor: t.background }]}>
                <Text style={[styles.todayText, { color: t.textPrimary }]}>
                  {new Date(upcoming.departure_time).toLocaleDateString([], { weekday: 'short' })}
                </Text>
              </View>
            </View>
            <View style={styles.upcomingRoute}>
              <View style={{ flex: 1, gap: 6 }}>
                <Text style={[styles.upcomingLoc, { color: t.background }]} numberOfLines={1}>{upcoming.origin}</Text>
                <Text style={[styles.upcomingLoc, { color: t.background, opacity: 0.6 }]} numberOfLines={1}>
                  → {upcoming.destination}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock color={t.background} size={12} />
                  <Text style={[styles.upcomingMeta, { color: t.background }]}>
                    {new Date(upcoming.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={[styles.upcomingPrice, { color: t.background }]}>${upcoming.price_per_seat.toFixed(2)}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </>
      )}

      {/* Nearby rides */}
      <SectionHeader t={t} title="Rides Near You" actionLabel="See all" onAction={() => router.push('/commute/search')} />
      {loading ? (
        <View style={{ gap: 12 }}>
          <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
          <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {rides.map((r) => (
            <RideCard key={r.id} ride={r} t={t} testID={`home-ride-${r.id}`}
              onPress={() => { tap(); router.push(`/ride/${r.id}` as any); }} />
          ))}
        </View>
      )}

      {/* Impact stats */}
      <View style={[styles.impact, { backgroundColor: t.successBg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Leaf color={t.success} size={16} />
          <Text style={[styles.impactTitle, { color: t.success }]}>Your Green Impact</Text>
          <Text style={[styles.impactMonth, { color: t.success, opacity: 0.7 }]}>· This month</Text>
        </View>
        <View style={styles.impactRow}>
          <ImpactStat label="Rides Shared" value={`${stats?.rides_count ?? 0}`} t={t} />
          <View style={[styles.impactDivider, { backgroundColor: t.success, opacity: 0.15 }]} />
          <ImpactStat label="CO₂ Saved" value={`${stats?.co2_saved_kg?.toFixed(1) ?? '0.0'}kg`} t={t} />
          <View style={[styles.impactDivider, { backgroundColor: t.success, opacity: 0.15 }]} />
          <ImpactStat label="Money Saved" value={`$${stats?.money_saved?.toFixed(0) ?? '0'}`} t={t} testID="money-saved" />
        </View>
      </View>
    </ScrollView>
    </View>
  );
}

const SectionHeader: React.FC<{ t: Theme; title: string; actionLabel?: string; onAction?: () => void }> = ({ t, title, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>{title}</Text>
    {actionLabel ? (
      <TouchableOpacity onPress={() => { tap(); onAction?.(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Text style={[styles.sectionAction, { color: t.textPrimary }]}>{actionLabel}</Text>
        <ChevronRight color={t.textPrimary} size={14} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const ImpactStat: React.FC<{ label: string; value: string; t: Theme; testID?: string }> = ({ label, value, t, testID }) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
    <Text testID={testID} style={[styles.impactValue, { color: t.success }]}>{value}</Text>
    <Text style={[styles.impactLabel, { color: t.success, opacity: 0.75 }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  greet: { fontSize: 13, marginTop: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginTop: 2, marginBottom: spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1 },
  searchText: { fontSize: 15 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  sectionAction: { fontSize: 13, fontWeight: '600' },
  upcomingCard: { padding: spacing.md, borderRadius: radius.lg, gap: 14 },
  upcomingName: { fontSize: 15, fontWeight: '600' },
  upcomingMeta: { fontSize: 12 },
  todayPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  todayText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  upcomingRoute: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  upcomingLoc: { fontSize: 13, fontWeight: '500' },
  upcomingPrice: { fontSize: 16, fontWeight: '700' },
  impact: { marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.lg, gap: 12 },
  impactTitle: { fontSize: 14, fontWeight: '700' },
  impactMonth: { fontSize: 12, fontWeight: '500' },
  impactRow: { flexDirection: 'row', alignItems: 'center' },
  impactDivider: { width: 1, height: 32, marginHorizontal: 4 },
  impactValue: { fontSize: 18, fontWeight: '700' },
  impactLabel: { fontSize: 11, fontWeight: '500' },
});
