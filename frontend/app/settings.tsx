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
import { ShoppingBag, Car, MapPin, ShieldAlert, BadgeInfo, Award, Leaf, Terminal, Shield } from 'lucide-react-native';
import { useFeatureFlags } from '../src/services/feature-flag/FeatureFlagContext';
import { lightTheme, darkTheme, spacing, radius } from '../src/core/theme/theme';
import { tap } from '../src/core/utils/haptics';
import { ScreenHeader } from '../src/core/components/ScreenHeader';

export default function SettingsScreen() {
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  const {
    enableMarketplace,
    enableRideSharing,
    enableParking,
    enableYourBadges,
    enableEcoStarter,
    enablePopularRoutes,
    enableInAppLogs,
    loading,
    toggleFeature,
  } = useFeatureFlags();

  const handleToggle = async (key: 'enableMarketplace' | 'enableRideSharing' | 'enableParking' | 'enableYourBadges' | 'enableEcoStarter' | 'enablePopularRoutes' | 'enableInAppLogs') => {
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
      <ScreenHeader title="Feature Settings" onBack={handleBack} />

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

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            {/* Your Badges toggle */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#F3E8FF' }]}>
                <Award color="#A855F7" size={18} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Your Badges Section</Text>
                <Text style={[styles.toggleDesc, { color: t.textTertiary }]}>
                  Display gained status badges like Eco Starter, First Drive, and Planet Saver.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={enableYourBadges ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => handleToggle('enableYourBadges')}
                value={enableYourBadges}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            {/* Eco Starter badge toggle */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Leaf color="#22C55E" size={18} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Eco Starter Badge</Text>
                <Text style={[styles.toggleDesc, { color: t.textTertiary }]}>
                  Enable or disable the specific introductory 🌱 Eco Starter badge in the badges strip.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={enableEcoStarter ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => handleToggle('enableEcoStarter')}
                value={enableEcoStarter}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            {/* Popular Routes toggle */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
                <MapPin color="#3B82F6" size={18} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Popular Routes</Text>
                <Text style={[styles.toggleDesc, { color: t.textTertiary }]}>
                  Display the "Popular Routes" section on the commute rides search screen.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={enablePopularRoutes ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => handleToggle('enablePopularRoutes')}
                value={enablePopularRoutes}
              />
            </View>

            <View style={[styles.divider, { backgroundColor: t.border }]} />

            {/* In-App Log Viewer toggle */}
            <View style={styles.toggleRow}>
              <View style={[styles.iconWrap, { backgroundColor: '#F1F5F9' }]}>
                <Terminal color="#475569" size={18} />
              </View>
              <View style={styles.toggleText}>
                <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Floating Debug Logs</Text>
                <Text style={[styles.toggleDesc, { color: t.textTertiary }]}>
                  Display the floating logger terminal icon on the top right of the application views.
                </Text>
              </View>
              <Switch
                trackColor={{ false: '#767577', true: '#10B981' }}
                thumbColor={enableInAppLogs ? '#FFFFFF' : '#f4f3f4'}
                ios_backgroundColor="#3e3e3e"
                onValueChange={() => handleToggle('enableInAppLogs')}
                value={enableInAppLogs}
              />
            </View>
          </View>
        )}
        {/* Legal & Privacy Section */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => { tap(); router.push('/privacy' as any); }}
          style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}
        >
          <Shield color={t.primary} size={20} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: t.textPrimary }]}>Privacy Policy</Text>
            <Text style={[styles.infoDesc, { color: t.textSecondary }]}>
              Read our official Privacy Notice to understand how we collect, store, and protect your data.
            </Text>
          </View>
        </TouchableOpacity>

        {/* Warning info card */}
        <View style={[styles.infoCard, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
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
              enableParking && 'Smart Parking',
              enableYourBadges && 'Your Badges',
              enableEcoStarter && 'Eco Starter',
              enablePopularRoutes && 'Popular Routes',
              enableInAppLogs && 'Debug Logs'
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
