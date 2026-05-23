import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ShoppingBag, Car, MapPin, ShieldAlert, BadgeInfo } from 'lucide-react-native';
import { useFeatureFlags } from '../src/services/feature-flag/FeatureFlagContext';
import { lightTheme, darkTheme, spacing, radius } from '../src/theme';
import { tap } from '../src/haptics';

export default function SettingsScreen() {
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  const {
    enableMarketplace,
    enableRideSharing,
    enableParking,
    loading,
    toggleFeature,
  } = useFeatureFlags();

  const handleToggle = async (key: 'enableMarketplace' | 'enableRideSharing' | 'enableParking') => {
    tap();
    await toggleFeature(key);
  };

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={[styles.header, { borderColor: t.border }]}>
        <TouchableOpacity activeOpacity={0.7} onPress={handleBack} style={[styles.backBtn, { backgroundColor: t.surface, borderColor: t.border }]}>
          <ChevronLeft color={t.textPrimary} size={20} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Feature Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 60 }}>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          Toggle premium app modules on or off dynamically. Disabled modules are immediately hidden from bottom tabs, dashboard home views, and settings menus.
        </Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={{ color: t.textSecondary }}>Loading preferences...</Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
            {/* Marketplace toggle */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
                <ShoppingBag color="#3B82F6" size={18} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Marketplace Module</Text>
                <Text style={[styles.toggleDesc, { color: t.textTertiary }]}>
                  Shop groceries, order home services, or register as a merchant / provider.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={enableMarketplace ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => handleToggle('enableMarketplace')}
                value={enableMarketplace}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            {/* Ride Sharing toggle */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Car color="#10B981" size={18} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Ride Sharing (Commute)</Text>
                <Text style={[styles.toggleDesc, { color: t.textTertiary }]}>
                  Offer seats in your vehicle or book scheduled carpooling commutes near you.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={enableRideSharing ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => handleToggle('enableRideSharing')}
                value={enableRideSharing}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            {/* Smart Parking toggle */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#FFFBEB' }]}>
                <MapPin color="#F59E0B" size={18} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Smart Parking</Text>
                <Text style={[styles.toggleDesc, { color: t.textTertiary }]}>
                  Register your private parking spots or book reservation spots in real-time.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={enableParking ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => handleToggle('enableParking')}
                value={enableParking}
              />
            </View>
          </View>
        )}

        {/* Warning info card */}
        <View style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.lg }]}>
          <ShieldAlert color="#EF4444" size={20} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: t.textPrimary }]}>Dynamic Real-time Refresh</Text>
            <Text style={[styles.infoDesc, { color: t.textSecondary }]}>
              These controls use persistent AsyncStorage. Changes are applied immediately and reactive UI blocks will filter content instantly without requiring an app reload.
            </Text>
          </View>
        </View>

        {/* Dynamic State Info */}
        <View style={[styles.stateInfoCard, { borderColor: t.border, marginTop: spacing.md }]}>
          <BadgeInfo color={t.textSecondary} size={16} />
          <Text style={[styles.stateInfoText, { color: t.textSecondary }]}>
            Active Modules: {[
              enableMarketplace && 'Marketplace',
              enableRideSharing && 'Ride Sharing',
              enableParking && 'Smart Parking'
            ].filter(Boolean).join(', ') || 'None (All Disabled)'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  loadingWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
    gap: 3,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  infoCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  stateInfoCard: {
    flexDirection: 'row',
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
  },
  stateInfoText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
