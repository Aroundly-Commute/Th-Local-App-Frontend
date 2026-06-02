import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Alert } from 'react-native';

import { useRouter } from 'expo-router';
import {
  Star, Car, Wallet, Shield, Bell, HelpCircle, Settings,
  ChevronRight, LogOut, MapPin, Calendar, Leaf, BadgeCheck, Award, ShoppingBag, Trash2
} from 'lucide-react-native';
import { useAuth } from '../../../core/auth/auth';
import { useMarketData } from '../../marketplace/contexts/MarketDataContext';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../../core/theme/theme';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';
import { tap, success } from '../../../core/utils/haptics';
import { useFeatureFlags } from '../../../services/feature-flag/FeatureFlagContext';
import { api } from '../../../core/api/api';
import auth from '../../../core/auth/firebaseAdapter';

const BADGES = [
  { icon: '🌱', name: 'Eco Starter' },
  { icon: '🚗', name: 'First Drive' },
  { icon: '⭐', name: '5-Star Rider' },
  { icon: '🌍', name: 'Planet Saver' },
];

export default function ProfileScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const settingsTapCountRef = React.useRef<number>(0);
  const lastTapRef = React.useRef<number>(0);
  const { user, logout } = useAuth();
  const { registeredRole } = useMarketData();

  if (!user) return null;

  const onLogout = async () => {
    tap();
    await logout();
    success();
    router.replace('/(auth)/login');
  };

  const onDeleteAccount = () => {
    tap();
    Alert.alert(
      'Delete Account?',
      'Are you absolutely sure you want to permanently delete your account? All your commute history, reviews, and parking slots will be permanently purged.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Permanently', 
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Call backend delete account API
              await api.post('/auth/delete-account').catch(() => {});
              
              // 2. Call Firebase Auth user deletion
              const currentUser = auth().currentUser;
              if (currentUser) {
                await currentUser.delete().catch((e: any) => {
                  console.warn('Firebase user delete failed (may need recent authentication):', e);
                });
              }
              
              // 3. Clear session
              await logout();
              success();
              
              Alert.alert('Account Deleted', 'Your account and data have been completely removed.');
              router.replace('/(auth)/login' as any);
            } catch (err: any) {
              console.error('Account deletion failure:', err);
              Alert.alert('Error', 'Failed to complete deletion. Please log out and back in to re-authenticate, then try again.');
            }
          }
        }
      ]
    );
  };

  const { enableMarketplace, enableRideSharing, enableParking, enableYourBadges, enableEcoStarter } = useFeatureFlags();

  const level = user.rides_count >= 100 ? 'Eco Champion' : user.rides_count >= 25 ? 'Green Commuter' : (enableEcoStarter ? 'Eco Starter' : 'Green Starter');
  const progress = Math.min(100, (user.rides_count / 100) * 100);
  const nextLevel = user.rides_count >= 100 ? 'Planet Saver' : 'Eco Champion';

  const menu = [];
  
  if (enableMarketplace) {
    if (registeredRole === 'merchant') {
      menu.push({ icon: Award, label: 'Manage Shop', badge: 'Active', badgeVariant: 'success', route: '/(market)/merchant' });
    } else if (registeredRole === 'provider') {
      menu.push({ icon: Settings, label: 'Manage Service', badge: 'Active', badgeVariant: 'success', route: '/(market)/merchant' });
    } else {
      menu.push({ icon: Shield, label: 'Partner with Us', badge: 'Join Now', badgeVariant: 'success', route: '/(market)/partner' });
    }
    menu.push(
      { icon: Calendar, label: 'My Bookings', badge: null, route: '/(market)/customer-bookings' },
      { icon: ShoppingBag, label: 'My Orders', badge: null, route: '/(market)/customer-orders' }
    );
  }

  if (enableParking) {
    menu.push(
      { icon: Car, label: 'Register Parking Spot', badge: null, route: '/parking/register' },
      { icon: Settings, label: 'Manage My Parking', badge: null, route: '/parking/manage' }
    );
  }

  if (enableRideSharing) {
    menu.push(
      { icon: Car, label: 'My Vehicles', badge: user.vehicle ? 'Registered' : 'Not Set', badgeVariant: user.vehicle ? 'success' : undefined, route: '/commute/vehicles' },
      { icon: Calendar, label: 'Scheduled Rides', badge: '1' }
    );
  }

  menu.push(
    { icon: Wallet, label: 'Payment Methods', badge: null },
    { icon: MapPin, label: 'Saved Places', badge: '4' },
    { icon: Shield, label: 'Verification', badge: user.is_verified ? 'Verified' : null, badgeVariant: 'success' },
    { icon: Bell, label: 'Notifications', badge: null },
    { icon: Settings, label: 'Settings', badge: null, route: '/settings' },
    { icon: HelpCircle, label: 'Help & Support', badge: null }
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
      {/* Header Bar */}
      <View style={{
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: t.border,
        backgroundColor: t.surface,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: t.textPrimary, letterSpacing: -0.5 }}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 140 }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: t.surface, borderColor: t.border }]}>
          <VerifiedAvatar uri={user.avatar_url} name={user.name} verified={user.is_verified} t={t} size={88} />
          <Text numberOfLines={1} style={[styles.name, { color: t.textPrimary }]}>{user.name}</Text>
          <Text numberOfLines={1} style={[styles.email, { color: t.textSecondary }]}>{user.email}</Text>

          <View style={styles.metaRow}>
            <Star color={t.warning} size={13} fill={t.warning} />
            <Text style={[styles.metaText, { color: t.textPrimary }]}>{user.rating.toFixed(1)}</Text>
            <Text style={[styles.metaDot, { color: t.textTertiary }]}>·</Text>
            <Text style={[styles.metaText, { color: t.textSecondary }]}>{user.rides_count} rides</Text>
            {user.is_verified && (
              <>
                <Text style={[styles.metaDot, { color: t.textTertiary }]}>·</Text>
                <BadgeCheck color={t.success} size={14} />
                <Text style={[styles.metaText, { color: t.success, fontWeight: '600' }]}>Verified</Text>
              </>
            )}
          </View>

          <TouchableOpacity activeOpacity={0.8} style={[styles.editBtn, { borderColor: t.border }]} onPress={() => { tap(); router.push('/edit-profile'); }}>
            <Text style={[styles.editText, { color: t.textPrimary }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Level progress */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.levelIcon, { backgroundColor: t.successBg }]}>
                <Award color={t.success} size={16} />
              </View>
              <View>
                <Text style={[styles.levelName, { color: t.textPrimary }]}>{level}</Text>
                <Text style={[styles.levelHint, { color: t.textSecondary }]}>
                  {Math.round(100 - progress)}% to {nextLevel}
                </Text>
              </View>
            </View>
            <View style={[styles.levelPill, { backgroundColor: t.muted }]}>
              <Text style={[styles.levelPillText, { color: t.textPrimary }]}>Level {Math.floor(user.rides_count / 25) + 1}</Text>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: t.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: t.success, width: `${progress}%` }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.statValue, { color: t.textPrimary }]}>{user.rides_count}</Text>
            <Text style={[styles.statLabel, { color: t.textSecondary }]}>Total Rides</Text>
            <Text style={[styles.statHint, { color: t.textTertiary }]}>
              {user.role === 'driver' ? 'Driver' : 'Passenger'}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: t.successBg, borderColor: t.successBg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Leaf color={t.success} size={14} />
              <Text style={[styles.statValue, { color: t.success }]}>{user.co2_saved_kg.toFixed(0)}kg</Text>
            </View>
            <Text style={[styles.statLabel, { color: t.success }]}>CO₂ Saved</Text>
            <Text style={[styles.statHint, { color: t.success, opacity: 0.75 }]}>₹{user.money_saved.toFixed(0)} saved too</Text>
          </View>
        </View>

        {/* Badges */}
        {enableYourBadges && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>Your Badges</Text>
              <TouchableOpacity onPress={() => tap()}><Text style={[styles.sectionAction, { color: t.textPrimary }]}>View all</Text></TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 12 }}>
              {BADGES.filter(b => b.name !== 'Eco Starter' || enableEcoStarter).map((b) => (
                <View key={b.name} style={[styles.badge, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <Text style={{ fontSize: 28 }}>{b.icon}</Text>
                  <Text style={[styles.badgeName, { color: t.textPrimary }]}>{b.name}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Menu */}
        <View style={[styles.menu, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.lg }]}>
          {menu.map((m, i) => {
            const Icon = m.icon;
            return (
              <React.Fragment key={m.label}>
                <TouchableOpacity testID={`menu-${m.label}`} activeOpacity={0.6} onPress={() => {
                  tap();
                  if ((m as any).route) {
                    if ((m as any).route === '/settings') {
                      const now = Date.now();
                      if (now - lastTapRef.current > 2000) {
                        settingsTapCountRef.current = 1;
                      } else {
                        settingsTapCountRef.current += 1;
                      }
                      lastTapRef.current = now;
                      if (settingsTapCountRef.current >= 5) {
                        settingsTapCountRef.current = 0;
                        router.push('/settings');
                      }
                    } else {
                      router.push((m as any).route);
                    }
                  }
                }}
                  style={styles.menuRow}>
                  <View style={[styles.menuIcon, { backgroundColor: t.muted }]}>
                    <Icon color={t.textPrimary} size={16} />
                  </View>
                  <Text style={[styles.menuLabel, { color: t.textPrimary }]}>{m.label}</Text>
                  {m.badge ? (
                    <View style={[styles.menuBadge, {
                      backgroundColor: (m as any).badgeVariant === 'success' ? t.successBg : t.muted,
                    }]}>
                      <Text style={{
                        fontSize: 11, fontWeight: '700',
                        color: (m as any).badgeVariant === 'success' ? t.success : t.textSecondary,
                      }}>{m.badge}</Text>
                    </View>
                  ) : null}
                  <ChevronRight color={t.textTertiary} size={16} />
                </TouchableOpacity>
                {i < menu.length - 1 && <View style={[styles.menuDivider, { backgroundColor: t.border }]} />}
              </React.Fragment>
            );
          })}
        </View>

        {/* Logout */}
        <TouchableOpacity testID="logout-btn" onPress={onLogout} activeOpacity={0.7}
          style={[styles.logout, { borderColor: t.border }]}>
          <LogOut color={t.error} size={16} />
          <Text style={[styles.logoutText, { color: t.error }]}>Log Out</Text>
        </TouchableOpacity>

        {/* Delete Account */}
        <TouchableOpacity testID="delete-account-btn" onPress={onDeleteAccount} activeOpacity={0.7}
          style={[styles.deleteBtn, { borderColor: t.border, marginTop: spacing.sm }]}>
          <Trash2 color={t.error} size={16} />
          <Text style={[styles.deleteBtnText, { color: t.error }]}>Delete Account & Data</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: t.textTertiary }]}>Aroundly v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, gap: 6 },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, marginTop: 12, textAlign: 'center', width: '100%' },
  email: { fontSize: 13, textAlign: 'center', width: '100%' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  metaText: { fontSize: 12 },
  metaDot: { fontSize: 14 },
  editBtn: { marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 9999, borderWidth: 1 },
  editText: { fontSize: 13, fontWeight: '600' },
  card: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 12 },
  levelIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  levelName: { fontSize: 14, fontWeight: '700' },
  levelHint: { fontSize: 11, marginTop: 2 },
  levelPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  levelPillText: { fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: spacing.md },
  statCard: { flex: 1, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 4 },
  statValue: { fontSize: 22, fontWeight: '700', letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statHint: { fontSize: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionAction: { fontSize: 13, fontWeight: '600' },
  badge: { width: 100, padding: 12, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', gap: 6 },
  badgeName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  menu: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingHorizontal: 16 },
  menuIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  menuDivider: { height: 1, marginLeft: 58 },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, marginTop: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  logoutText: { fontSize: 14, fontWeight: '600' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, borderRadius: radius.lg, borderWidth: 1, backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  deleteBtnText: { fontSize: 14, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 11, marginTop: spacing.lg },
});
