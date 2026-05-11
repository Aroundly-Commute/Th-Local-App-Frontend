import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  TextInput, FlatList, Dimensions, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Search as SearchIcon, SlidersHorizontal, Star, MapPin, Flame, Clock, ChevronRight,
} from 'lucide-react-native';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/theme';
import { Shimmer } from '../../src/Shimmer';
import { ModeSwitcher } from '../../src/ModeSwitcher';
import { tap } from '../../src/haptics';
import {
  mockStories, mockCategories, mockShops, mockFeatured, mockFlashSale,
} from '../../src/marketData';

const { width: SCREEN_W } = Dimensions.get('window');

export default function MarketHome() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const [stories, setStories] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [flash, setFlash] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    // Use mock data directly — replace with api calls once backend is ready
    setStories(mockStories);
    setCategories(mockCategories);
    setFeatured(mockFeatured);
    setFlash(mockFlashSale);
    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadShops = useCallback((cat: string, q: string) => {
    let filtered = mockShops;
    if (cat !== 'all') filtered = filtered.filter((s) => s.category === cat);
    if (q) filtered = filtered.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.description.toLowerCase().includes(q.toLowerCase()));
    setShops(filtered);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { loadShops(activeCat, search); }, [activeCat, search, loadShops]);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ModeSwitcher />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.textPrimary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <Text style={[styles.h1, { color: t.textPrimary }]}>Discover local</Text>
          <Text style={[styles.sub, { color: t.textSecondary }]}>Shops & services around your block</Text>
        </View>

        {/* Story bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 14, paddingTop: spacing.md, paddingBottom: 4 }}>
          {loading && stories.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (<Shimmer key={i} style={{ width: 60, height: 60, borderRadius: 30 }} />))
            : stories.map((s) => (
              <TouchableOpacity key={s.id} testID={`story-${s.id}`} activeOpacity={0.85}
                onPress={() => { tap(); router.push(`/shop/${s.id}` as any); }}
                style={styles.storyItem}>
                <View style={[styles.storyRing, { borderColor: t.mint }]}>
                  <Image source={{ uri: s.avatar }} style={styles.storyAvatar} contentFit="cover" />
                </View>
                <Text style={[styles.storyName, { color: t.textSecondary }]} numberOfLines={1}>{s.name.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Glass search bar */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          <View style={[styles.searchBar, {
            backgroundColor: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)',
            borderColor: t.border,
          }]}>
            <SearchIcon color={t.textSecondary} size={18} />
            <TextInput
              testID="market-search"
              value={search}
              onChangeText={setSearch}
              placeholder="Search shops, services…"
              placeholderTextColor={t.textSecondary}
              style={[styles.searchField, { color: t.textPrimary }]}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => tap()} style={[styles.filterBtn, { backgroundColor: t.primary }]}>
              <SlidersHorizontal color={t.primaryContrast} size={14} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured 4-tile grid */}
        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
          <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Featured categories</Text>
          <View style={styles.featuredGrid}>
            {categories.filter((c) => c.featured).map((c) => (
              <TouchableOpacity key={c.id} testID={`featured-${c.id}`} activeOpacity={0.8}
                onPress={() => { tap(); setActiveCat(c.id); }}
                style={[styles.featuredTile, { backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={[styles.featuredIcon, { backgroundColor: t.mintBg }]}>
                  <Text style={{ fontSize: 26 }}>{c.icon}</Text>
                </View>
                <Text style={[styles.featuredName, { color: t.textPrimary }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Explore all + horizontal cats */}
        <TouchableOpacity onPress={() => { tap(); router.push('/(market)/categories' as any); }}
          style={{ paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.lg }}>
          <Text style={[styles.exploreText, { color: t.textPrimary }]}>Explore all categories</Text>
          <ChevronRight color={t.textPrimary} size={14} />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 8, paddingVertical: spacing.sm }}>
          <Chip testID="cat-all" label="All" active={activeCat === 'all'} t={t} onPress={() => { tap(); setActiveCat('all'); }} />
          {categories.map((c) => (
            <Chip key={c.id} testID={`cat-${c.id}`} label={c.name} icon={c.icon}
              active={activeCat === c.id} t={t} onPress={() => { tap(); setActiveCat(c.id); }} />
          ))}
        </ScrollView>

        {/* Dynamic shop list */}
        <View style={{ paddingHorizontal: spacing.lg, gap: 12, marginTop: spacing.sm }}>
          {shops.length === 0 && !loading ? (
            <Text style={{ color: t.textSecondary, textAlign: 'center', paddingVertical: 24 }}>No shops in this category yet.</Text>
          ) : shops.slice(0, 4).map((s) => (
            <ShopRow key={s.id} shop={s} t={t} onPress={() => { tap(); router.push(`/shop/${s.id}` as any); }} />
          ))}
        </View>

        {/* Hot Picks */}
        <Section t={t} icon={<Flame color={t.error} size={16} />} title="Hot Picks" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12, paddingBottom: 4 }}>
          {featured.length === 0
            ? Array.from({ length: 3 }).map((_, i) => <Shimmer key={i} style={{ width: SCREEN_W * 0.7, height: 200, borderRadius: radius.lg }} />)
            : featured.map((s) => (
              <TouchableOpacity key={s.id} testID={`hot-${s.id}`} activeOpacity={0.85}
                onPress={() => { tap(); router.push(`/shop/${s.id}` as any); }}
                style={[styles.hotCard, { width: SCREEN_W * 0.72, backgroundColor: t.surface, borderColor: t.border }]}>
                <Image source={{ uri: s.image }} style={styles.hotImage} contentFit="cover" />
                <View style={{ padding: spacing.md, gap: 4 }}>
                  <Text style={[styles.hotName, { color: t.textPrimary }]} numberOfLines={1}>{s.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Star color={t.warning} size={11} fill={t.warning} />
                    <Text style={[styles.hotMeta, { color: t.textSecondary }]}>{s.rating.toFixed(1)}</Text>
                    <Text style={[styles.hotMeta, { color: t.textTertiary }]}>·</Text>
                    <MapPin color={t.textSecondary} size={11} />
                    <Text style={[styles.hotMeta, { color: t.textSecondary }]}>{s.distance_km} km</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </ScrollView>

        {/* Flash Sale */}
        <Section t={t} icon={<Clock color={t.mint} size={16} />} title="Flash Sale" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}>
          {flash.map((p) => <FlashCard key={p.id} p={p} t={t} />)}
        </ScrollView>
      </ScrollView>
    </View>
  );
}

// --- Sub-components ---

const Chip: React.FC<{ label: string; active: boolean; t: Theme; icon?: string; onPress: () => void; testID?: string }>
  = ({ label, active, t, icon, onPress, testID }) => (
  <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.8}
    style={[styles.chip, {
      backgroundColor: active ? t.primary : t.surface,
      borderColor: active ? t.primary : t.border,
    }]}>
    {icon ? <Text style={{ fontSize: 14 }}>{icon}</Text> : null}
    <Text style={{ fontSize: 13, fontWeight: '600', color: active ? t.primaryContrast : t.textPrimary }}>{label}</Text>
  </TouchableOpacity>
);

const ShopRow: React.FC<{ shop: any; t: Theme; onPress: () => void }> = ({ shop, t, onPress }) => (
  <TouchableOpacity testID={`shop-row-${shop.id}`} activeOpacity={0.8} onPress={onPress}
    style={[styles.shopRow, { backgroundColor: t.surface, borderColor: t.border }]}>
    <Image source={{ uri: shop.image }} style={styles.shopImg} contentFit="cover" />
    <View style={{ flex: 1, gap: 4 }}>
      <Text style={[styles.shopName, { color: t.textPrimary }]} numberOfLines={1}>{shop.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Star color={t.warning} size={12} fill={t.warning} />
        <Text style={[styles.shopMeta, { color: t.textSecondary }]}>{shop.rating.toFixed(1)}</Text>
        <Text style={[styles.shopMeta, { color: t.textTertiary }]}>·</Text>
        <MapPin color={t.textSecondary} size={11} />
        <Text style={[styles.shopMeta, { color: t.textSecondary }]}>{shop.distance_km} km</Text>
      </View>
      <Text style={[styles.shopMeta, { color: t.textTertiary }]} numberOfLines={1}>{shop.description}</Text>
    </View>
  </TouchableOpacity>
);

const FlashCard: React.FC<{ p: any; t: Theme }> = ({ p, t }) => {
  const [secs, setSecs] = useState<number>(p.seconds_left || 0);
  useEffect(() => {
    if (secs <= 0) return;
    const i = setInterval(() => setSecs((x) => Math.max(0, x - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const discount = p.price > 0 ? Math.round(((p.price - p.sale_price) / p.price) * 100) : 0;
  return (
    <View style={[fStyles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Image source={{ uri: p.image }} style={fStyles.img} contentFit="cover" />
      <View style={[fStyles.discount, { backgroundColor: t.error }]}>
        <Text style={fStyles.discountText}>-{discount}%</Text>
      </View>
      <View style={{ padding: 10, gap: 4 }}>
        <Text style={[fStyles.name, { color: t.textPrimary }]} numberOfLines={1}>{p.name}</Text>
        <Text style={[fStyles.shop, { color: t.textTertiary }]} numberOfLines={1}>{p.shop_name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text style={[fStyles.salePrice, { color: t.textPrimary }]}>${p.sale_price.toFixed(2)}</Text>
          <Text style={[fStyles.orig, { color: t.textTertiary }]}>${p.price.toFixed(2)}</Text>
        </View>
        <View style={[fStyles.timer, { backgroundColor: t.mintBg }]}>
          <Clock color={t.mint} size={10} />
          <Text style={[fStyles.timerText, { color: t.mint }]}>
            {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
          </Text>
        </View>
      </View>
    </View>
  );
};

const Section: React.FC<{ t: Theme; icon: React.ReactNode; title: string }> = ({ t, icon, title }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md }}>
    {icon}
    <Text style={{ fontSize: 17, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.3 }}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6 },
  sub: { fontSize: 13, marginTop: 2 },
  storyItem: { alignItems: 'center', gap: 6, width: 64 },
  storyRing: { width: 60, height: 60, borderRadius: 30, padding: 2.5, borderWidth: 2 },
  storyAvatar: { width: '100%', height: '100%', borderRadius: 30 },
  storyName: { fontSize: 11, fontWeight: '500' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingLeft: 14, paddingRight: 6, height: 50, borderRadius: 9999, borderWidth: 1,
  },
  searchField: { flex: 1, fontSize: 14 },
  filterBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, marginBottom: spacing.md },
  featuredGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featuredTile: { width: '47.5%', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, alignItems: 'flex-start', gap: 10, minHeight: 110 },
  featuredIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  featuredName: { fontSize: 14, fontWeight: '700' },
  exploreText: { fontSize: 13, fontWeight: '600' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, borderWidth: 1 },
  shopRow: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.lg, borderWidth: 1 },
  shopImg: { width: 64, height: 64, borderRadius: 12 },
  shopName: { fontSize: 14, fontWeight: '700' },
  shopMeta: { fontSize: 11 },
  hotCard: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  hotImage: { width: '100%', height: 130 },
  hotName: { fontSize: 14, fontWeight: '700' },
  hotMeta: { fontSize: 11 },
});

const fStyles = StyleSheet.create({
  card: { width: 160, borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  img: { width: '100%', height: 110 },
  discount: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  discountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  name: { fontSize: 13, fontWeight: '600' },
  shop: { fontSize: 10 },
  salePrice: { fontSize: 14, fontWeight: '700' },
  orig: { fontSize: 11, textDecorationLine: 'line-through' },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  timerText: { fontSize: 10, fontWeight: '700' },
});
