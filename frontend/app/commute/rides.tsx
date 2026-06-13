import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, RefreshControl, Platform, ActivityIndicator } from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { Clock, MessageCircle, Phone, Star, CheckCircle2, Car, AlertCircle, Users, RefreshCw } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { Shimmer } from '../../src/core/components/Shimmer';
import { tap } from '../../src/core/utils/haptics';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';

export default function Rides() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'requested' | 'past'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);
  const [limit, setLimit] = useState(10);

  // Dynamic cache key that depends on the pagination limit
  const { data: res, isLoading: cacheLoading, refetch: refresh } = useQuery({
    queryKey: ['rides', 'my', limit],
    queryFn: async () => {
      const { data } = await api.get(`/rides/my?page=1&limit=${limit}`);
      return data;
    }
  });

  const upcomingList = res?.upcoming || [];
  const requestedList = res?.requested || [];
  const pastList = res?.past || [];

  const totalUpcomingCount = res?.totalUpcomingCount ?? upcomingList.length;
  const totalRequestedCount = res?.totalRequestedCount ?? requestedList.length;
  const totalPastCount = res?.totalPastCount ?? pastList.length;

  const hasMore = tab === 'upcoming' ? res?.hasMoreUpcoming : tab === 'requested' ? res?.hasMoreRequested : res?.hasMorePast;

  const loading = cacheLoading && !res;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {} finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      refresh().catch(() => {});
    }, [refresh])
  );

  const list = tab === 'upcoming' ? upcomingList : tab === 'requested' ? requestedList : pastList;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader 
        title="My Rides" 
        rightComponent={Platform.OS === 'web' ? (
          <TouchableOpacity 
            onPress={handleRefresh} 
            disabled={refreshing}
            activeOpacity={0.7} 
            style={{ 
              padding: 6, 
              borderRadius: 18, 
              backgroundColor: t.muted,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={t.primary} />
            ) : (
              <RefreshCw color={t.textPrimary} size={14} />
            )}
          </TouchableOpacity>
        ) : undefined}
      />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 12 }}>
        <View style={[styles.tabBar, { backgroundColor: t.muted }]}>
          <TabBtn testID="tab-upcoming" label="Upcoming" count={totalUpcomingCount}
            active={tab === 'upcoming'} t={t} onPress={() => { tap(); setTab('upcoming'); }} />
          <TabBtn testID="tab-requested" label="Requested" count={totalRequestedCount}
            active={tab === 'requested'} t={t} onPress={() => { tap(); setTab('requested'); }} />
          <TabBtn testID="tab-past" label="Past" count={totalPastCount}
            active={tab === 'past'} t={t} onPress={() => { tap(); setTab('past'); }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140, gap: 12 }}
        refreshControl={Platform.OS !== 'web' ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.textPrimary} /> : undefined}
      >
        {loading ? (
          <>
            <Shimmer style={{ height: 170, borderRadius: radius.lg }} />
            <Shimmer style={{ height: 170, borderRadius: radius.lg }} />
          </>
        ) : list.length === 0 ? (
          <View style={styles.empty}>
            <Car color={t.textTertiary} size={42} />
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>
              {tab === 'upcoming' ? 'No upcoming rides' : tab === 'requested' ? 'No pending requests' : 'No past rides'}
            </Text>
            <Text style={[styles.emptyHint, { color: t.textSecondary }]}>
              {tab === 'upcoming' ? 'Book a ride or offer one to get started'
                : tab === 'requested' ? 'When you request a ride it will appear here'
                : 'Your ride history will appear here'}
            </Text>
            {tab !== 'past' && (
              <TouchableOpacity testID="empty-cta" onPress={() => { tap(); router.push('/commute/search'); }}
                activeOpacity={0.8} style={[styles.emptyCta, { backgroundColor: t.primary }]}>
                <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 14 }}>
                  {tab === 'upcoming' ? 'Find a Ride' : 'Search Rides'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {list.map((r: any) => (
              <RideCardExt key={`${r.id}-${r.role}-${r.request_id || ''}`} r={r} t={t} isPast={tab === 'past'} isRequested={tab === 'requested'} router={router} />
            ))}
            {hasMore && (
              <TouchableOpacity
                onPress={() => { tap(); setLimit(prev => prev + 10); }}
                activeOpacity={0.8}
                style={[styles.showMoreBtn, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <Text style={[styles.showMoreText, { color: t.textPrimary }]}>Show More</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const RideCardExt: React.FC<{ r: any; t: Theme; isPast: boolean; isRequested: boolean; router: any }> = ({ r, t, isPast, isRequested, router }) => {
  const date = new Date(r.departure_time);
  const dateStr = isNaN(date.getTime()) ? '—' : date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' });
  const timeStr = isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  const isDriver = r.role === 'driver';

  const statusLabel = isPast
    ? (r.request_status === 'REQUESTED' ? 'Expired' : 'Completed')
    : isRequested ? 'Pending'
    : 'Confirmed';
  const statusColor = isPast ? t.textSecondary : isRequested ? t.warning : t.success;
  const statusBg = isPast ? t.muted : isRequested ? (t.isDark ? '#2a2010' : '#fff8e1') : t.successBg;

  // Driver: show passengers count, Rider: show driver name
  const peerName = r.peer_name || r.driver_name || 'Unknown';

  // Chat: driver -> first passenger chat, rider -> their own chat with driver
  const chatId = r.chat_id;

  return (
    <TouchableOpacity
      testID={`myride-${r.id}`}
      activeOpacity={0.8}
      onPress={() => router.push(`/ride/${r.id}`)}
      style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}
    >
      {/* Status row */}
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          {isPast && r.request_status !== 'REQUESTED' ? <CheckCircle2 color={statusColor} size={12} />
            : <AlertCircle color={statusColor} size={12} />}
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={[styles.role, { color: t.textTertiary }]}>
          {isDriver ? "You're driving" : "You're riding"}
        </Text>
      </View>

      {/* Driver/passenger + price */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <VerifiedAvatar uri={r.driver_avatar} name={r.driver_name} verified={isDriver} t={t} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.textPrimary }]}>
            {isDriver ? `${r.driver_name} (You)` : r.driver_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Star color={t.warning} size={11} fill={t.warning} />
            <Text style={[styles.meta, { color: t.textSecondary }]}>{(r.driver_rating ?? 5).toFixed(1)}</Text>
            {isDriver && r.passengers?.length > 0 && (
              <>
                <Text style={[styles.meta, { color: t.textTertiary }]}> · </Text>
                <Users color={t.textTertiary} size={11} />
                <Text style={[styles.meta, { color: t.textTertiary }]}>{r.passengers.length} passenger{r.passengers.length > 1 ? 's' : ''}</Text>
              </>
            )}
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.price, { color: t.textPrimary }]}>${(r.price_per_seat ?? 0).toFixed(0)}</Text>
          <Text style={[styles.meta, { color: t.textSecondary }]}>{dateStr}</Text>
        </View>
      </View>

      {/* Route */}
      <View style={{ gap: 4 }}>
        <View style={styles.locRow}>
          <View style={[styles.dot, { backgroundColor: t.textPrimary }]} />
          <Text style={[styles.loc, { color: t.textPrimary }]} numberOfLines={1}>{r.origin}</Text>
          <View style={[styles.timePill, { backgroundColor: t.muted }]}>
            <Clock color={t.textSecondary} size={10} />
            <Text style={[styles.timeText, { color: t.textSecondary }]}>{timeStr}</Text>
          </View>
        </View>
        <View style={[styles.vLine, { backgroundColor: t.border }]} />
        <View style={styles.locRow}>
          <View style={[styles.dot, { borderColor: t.textPrimary, borderWidth: 2, backgroundColor: t.background }]} />
          <Text style={[styles.loc, { color: t.textPrimary }]} numberOfLines={1}>{r.destination}</Text>
        </View>
      </View>

      {/* Action buttons — only for non-past, non-requested rides with a chat */}
      {!isPast && !isRequested && chatId && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            testID={`myride-message-${r.id}`}
            onPress={(e) => {
              e.stopPropagation();
              tap();
              router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(peerName)}`);
            }}
            activeOpacity={0.8}
            style={[styles.actionBtn, { borderColor: t.border }]}
          >
            <MessageCircle color={t.textPrimary} size={14} />
            <Text style={[styles.actionText, { color: t.textPrimary }]}>
              {isDriver ? `Message ${peerName.split(' ')[0]}` : 'Message Driver'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={[styles.actionBtn, { borderColor: t.border }]} onPress={() => tap()}>
            <Phone color={t.textPrimary} size={14} />
            <Text style={[styles.actionText, { color: t.textPrimary }]}>Call</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Pending request hint */}
      {isRequested && (
        <View style={{ backgroundColor: statusBg, borderRadius: radius.sm, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Clock color={statusColor} size={13} strokeWidth={2.5} />
          <Text style={{ color: statusColor, fontSize: 12, fontWeight: '600', flex: 1 }}>
            Waiting for driver to accept your request
          </Text>
        </View>
      )}

      {isPast && (
        <View style={[styles.rateBox, { borderTopColor: t.border }]}>
          <Text style={{ color: t.textSecondary, fontSize: 12 }}>Rate this ride</Text>
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} color={t.textTertiary} size={16} />
            ))}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const TabBtn: React.FC<{ label: string; active: boolean; count: number; t: Theme; onPress: () => void; testID?: string }>
  = ({ label, active, count, t, onPress, testID }) => (
  <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8}
    style={[styles.tabBtn, active && { backgroundColor: t.background }]}>
    <Text style={[styles.tabBtnText, { color: active ? t.textPrimary : t.textSecondary, fontWeight: active ? '700' : '500' }]}>
      {label}
    </Text>
    {count > 0 ? (
      <View style={[styles.tabBadge, { backgroundColor: active ? t.textPrimary : t.border }]}>
        <Text style={[styles.tabBadgeText, { color: active ? t.background : t.textSecondary }]}>{count}</Text>
      </View>
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginBottom: spacing.md },
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: radius.md, gap: 2, marginBottom: 8 },
  tabBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm + 2 },
  tabBtnText: { fontSize: 13 },
  tabBadge: { minWidth: 20, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 9999, alignItems: 'center' },
  tabBadgeText: { fontSize: 11, fontWeight: '700' },
  card: { padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  statusText: { fontSize: 11, fontWeight: '700' },
  role: { fontSize: 11, fontWeight: '500' },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 12 },
  price: { fontSize: 17, fontWeight: '700' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  vLine: { width: 2, height: 14, marginLeft: 3 },
  loc: { flex: 1, fontSize: 13, fontWeight: '500' },
  timePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  timeText: { fontSize: 11, fontWeight: '600' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: '600' },
  rateBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  empty: { alignItems: 'center', padding: 40, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  emptyCta: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
  showMoreBtn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
