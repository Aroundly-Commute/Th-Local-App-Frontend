import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  MapPin, Users, Calendar, Leaf, Search as SearchIcon,
  ArrowRight, ChevronRight, Star, Clock,
} from 'lucide-react-native';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/theme';
import { Shimmer } from '../../src/Shimmer';
import { VerifiedAvatar, RideCard } from '../../src/components';
import { tap } from '../../src/haptics';
import { ModeSwitcher } from '../../src/ModeSwitcher';
import { useMarketData } from '../../src/contexts/MarketDataContext';
import MarketDashboard from '../../src/market/MarketDashboard';
import { useFeatureFlags } from '../../src/services/feature-flag/FeatureFlagContext';

export default function Home() {
  const { enableMarketplace, enableRideSharing, enableParking } = useFeatureFlags();
  const { activeMode } = useMarketData();
  const effectiveMode = !enableMarketplace ? 'pooling' : !enableRideSharing ? 'marketplace' : activeMode;
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

  const actions = [];
  if (enableRideSharing) {
    actions.push(
      { icon: MapPin, label: 'Find Ride', onPress: () => router.push('/(tabs)/search') },
      { icon: Users, label: 'Offer Ride', onPress: () => router.push({ pathname: '/(tabs)/search', params: { mode: 'offer' } }) },
      { icon: Calendar, label: 'Schedule', onPress: () => router.push('/(tabs)/rides') }
    );
  }
  if (enableParking) {
    actions.push(
      { icon: MapPin, label: 'Parking', onPress: () => router.push('/(tabs)/parking') }
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      <ModeSwitcher />
      {effectiveMode === 'marketplace' ? (
        <MarketDashboard />
      ) : (
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
            onPress={() => { tap(); router.push('/(tabs)/search'); }}
            activeOpacity={0.7}
            style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <SearchIcon color={t.textSecondary} size={18} />
            <Text style={[styles.searchText, { color: t.textSecondary }]}>Search destination…</Text>
          </TouchableOpacity>
        </View>

        {/* Quick actions */}
        <View style={styles.actions}>
          {actions.map((a) => {
            const Icon = a.icon;
            return (
              <TouchableOpacity
                key={a.label}
                testID={`action-${a.label}`}
                onPress={() => { tap(); a.onPress(); }}
                activeOpacity={0.7}
                style={[styles.actionCard, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <View style={[styles.actionIcon, { backgroundColor: t.muted }]}>
                  <Icon color={t.textPrimary} size={18} strokeWidth={2} />
                </View>
                <Text style={[styles.actionLabel, { color: t.textPrimary }]}>{a.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Upcoming ride */}
        {upcoming && (
          <>
            <SectionHeader t={t} title="Upcoming Ride" actionLabel="View all" onAction={() => router.push('/(tabs)/rides')} />
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
        <SectionHeader t={t} title="Rides Near You" actionLabel="See all" onAction={() => router.push('/(tabs)/search')} />
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
      )}
    </SafeAreaView>
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
  greet: { fontSize: 13, marginTop: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginTop: 2, marginBottom: spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1 },
  searchText: { fontSize: 15 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: spacing.md },
  actionCard: { width: '47.5%', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 10, minHeight: 90 },
  actionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '600' },
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
