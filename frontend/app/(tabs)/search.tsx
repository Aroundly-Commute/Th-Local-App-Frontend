import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  useColorScheme, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin, Search as SearchIcon, Calendar, Clock, Users, X,
  ArrowDownUp, SlidersHorizontal, Star,
} from 'lucide-react-native';
import { api } from '../../src/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/theme';
import { RideCard } from '../../src/components';
import { Shimmer } from '../../src/Shimmer';
import { tap } from '../../src/haptics';

const RECENT = [
  { from: 'San Francisco, CA', to: 'Palo Alto, CA' },
  { from: 'Oakland, CA', to: 'San Jose, CA' },
  { from: 'Berkeley, CA', to: 'San Francisco, CA' },
];

const POPULAR = ['San Francisco → Palo Alto', 'Oakland → San Jose', 'Berkeley → SF', 'Mountain View → SF'];

export default function Search() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [mode, setMode] = useState<'find' | 'offer'>('find');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(async (q?: string) => {
    setLoading(true); setSearched(true);
    try {
      const params: any = {};
      if (q) params.q = q;
      else if (to) params.q = to;
      const { data } = await api.get('/rides', { params });
      setRides(data);
    } catch {} finally { setLoading(false); }
  }, [to]);

  const quickSearch = (f: string, dest: string) => {
    tap();
    setFrom(f); setTo(dest);
    runSearch(dest);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: 12 }}>
          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: t.muted }]}>
            <TabBtn testID="tab-find" label="Find a Ride" active={mode === 'find'} t={t} onPress={() => { tap(); setMode('find'); }} />
            <TabBtn testID="tab-offer" label="Offer a Ride" active={mode === 'offer'} t={t} onPress={() => { tap(); setMode('offer'); }} />
          </View>

          {/* From / To inputs */}
          <View style={{ gap: 8, marginTop: spacing.md }}>
            <InputRow
              testID="search-from"
              icon={<View style={[styles.dot, { backgroundColor: t.textPrimary }]} />}
              t={t} value={from} onChangeText={setFrom} placeholder="From" onClear={() => setFrom('')}
            />
            <InputRow
              testID="search-to"
              icon={<View style={[styles.dot, { borderColor: t.textPrimary, borderWidth: 2, backgroundColor: t.background }]} />}
              t={t} value={to} onChangeText={setTo} placeholder="To" onClear={() => setTo('')}
              onSubmit={() => runSearch()}
            />
          </View>

          {/* Filters */}
          <View style={[styles.filters, { marginTop: spacing.sm }]}>
            <FilterChip t={t} icon={<Calendar color={t.textSecondary} size={14} />} label="Today" />
            <FilterChip t={t} icon={<Clock color={t.textSecondary} size={14} />} label="Any time" />
            <FilterChip t={t} icon={<Users color={t.textSecondary} size={14} />} label="1 seat" />
          </View>

          <TouchableOpacity
            testID="search-submit"
            onPress={() => { tap(); runSearch(); }}
            activeOpacity={0.8}
            style={[styles.cta, { backgroundColor: t.primary, marginTop: spacing.md }]}
          >
            <Text style={[styles.ctaText, { color: t.primaryContrast }]}>
              {mode === 'find' ? 'Search Rides' : 'Create Offer'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: 140 }}>
          {!searched ? (
            <>
              <Text style={[styles.section, { color: t.textPrimary }]}>Recent Searches</Text>
              <View style={{ gap: 8 }}>
                {RECENT.map((r, i) => (
                  <TouchableOpacity
                    key={i}
                    testID={`recent-${i}`}
                    onPress={() => quickSearch(r.from, r.to)}
                    activeOpacity={0.7}
                    style={[styles.recentRow, { backgroundColor: t.surface, borderColor: t.border }]}
                  >
                    <View style={[styles.recentIcon, { backgroundColor: t.muted }]}>
                      <MapPin color={t.textPrimary} size={14} />
                    </View>
                    <Text style={[styles.recentText, { color: t.textPrimary }]} numberOfLines={1}>
                      <Text style={{ fontWeight: '600' }}>{r.from}</Text>
                      <Text style={{ color: t.textSecondary }}>  →  </Text>
                      <Text style={{ fontWeight: '600' }}>{r.to}</Text>
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.section, { color: t.textPrimary, marginTop: spacing.xl }]}>Popular Routes</Text>
              <View style={styles.popularWrap}>
                {POPULAR.map((p) => (
                  <TouchableOpacity key={p} activeOpacity={0.7} onPress={() => { tap(); }}
                    style={[styles.popularChip, { borderColor: t.border, backgroundColor: t.surface }]}>
                    <Text style={[styles.popularText, { color: t.textPrimary }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: t.textPrimary }]}>
                  {loading ? 'Searching…' : `${rides.length} rides found`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.iconBtn, { borderColor: t.border }]} onPress={() => tap()}>
                    <ArrowDownUp color={t.textPrimary} size={14} />
                    <Text style={[styles.iconBtnText, { color: t.textPrimary }]}>Sort</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, { borderColor: t.border }]} onPress={() => tap()}>
                    <SlidersHorizontal color={t.textPrimary} size={14} />
                    <Text style={[styles.iconBtnText, { color: t.textPrimary }]}>Filter</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <View style={{ gap: 12 }}>
                  <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
                  <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {rides.map((r) => (
                    <RideCard key={r.id} ride={r} t={t} testID={`search-ride-${r.id}`}
                      onPress={() => { tap(); router.push(`/ride/${r.id}` as any); }} />
                  ))}
                  {rides.length === 0 && (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <SearchIcon color={t.textTertiary} size={28} />
                      <Text style={{ color: t.textSecondary, marginTop: 8 }}>No rides match your search.</Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const TabBtn: React.FC<{ label: string; active: boolean; t: Theme; onPress: () => void; testID?: string }>
  = ({ label, active, t, onPress, testID }) => (
  <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8}
    style={[styles.tabBtn, active && { backgroundColor: t.background }]}>
    <Text style={[styles.tabBtnText, { color: active ? t.textPrimary : t.textSecondary, fontWeight: active ? '700' : '500' }]}>{label}</Text>
  </TouchableOpacity>
);

const InputRow: React.FC<any> = ({ icon, t, value, onChangeText, placeholder, onClear, onSubmit, testID }) => (
  <View style={[styles.input, { backgroundColor: t.muted }]}>
    <View style={{ width: 14, alignItems: 'center' }}>{icon}</View>
    <TextInput
      testID={testID}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={t.textSecondary}
      style={[styles.inputField, { color: t.textPrimary }]}
      onSubmitEditing={onSubmit}
      returnKeyType="search"
    />
    {value ? (
      <TouchableOpacity onPress={onClear}>
        <X color={t.textSecondary} size={16} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const FilterChip: React.FC<{ t: Theme; icon: React.ReactNode; label: string }> = ({ t, icon, label }) => (
  <View style={[styles.filterChip, { borderColor: t.border }]}>
    {icon}
    <Text style={[styles.filterChipText, { color: t.textPrimary }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: radius.md, gap: 2 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm + 2 },
  tabBtnText: { fontSize: 14 },
  input: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, height: 48, borderRadius: radius.md },
  inputField: { flex: 1, fontSize: 15 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  filters: { flexDirection: 'row', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 9999 },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  cta: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700' },
  section: { fontSize: 17, fontWeight: '700', marginBottom: spacing.md, letterSpacing: -0.3 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  recentIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  recentText: { flex: 1, fontSize: 13 },
  popularWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popularChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1 },
  popularText: { fontSize: 12, fontWeight: '600' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resultsCount: { fontSize: 15, fontWeight: '600' },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, borderWidth: 1 },
  iconBtnText: { fontSize: 12, fontWeight: '600' },
});
