import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  Sliders, Lock, Info, BookOpen, User, ChevronRight, X, 
  Car, MapPin, Award, Leaf, Terminal, ShieldAlert 
} from 'lucide-react-native';
import { useFeatureFlags } from '../src/services/feature-flag/FeatureFlagContext';
import { lightTheme, spacing, radius } from '../src/core/theme/theme';
import { tap } from '../src/core/utils/haptics';
import { ScreenHeader } from '../src/core/components/ScreenHeader';

export default function SettingsScreen() {
  const router = useRouter();
  const t = lightTheme;

  const {
    enableRideSharing,
    enableParking,
    enableYourBadges,
    enableEcoStarter,
    enablePopularRoutes,
    enableInAppLogs,
    loading,
    toggleFeature,
  } = useFeatureFlags();

  const [featureModalVisible, setFeatureModalVisible] = useState(false);
  const [webPermissionModalVisible, setWebPermissionModalVisible] = useState(false);
  const [appSettingsModalVisible, setAppSettingsModalVisible] = useState(false);

  const handleToggle = async (key: 'enableRideSharing' | 'enableParking' | 'enableYourBadges' | 'enableEcoStarter' | 'enablePopularRoutes' | 'enableInAppLogs') => {
    tap();
    await toggleFeature(key);
  };

  const handlePermissionsClick = () => {
    tap();
    if (Platform.OS === 'web') {
      setWebPermissionModalVisible(true);
    } else {
      Linking.openSettings().catch((err) => {
        console.error('Failed to open settings:', err);
      });
    }
  };

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  };

  const menu = [
    { icon: Sliders, label: 'Feature Manager', action: () => setFeatureModalVisible(true) },
    { icon: Lock, label: 'Permissions', action: handlePermissionsClick },
    { icon: Info, label: 'App Settings', action: () => setAppSettingsModalVisible(true) },
    { icon: BookOpen, label: 'Privacy Policy', action: () => { tap(); router.push('/privacy' as any); } },
    { icon: User, label: 'Manage Account', action: () => { tap(); router.push('/delete-account' as any); } },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Settings" onBack={handleBack} />

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 60 }}>
        {/* Settings Menu List (Styled exactly like Profile menu) */}
        <View style={[styles.menu, { backgroundColor: t.surface, borderColor: t.border }]}>
          {menu.map((m, i) => {
            const Icon = m.icon;
            return (
              <React.Fragment key={m.label}>
                <TouchableOpacity
                  activeOpacity={0.6}
                  onPress={m.action}
                  style={styles.menuRow}
                >
                  <View style={[styles.menuIcon, { backgroundColor: t.surfaceElevated }]}>
                    <Icon color={t.textPrimary} size={16} />
                  </View>
                  <Text style={[styles.menuLabel, { color: t.textPrimary }]}>{m.label}</Text>
                  <ChevronRight color={t.textTertiary} size={16} />
                </TouchableOpacity>
                {i < menu.length - 1 && <View style={[styles.menuDivider, { backgroundColor: t.border }]} />}
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      {/* Feature Manager Modal */}
      <Modal
        visible={featureModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFeatureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.background, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Feature Manager</Text>
              <TouchableOpacity onPress={() => setFeatureModalVisible(false)} activeOpacity={0.7}>
                <X color={t.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={t.primary} />
              </View>
            ) : (
              <ScrollView style={{ width: '100%' }} contentContainerStyle={{ gap: spacing.md }}>
                {/* Ride Sharing toggle */}
                <View style={styles.toggleRow}>
                  <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Car color="#10B981" size={18} />
                  </View>
                  <View style={styles.toggleText}>
                    <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Ride Sharing (Commute)</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={enableRideSharing ? '#FFFFFF' : '#f4f3f4'}
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
                  </View>
                  <Switch
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={enableParking ? '#FFFFFF' : '#f4f3f4'}
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
                    <Text style={[styles.toggleLabel, { color: t.textPrimary }]}>Your Badges</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={enableYourBadges ? '#FFFFFF' : '#f4f3f4'}
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
                  </View>
                  <Switch
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={enableEcoStarter ? '#FFFFFF' : '#f4f3f4'}
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
                  </View>
                  <Switch
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={enablePopularRoutes ? '#FFFFFF' : '#f4f3f4'}
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
                  </View>
                  <Switch
                    trackColor={{ false: '#767577', true: '#10B981' }}
                    thumbColor={enableInAppLogs ? '#FFFFFF' : '#f4f3f4'}
                    onValueChange={() => handleToggle('enableInAppLogs')}
                    value={enableInAppLogs}
                  />
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Web Permissions Modal */}
      <Modal
        visible={webPermissionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setWebPermissionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.background }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Browser Permissions Guide</Text>
            <Text style={[styles.modalText, { color: t.textSecondary }]}>
              To update site permissions (Location, Notifications, etc.) for this web app:
            </Text>
            <View style={styles.modalSteps}>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                1. Look at the address bar of your browser.
              </Text>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                2. Click on the lock (🔒) or settings icon next to the URL.
              </Text>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                3. Locate the permission toggles and select "Allow" or "Ask".
              </Text>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                4. Reload the page to apply the changes.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.modalCloseBtn, { backgroundColor: t.primary }]}
              onPress={() => setWebPermissionModalVisible(false)}
            >
              <Text style={{ color: t.primaryContrast, fontWeight: '700' }}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* App Settings Modal */}
      <Modal
        visible={appSettingsModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setAppSettingsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>App Settings</Text>
              <TouchableOpacity onPress={() => setAppSettingsModalVisible(false)} activeOpacity={0.7}>
                <X color={t.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={{ width: '100%', gap: 14, marginVertical: spacing.md }}>
              <View style={styles.infoRow}>
                <Text style={{ color: t.textSecondary, fontWeight: '600' }}>App Version</Text>
                <Text style={{ color: t.textPrimary, fontWeight: '700' }}>1.0.0</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: t.textSecondary, fontWeight: '600' }}>Theme Mode</Text>
                <Text style={{ color: t.textPrimary, fontWeight: '700' }}>Light (Locked)</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: t.textSecondary, fontWeight: '600' }}>Default Language</Text>
                <Text style={{ color: t.textPrimary, fontWeight: '700' }}>English</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={{ color: t.textSecondary, fontWeight: '600' }}>App Build</Text>
                <Text style={{ color: t.textPrimary, fontWeight: '700' }}>Production Stable</Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.modalCloseBtn, { backgroundColor: t.primary, marginTop: spacing.md }]}
              onPress={() => setAppSettingsModalVisible(false)}
            >
              <Text style={{ color: t.primaryContrast, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  menu: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginLeft: 58,
  },
  loadingWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalSteps: {
    width: '100%',
    gap: 10,
    marginBottom: spacing.lg,
  },
  modalStep: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalCloseBtn: {
    height: 46,
    borderRadius: radius.pill,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    width: '100%',
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
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});
