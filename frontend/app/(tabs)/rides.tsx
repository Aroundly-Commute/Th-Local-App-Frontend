import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, RefreshControl } from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { Clock, MessageCircle, Phone, Star, CheckCircle2, XCircle, Car } from 'lucide-react-native';
import { api } from '../../src/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/theme';
import { VerifiedAvatar } from '../../src/components';
import { Shimmer } from '../../src/Shimmer';
import { tap } from '../../src/haptics';

export default function Rides() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [data, setData] = useState<{ upcoming: any[]; past: any[] }>({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/rides/my');
      setData(data);
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = tab === 'upcoming' ? data.upcoming : data.past;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 12 }}>
        <Text style={[styles.h1, { color: t.textPrimary }]}>My Rides</Text>
        <View style={[styles.tabBar, { backgroundColor: t.muted }]}>
          <TabBtn testID="tab-upcoming" label="Upcoming" count={data.upcoming.length}
            active={tab === 'upcoming'} t={t} onPress={() => { tap(); setTab('upcoming'); }} />
          <TabBtn testID="tab-past" label="Past" count={data.past.length}
            active={tab === 'past'} t={t} onPress={() => { tap(); setTab('past'); }} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.textPrimary} />}
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
              {tab === 'upcoming' ? 'No upcoming rides' : 'No past rides'}
            </Text>
            <Text style={[styles.emptyHint, { color: t.textSecondary }]}>
              {tab === 'upcoming' ? 'Book a ride or offer one to get started' : 'Your ride history will appear here'}
            </Text>
            {tab === 'upcoming' && (
              <TouchableOpacity testID="empty-cta" onPress={() => { tap(); router.push('/(tabs)/search'); }}
                activeOpacity={0.8} style={[styles.emptyCta, { backgroundColor: t.primary }]}>
                <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 14 }}>Find a Ride</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : list.map((r) => (
          <RideCardExt key={r.id + r.role} r={r} t={t} isPast={tab === 'past'} router={router} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const RideCardExt: React.FC<{ r: any; t: Theme; isPast: boolean; router: any }> = ({ r, t, isPast, router }) => {
  const date = new Date(r.departure_time);
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const status = isPast ? 'Completed' : 'Confirmed';
  const statusColor = isPast ? t.textSecondary : t.success;
  const statusBg = isPast ? t.muted : t.successBg;

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
          {isPast ? <CheckCircle2 color={statusColor} size={12} /> : <CheckCircle2 color={statusColor} size={12} />}
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </View>
        <Text style={[styles.role, { color: t.textTertiary }]}>
          {r.role === 'driver' ? "You're driving" : "You're riding"}
        </Text>
      </View>

      {/* Driver/passenger + price */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <VerifiedAvatar uri={r.driver_avatar} name={r.driver_name} verified={r.driver_verified} t={t} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: t.textPrimary }]}>{r.driver_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Star color={t.warning} size={11} fill={t.warning} />
            <Text style={[styles.meta, { color: t.textSecondary }]}>{r.driver_rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.price, { color: t.textPrimary }]}>${r.price_per_seat.toFixed(2)}</Text>
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

      {/* Vehicle info */}
      {!isPast && r.driver_vehicle?.model && (
        <View style={[styles.vehicleBox, { backgroundColor: t.muted }]}>
          <Car color={t.textSecondary} size={13} />
          <Text style={[styles.vehicleText, { color: t.textSecondary }]}>
            {r.driver_vehicle.make} {r.driver_vehicle.model} · {r.driver_vehicle.color}
          </Text>
          <Text style={[styles.plate, { color: t.textPrimary }]}>{r.driver_vehicle.license_plate}</Text>
        </View>
      )}

      {/* Actions */}
      {!isPast && r.chat_id && (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            testID={`myride-message-${r.id}`}
            onPress={(e) => {
              e.stopPropagation();
              tap();
              router.push(`/chat/${encodeURIComponent(r.chat_id)}?name=${encodeURIComponent(r.driver_name)}`);
            }}
            activeOpacity={0.8}
            style={[styles.actionBtn, { borderColor: t.border }]}
          >
            <MessageCircle color={t.textPrimary} size={14} />
            <Text style={[styles.actionText, { color: t.textPrimary }]}>Message</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.8} style={[styles.actionBtn, { borderColor: t.border }]} onPress={() => tap()}>
            <Phone color={t.textPrimary} size={14} />
            <Text style={[styles.actionText, { color: t.textPrimary }]}>Call</Text>
          </TouchableOpacity>
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
  tabBtnText: { fontSize: 14 },
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
  vehicleBox: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm },
  vehicleText: { flex: 1, fontSize: 12 },
  plate: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1 },
  actionText: { fontSize: 13, fontWeight: '600' },
  rateBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1 },
  empty: { alignItems: 'center', padding: 40, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  emptyCta: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.md },
});
