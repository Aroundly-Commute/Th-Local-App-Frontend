import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground, TouchableOpacity, useColorScheme, RefreshControl, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Leaf, TreePine, Wallet, Search as SearchIcon, Plus } from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '../../src/auth';
import { api } from '../../src/api';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { Shimmer } from '../../src/Shimmer';
import { RideCard } from '../../src/components';
import { tap } from '../../src/haptics';

export default function Home() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([api.get('/sustainability/me'), api.get('/rides')]);
      setStats(s.data);
      setRides(r.data.slice(0, 3));
    } catch {} finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={t.primary} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greet, { color: t.textSecondary }]}>Welcome back</Text>
            <Text style={[styles.name, { color: t.textPrimary }]}>{user?.name?.split(' ')[0] || 'Friend'}</Text>
          </View>
          <View style={[styles.streakPill, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Leaf color={t.primary} size={14} />
            <Text style={[styles.streakText, { color: t.primary }]}>Eco Hero</Text>
          </View>
        </View>

        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1695551527664-585082953b87?crop=entropy&cs=srgb&fm=jpg&q=85&w=900' }}
          imageStyle={{ borderRadius: radius.lg }}
          style={styles.sustHeader}
        >
          <LinearGradient
            colors={['rgba(11,20,17,0.4)', 'rgba(27,94,32,0.85)']}
            style={[StyleSheet.absoluteFill, { borderRadius: radius.lg }]}
          />
          <Text style={styles.sustLabel}>YOUR IMPACT</Text>
          {loading ? (
            <Shimmer style={{ height: 50, width: '70%', marginVertical: 8 }} />
          ) : (
            <Text testID="money-saved" style={styles.sustNumber}>${stats?.money_saved?.toFixed(2) || '0.00'}</Text>
          )}
          <Text style={styles.sustSub}>saved by sharing rides</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Leaf color="#fff" size={18} />
              <Text testID="co2-saved" style={styles.statN}>{stats?.co2_saved_kg?.toFixed(1) || '0.0'} kg</Text>
              <Text style={styles.statL}>CO₂ avoided</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <TreePine color="#fff" size={18} />
              <Text style={styles.statN}>{stats?.trees_equivalent?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statL}>Trees / year</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Wallet color="#fff" size={18} />
              <Text style={styles.statN}>{stats?.rides_count || 0}</Text>
              <Text style={styles.statL}>Rides</Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.actions}>
          <TouchableOpacity testID="action-find" onPress={() => { tap(); router.push('/(tabs)/search'); }}
            activeOpacity={0.85} style={[styles.action, { backgroundColor: t.primary }]}>
            <SearchIcon color={t.primaryContrast} size={22} />
            <Text style={[styles.actionTitle, { color: t.primaryContrast }]}>Find a Ride</Text>
            <Text style={[styles.actionHint, { color: t.primaryContrast, opacity: 0.85 }]}>Search nearby trips</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="action-offer" onPress={() => { tap(); router.push('/(tabs)/search'); }}
            activeOpacity={0.85} style={[styles.action, { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 }]}>
            <Plus color={t.primary} size={22} />
            <Text style={[styles.actionTitle, { color: t.textPrimary }]}>Offer a Ride</Text>
            <Text style={[styles.actionHint, { color: t.textSecondary }]}>Earn & share</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.section, { color: t.textPrimary }]}>Suggested rides</Text>
        {loading ? (
          <View style={{ gap: 12 }}>
            <Shimmer style={{ height: 160, borderRadius: radius.lg }} />
            <Shimmer style={{ height: 160, borderRadius: radius.lg }} />
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {rides.map((r) => (
              <RideCard key={r.id} ride={r} t={t} testID={`home-ride-${r.id}`}
                onPress={() => { tap(); router.push(`/ride/${r.id}` as any); }} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, marginTop: 8 },
  greet: { fontSize: 13 },
  name: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  streakPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, borderWidth: 1 },
  streakText: { fontSize: 12, fontWeight: '700' },
  sustHeader: { borderRadius: radius.lg, padding: spacing.lg, overflow: 'hidden', marginBottom: spacing.lg, minHeight: 220 },
  sustLabel: { color: '#A6D5A8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  sustNumber: { color: '#fff', fontSize: 44, fontWeight: '800', letterSpacing: -2, marginTop: 6 },
  sustSub: { color: '#E8F0EB', fontSize: 13, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 'auto', justifyContent: 'space-between' },
  statBox: { flex: 1, gap: 4 },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  statN: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statL: { color: '#A6D5A8', fontSize: 11 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: spacing.lg },
  action: { flex: 1, padding: spacing.md, borderRadius: radius.lg, gap: 6, minHeight: 110 },
  actionTitle: { fontSize: 15, fontWeight: '700', marginTop: 6 },
  actionHint: { fontSize: 12 },
  section: { fontSize: 18, fontWeight: '800', marginBottom: spacing.md, letterSpacing: -0.3 },
});
