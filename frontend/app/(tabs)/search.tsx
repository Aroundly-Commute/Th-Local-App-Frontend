import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, useColorScheme, SafeAreaView, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, UrlTile } from '../../src/MapWrapper';
import { Search as SearchIcon, MapPin, Navigation } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { RideCard } from '../../src/components';
import { Shimmer } from '../../src/Shimmer';
import { tap } from '../../src/haptics';

export default function Search() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [q, setQ] = useState('');
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const mapRef = useRef<MapView | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const { data } = await api.get('/rides', { params: query ? { q: query } : {} });
      setRides(data);
      if (data.length && !selected) setSelected(data[0]);
    } catch {} finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (selected && mapRef.current) {
      mapRef.current.fitToCoordinates([
        { latitude: selected.origin_lat, longitude: selected.origin_lng },
        { latitude: selected.dest_lat, longitude: selected.dest_lng },
      ], { edgePadding: { top: 80, bottom: 380, left: 60, right: 60 }, animated: true });
    }
  }, [selected]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <View style={{ flex: 1 }}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{ latitude: 37.77, longitude: -122.27, latitudeDelta: 0.6, longitudeDelta: 0.6 }}
          showsUserLocation
        >
          {/* OSM tile overlay for Android */}
          {Platform.OS === 'android' && (
            <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />
          )}
          {selected && (
            <>
              <Marker coordinate={{ latitude: selected.origin_lat, longitude: selected.origin_lng }} pinColor={t.primary} />
              <Marker coordinate={{ latitude: selected.dest_lat, longitude: selected.dest_lng }} pinColor={t.error} />
              <Polyline
                coordinates={[
                  { latitude: selected.origin_lat, longitude: selected.origin_lng },
                  { latitude: selected.dest_lat, longitude: selected.dest_lng },
                ]}
                strokeColor={t.primary}
                strokeWidth={4}
              />
            </>
          )}
        </MapView>

        {/* Top search bar */}
        <View style={[styles.searchWrap, { backgroundColor: t.surface, borderColor: t.border, shadowColor: '#000' }]}>
          <SearchIcon color={t.textSecondary} size={18} />
          <TextInput
            testID="search-input"
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => { tap(); load(q); }}
            placeholder="Where to? (e.g., San Francisco)"
            placeholderTextColor={t.textSecondary}
            style={[styles.searchField, { color: t.textPrimary }]}
            returnKeyType="search"
          />
        </View>

        {/* Bottom sheet */}
        <View style={[styles.sheet, { backgroundColor: t.surface }]}>
          <View style={[styles.handle, { backgroundColor: t.border }]} />
          <Text style={[styles.title, { color: t.textPrimary }]}>
            {loading ? 'Finding rides…' : `${rides.length} rides available`}
          </Text>
          {loading ? (
            <View style={{ gap: 12 }}>
              <Shimmer style={{ height: 140, borderRadius: radius.lg }} />
              <Shimmer style={{ height: 140, borderRadius: radius.lg }} />
            </View>
          ) : (
            <FlatList
              data={rides}
              keyExtractor={(r) => r.id}
              contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <RideCard
                  ride={item}
                  t={t}
                  testID={`search-ride-${item.id}`}
                  onPress={() => { tap(); setSelected(item); router.push(`/ride/${item.id}` as any); }}
                />
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', padding: 30 }}>
                  <MapPin color={t.textSecondary} size={28} />
                  <Text style={{ color: t.textSecondary, marginTop: 8 }}>No rides found</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    position: 'absolute', top: 8, left: 16, right: 16, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, height: 52, borderRadius: radius.pill, borderWidth: 1,
    shadowOpacity: 0.12, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  searchField: { flex: 1, fontSize: 15 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%',
    borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 24, shadowOffset: { width: 0, height: -8 }, elevation: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md, letterSpacing: -0.3 },
});
