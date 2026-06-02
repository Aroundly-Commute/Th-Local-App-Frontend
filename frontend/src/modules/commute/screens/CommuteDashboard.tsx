import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  RefreshControl, Dimensions,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  MapPin, Users, Calendar, Leaf, Search as SearchIcon,
  ChevronRight, Star, Clock,
} from 'lucide-react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useAuth } from '../../../core/auth/auth';
import { api } from '../../../core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../../core/theme/theme';
import { Shimmer } from '../../../core/components/Shimmer';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';
import { RideCard } from '../components/RideCard';
import { tap } from '../../../core/utils/haptics';
import { useFeatureFlags } from '../../../services/feature-flag/FeatureFlagContext';

const CarPoolingIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill={color} />
  </Svg>
);

const ParkingIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12.5 3H7v18h3v-6h2.5c3.58 0 6.5-2.92 6.5-6.5S16.08 3 12.5 3zm0 10H10V6h2.5c1.93 0 3.5 1.57 3.5 3.5S14.43 13 12.5 13z" fill={color} />
  </Svg>
);

const CarRentalIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v3h3v-3h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill={color} />
  </Svg>
);

const PublicTransportIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z" fill={color} />
  </Svg>
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
      setRides(r.data.slice(0, 5));
      setMyRides(m.data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const upcomingRides = (myRides.upcoming || []).slice(0, 5);
  const nearbyRides = (rides || []).slice(0, 5);

  const { width: screenWidth } = Dimensions.get('window');
  const containerWidth = screenWidth - spacing.lg * 2;

  const hasMultipleUpcoming = upcomingRides.length > 1;
  const upcomingCardWidth = hasMultipleUpcoming ? containerWidth * 0.85 : containerWidth;

  const hasMultipleNearby = nearbyRides.length > 1;
  const nearbyCardWidth = hasMultipleNearby ? containerWidth * 0.85 : containerWidth;

  const services = [
    {
      label: 'Car Pooling',
      icon: CarPoolingIcon,
      onPress: () => router.push('/commute/search'),
    },
    {
      label: 'Parking',
      icon: ParkingIcon,
      onPress: () => router.push('/parking'),
    },
    {
      label: 'Car Rental',
      icon: CarRentalIcon,
      onPress: () => router.push({ pathname: '/coming-soon' as any, params: { feature: 'Car Rental' } }),
    },
    {
      label: 'Public Transport',
      icon: PublicTransportIcon,
      onPress: () => router.push({ pathname: '/coming-soon' as any, params: { feature: 'Public Transport' } }),
    },
  ];

  const isDark = cs === 'dark';

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: 24 }}
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
                <Icon color={isDark ? t.primary : '#006a6a'} size={24} />
              </View>
              <Text style={[styles.actionLabel, { color: t.textPrimary }]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Upcoming ride */}
      {upcomingRides.length > 0 && (
        <>
          <SectionHeader t={t} title="Upcoming Ride" actionLabel="View all" onAction={() => router.push('/commute/rides')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={upcomingCardWidth + 12}
            snapToAlignment="start"
            style={{ marginHorizontal: -spacing.lg }}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
          >
            {upcomingRides.map((rideItem) => (
              <TouchableOpacity
                key={rideItem.id}
                testID={`home-upcoming-${rideItem.id}`}
                activeOpacity={0.8}
                onPress={() => { tap(); router.push(`/ride/${rideItem.id}` as any); }}
                style={[
                  styles.upcomingCard,
                  {
                    backgroundColor: t.textPrimary,
                    width: upcomingCardWidth,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <VerifiedAvatar
                    uri={rideItem.driver_avatar}
                    name={rideItem.driver_name}
                    verified={rideItem.driver_verified}
                    t={{ ...t, background: '#333' } as Theme}
                    size={44}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.upcomingName, { color: t.background }]} numberOfLines={1}>
                      {rideItem.driver_name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Star color={t.warning} size={12} fill={t.warning} />
                      <Text style={[styles.upcomingMeta, { color: t.background, opacity: 0.7 }]}>
                        {rideItem.driver_rating?.toFixed(1) ?? '5.0'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.todayPill, { backgroundColor: t.background }]}>
                    <Text style={[styles.todayText, { color: t.textPrimary }]}>
                      {new Date(rideItem.departure_time).toLocaleDateString([], { weekday: 'short' })}
                    </Text>
                  </View>
                </View>
                <View style={styles.upcomingRoute}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[styles.upcomingLoc, { color: t.background }]} numberOfLines={1}>
                      {rideItem.origin}
                    </Text>
                    <Text style={[styles.upcomingLoc, { color: t.background, opacity: 0.6 }]} numberOfLines={1}>
                      → {rideItem.destination}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock color={t.background} size={12} />
                      <Text style={[styles.upcomingMeta, { color: t.background }]}>
                        {new Date(rideItem.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <Text style={[styles.upcomingPrice, { color: t.background }]}>
                      ₹{Math.round(rideItem.price_per_seat)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Nearby rides */}
      {(loading || (nearbyRides && nearbyRides.length > 0)) && (
        <>
          <SectionHeader t={t} title="Rides Near You" actionLabel="See all" onAction={() => router.push('/commute/search')} />
          {loading ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -spacing.lg }}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
            >
              <Shimmer style={{ width: nearbyCardWidth, height: 150, borderRadius: radius.lg }} />
              <Shimmer style={{ width: nearbyCardWidth, height: 150, borderRadius: radius.lg }} />
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={nearbyCardWidth + 12}
              snapToAlignment="start"
              style={{ marginHorizontal: -spacing.lg }}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
            >
              {nearbyRides.map((r) => (
                <RideCard
                  key={r.id}
                  ride={r}
                  t={t}
                  testID={`home-ride-${r.id}`}
                  onPress={() => { tap(); router.push(`/ride/${r.id}` as any); }}
                  style={{ width: nearbyCardWidth }}
                />
              ))}
            </ScrollView>
          )}
        </>
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
          <ImpactStat label="Money Saved" value={`₹${stats?.money_saved?.toFixed(0) ?? '0'}`} t={t} testID="money-saved" />
        </View>
      </View>
    </ScrollView>
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
