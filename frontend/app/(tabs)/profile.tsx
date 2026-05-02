import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Star, Car, Settings, LogOut, ShieldCheck, ChevronRight, Leaf } from 'lucide-react-native';
import { useAuth } from '../../src/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { VerifiedAvatar } from '../../src/components';
import { tap, success } from '../../src/haptics';

export default function Profile() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user, logout } = useAuth();

  const onLogout = async () => {
    tap();
    await logout();
    success();
    router.replace('/(auth)/login');
  };

  if (!user) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ alignItems: 'center', gap: 12 }}>
            <VerifiedAvatar uri={user.avatar_url} name={user.name} verified={user.is_verified} t={t} size={108} />
            <View style={{ alignItems: 'center', gap: 4 }}>
              <Text style={[styles.name, { color: t.textPrimary }]}>{user.name}</Text>
              <View style={styles.row}>
                <Star color={t.primary} size={14} fill={t.primary} />
                <Text style={[styles.meta, { color: t.textSecondary }]}>{user.rating.toFixed(2)} · {user.rides_count} rides</Text>
              </View>
              {user.is_verified && (
                <View style={[styles.verifiedPill, { backgroundColor: t.isDark ? '#0f1f17' : '#EAF5EC' }]}>
                  <ShieldCheck color={t.primary} size={12} />
                  <Text style={[styles.verifiedText, { color: t.primary }]}>Verified Member</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.statsRow}>
            <Stat label="Saved" value={`$${user.money_saved.toFixed(0)}`} t={t} />
            <View style={[styles.divider, { backgroundColor: t.border }]} />
            <Stat label="CO₂" value={`${user.co2_saved_kg.toFixed(0)}kg`} t={t} icon={<Leaf color={t.primary} size={14} />} />
            <View style={[styles.divider, { backgroundColor: t.border }]} />
            <Stat label="Role" value={user.role === 'driver' ? 'Driver' : 'Rider'} t={t} />
          </View>
        </View>

        {user.role === 'driver' && user.vehicle && (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
            <View style={[styles.row, { gap: 10 }]}>
              <Car color={t.primary} size={20} />
              <Text style={[styles.section, { color: t.textPrimary }]}>My vehicle</Text>
            </View>
            <View style={{ marginTop: spacing.sm, gap: 6 }}>
              <Text style={[styles.vTitle, { color: t.textPrimary }]}>{user.vehicle.year} {user.vehicle.make} {user.vehicle.model}</Text>
              <Text style={[styles.vMeta, { color: t.textSecondary }]}>{user.vehicle.color} · {user.vehicle.license_plate}</Text>
            </View>
          </View>
        )}

        <View style={[styles.menu, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
          <MenuRow icon={<Settings color={t.textSecondary} size={18} />} label="Account settings" t={t} onPress={() => tap()} />
          <View style={[styles.menuDivider, { backgroundColor: t.border }]} />
          <MenuRow icon={<Car color={t.textSecondary} size={18} />} label="Vehicles & documents" t={t} onPress={() => tap()} />
          <View style={[styles.menuDivider, { backgroundColor: t.border }]} />
          <MenuRow icon={<LogOut color={t.error} size={18} />} label="Log out" t={t} danger testID="logout-btn" onPress={onLogout} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Stat = ({ label, value, t, icon }: any) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text style={{ fontSize: 18, fontWeight: '800', color: t.textPrimary }}>{value}</Text>
    </View>
    <Text style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</Text>
  </View>
);

const MenuRow = ({ icon, label, t, danger, onPress, testID }: any) => (
  <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.7} style={styles.menuRow}>
    {icon}
    <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: danger ? t.error : t.textPrimary, marginLeft: 12 }}>{label}</Text>
    <ChevronRight color={t.textSecondary} size={18} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, gap: spacing.lg,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  name: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 13 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 9999, marginTop: 4 },
  verifiedText: { fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { width: 1, height: 36 },
  section: { fontSize: 16, fontWeight: '700' },
  vTitle: { fontSize: 16, fontWeight: '700' },
  vMeta: { fontSize: 13 },
  menu: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingHorizontal: spacing.lg },
  menuDivider: { height: 1, marginLeft: spacing.lg },
});
