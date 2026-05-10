import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  useColorScheme, KeyboardAvoidingView, Platform, Alert, TextInput, Modal,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  MapPin, Search as SearchIcon, Calendar, Clock, Users,
  ArrowDownUp, SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react-native';
import { api } from '../../src/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/theme';
import { RideCard } from '../../src/components';
import { Shimmer } from '../../src/Shimmer';
import { tap, success, errorH } from '../../src/haptics';
import { LocationSearch } from '../../src/LocationSearch';

const RECENT = [
  { from: 'Noida Sector 62', to: 'Connaught Place, Delhi' },
  { from: 'Gurgaon Cyber City', to: 'IGI Airport, Delhi' },
  { from: 'Lajpat Nagar', to: 'Saket, Delhi' },
];

const POPULAR = ['Noida → CP', 'Gurgaon → Delhi', 'Faridabad → Delhi', 'Greater Noida → Noida'];

// Minimal inline date/time picker (no extra package needed)
function DateTimePicker({
  visible, onClose, value, onChange, mode,
}: {
  visible: boolean; onClose: () => void;
  value: Date; onChange: (d: Date) => void;
  mode: 'date' | 'time';
}) {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  const [tempYear, setTempYear] = useState(value.getFullYear());
  const [tempMonth, setTempMonth] = useState(value.getMonth());
  const [tempDay, setTempDay] = useState(value.getDate());
  const [tempHour, setTempHour] = useState(value.getHours());
  const [tempMin, setTempMin] = useState(value.getMinutes());

  useEffect(() => {
    setTempYear(value.getFullYear());
    setTempMonth(value.getMonth());
    setTempDay(value.getDate());
    setTempHour(value.getHours());
    setTempMin(value.getMinutes());
  }, [visible]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const clampDay = (d: number, y: number, m: number) => Math.min(d, daysInMonth(y, m));

  const confirm = () => {
    let d: Date;
    if (mode === 'date') {
      d = new Date(value);
      d.setFullYear(tempYear, tempMonth, clampDay(tempDay, tempYear, tempMonth));
    } else {
      d = new Date(value);
      d.setHours(tempHour, tempMin, 0, 0);
    }
    onChange(d);
    onClose();
  };

  const Spin = ({ val, onDec, onInc, label }: { val: string; onDec: () => void; onInc: () => void; label: string }) => (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: t.textSecondary, fontSize: 10, marginBottom: 4 }}>{label}</Text>
      <TouchableOpacity onPress={onInc} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <ChevronLeft color={t.textPrimary} size={20} style={{ transform: [{ rotate: '90deg' }] }} />
      </TouchableOpacity>
      <Text style={{ color: t.textPrimary, fontSize: 22, fontWeight: '700', marginVertical: 8, minWidth: 48, textAlign: 'center' }}>{val}</Text>
      <TouchableOpacity onPress={onDec} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <ChevronRight color={t.textPrimary} size={20} style={{ transform: [{ rotate: '90deg' }] }} />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={onClose} />
      <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Text style={{ color: t.textPrimary, fontSize: 17, fontWeight: '700', marginBottom: 24, textAlign: 'center' }}>
          {mode === 'date' ? 'Select Date' : 'Select Time'}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 28 }}>
          {mode === 'date' ? (
            <>
              <Spin label="DAY" val={String(tempDay).padStart(2, '0')}
                onInc={() => setTempDay(d => { const n = d < daysInMonth(tempYear, tempMonth) ? d + 1 : 1; return n; })}
                onDec={() => setTempDay(d => { const n = d > 1 ? d - 1 : daysInMonth(tempYear, tempMonth); return n; })}
              />
              <Spin label="MONTH" val={MONTHS[tempMonth]}
                onInc={() => setTempMonth(m => (m + 1) % 12)}
                onDec={() => setTempMonth(m => (m - 1 + 12) % 12)}
              />
              <Spin label="YEAR" val={String(tempYear)}
                onInc={() => setTempYear(y => y + 1)}
                onDec={() => setTempYear(y => y - 1)}
              />
            </>
          ) : (
            <>
              <Spin label="HOUR" val={String(tempHour).padStart(2, '0')}
                onInc={() => setTempHour(h => (h + 1) % 24)}
                onDec={() => setTempHour(h => (h - 1 + 24) % 24)}
              />
              <Text style={{ color: t.textSecondary, fontSize: 28, alignSelf: 'center', marginTop: 16 }}>:</Text>
              <Spin label="MIN" val={String(tempMin).padStart(2, '0')}
                onInc={() => setTempMin(m => (m + 5) % 60)}
                onDec={() => setTempMin(m => (m - 5 + 60) % 60)}
              />
            </>
          )}
        </View>
        <TouchableOpacity onPress={confirm}
          style={{ backgroundColor: t.primary, height: 50, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function Search() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [mode, setMode] = useState<'find' | 'offer'>('find');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromCoords, setFromCoords] = useState<{lat: number, lng: number} | null>(null);
  const [toCoords, setToCoords] = useState<{lat: number, lng: number} | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Date/time as a single Date object for easy formatting
  const [datetime, setDatetime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0); // default: 1 hour from now
    return d;
  });
  const [seats, setSeats] = useState('1');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Pick up mode param from navigation (e.g. from home "Offer Ride" button)
  useEffect(() => {
    if (params.mode === 'offer') {
      setMode('offer');
    }
  }, [params.mode]);

  const dateLabel = datetime.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  const timeLabel = datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const submitAction = useCallback(async () => {
    setLoading(true); setSearched(true);
    const dateStr = datetime.toISOString().split('T')[0];
    const timeStr = `${String(datetime.getHours()).padStart(2,'0')}:${String(datetime.getMinutes()).padStart(2,'0')}`;
    try {
      if (mode === 'offer') {
        await api.post('/rides/offer', {
          startName: from, endName: to,
          startCoords: fromCoords ? [fromCoords.lng, fromCoords.lat] : null,
          endCoords: toCoords ? [toCoords.lng, toCoords.lat] : null,
          seats: parseInt(seats) || 1,
          price: 10,
          date: dateStr,
          time: timeStr,
        });
        success();
        Alert.alert('Success', 'Ride offered! It is now visible to other users.');
        router.push('/(tabs)/rides');
      } else {
        const { data } = await api.post('/matchmaking/search', {
          start: fromCoords ? { lng: fromCoords.lng, lat: fromCoords.lat } : { lng: 77.3910, lat: 28.5355 },
          end: toCoords ? { lng: toCoords.lng, lat: toCoords.lat } : { lng: 77.4, lat: 28.6 },
          startPlaceName: from || 'Origin',
          endPlaceName: to || 'Destination',
          startTime: datetime.toISOString(),
        });
        setRides(data.matches || []);
      }
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Action failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [mode, from, to, fromCoords, toCoords, datetime, seats, router]);

  const quickSearch = (f: string, dest: string) => {
    tap();
    setFrom(f); setTo(dest);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: 12, zIndex: 100 }}>
          {/* Tabs */}
          <View style={[styles.tabBar, { backgroundColor: t.muted }]}>
            <TabBtn testID="tab-find" label="Find a Ride" active={mode === 'find'} t={t} onPress={() => { tap(); setMode('find'); }} />
            <TabBtn testID="tab-offer" label="Offer a Ride" active={mode === 'offer'} t={t} onPress={() => { tap(); setMode('offer'); }} />
          </View>

          {/* From / To inputs */}
          <View style={{ gap: 8, marginTop: spacing.md, zIndex: 10 }}>
            <View style={{ zIndex: 2 }}>
              <LocationSearch
                icon={<View style={[styles.dot, { backgroundColor: t.textPrimary }]} />}
                t={t} value={from} onChangeText={setFrom} placeholder="From"
                onSelect={(name, lat, lng) => { setFrom(name); setFromCoords({lat, lng}); }}
              />
            </View>
            <View style={{ zIndex: 1 }}>
              <LocationSearch
                icon={<View style={[styles.dot, { borderColor: t.textPrimary, borderWidth: 2, backgroundColor: t.background }]} />}
                t={t} value={to} onChangeText={setTo} placeholder="To"
                onSelect={(name, lat, lng) => { setTo(name); setToCoords({lat, lng}); }}
              />
            </View>
          </View>

          {/* Date / Time / Seats row */}
          <View style={[styles.filters, { marginTop: spacing.sm, zIndex: 0 }]}>
            {/* Date picker trigger */}
            <TouchableOpacity
              testID="date-picker-btn"
              onPress={() => { tap(); setShowDatePicker(true); }}
              style={[styles.filterChip, { borderColor: t.border, flex: 1 }]}
            >
              <Calendar color={t.textSecondary} size={13} />
              <Text style={[styles.filterChipText, { color: t.textPrimary }]} numberOfLines={1}>{dateLabel}</Text>
            </TouchableOpacity>

            {/* Time picker trigger */}
            <TouchableOpacity
              testID="time-picker-btn"
              onPress={() => { tap(); setShowTimePicker(true); }}
              style={[styles.filterChip, { borderColor: t.border, flex: 1 }]}
            >
              <Clock color={t.textSecondary} size={13} />
              <Text style={[styles.filterChipText, { color: t.textPrimary }]} numberOfLines={1}>{timeLabel}</Text>
            </TouchableOpacity>

            {/* Seats manual input */}
            <View style={[styles.filterChip, { borderColor: t.border, width: 72 }]}>
              <Users color={t.textSecondary} size={13} />
              <TextInput
                testID="seats-input"
                value={seats}
                onChangeText={setSeats}
                keyboardType="numeric"
                maxLength={1}
                style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, padding: 0 }}
                placeholderTextColor={t.textSecondary}
                placeholder="1"
              />
            </View>
          </View>

          <TouchableOpacity
            testID="search-submit"
            onPress={() => { tap(); submitAction(); }}
            activeOpacity={0.8}
            style={[styles.cta, { backgroundColor: t.primary, marginTop: spacing.md, zIndex: 0 }]}
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
                      <Text style={{ color: t.textTertiary, marginTop: 4, fontSize: 12, textAlign: 'center' }}>
                        Try adjusting the time window or search radius.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DateTimePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={datetime}
        onChange={(d) => setDatetime(d)}
        mode="date"
      />

      {/* Time Picker Modal */}
      <DateTimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        value={datetime}
        onChange={(d) => setDatetime(d)}
        mode="time"
      />
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

const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: radius.md, gap: 2 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm + 2 },
  tabBtnText: { fontSize: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  filters: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 9,
    borderWidth: 1, borderRadius: 9999,
    overflow: 'hidden',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
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


