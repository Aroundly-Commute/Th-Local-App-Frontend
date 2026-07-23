import React, { useState } from 'react';
import {
  View,
  Text,
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
  Car, MapPin, Award, Leaf, Terminal 
} from 'lucide-react-native';
import { useFeatureFlags } from '../../../services/feature-flag/FeatureFlagContext';
import { lightTheme, spacing } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { WebPermissionModal } from '../../../core/components/WebPermissionModal';
import { styles } from './Settings.styles';

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
  const [headerTapCount, setHeaderTapCount] = useState(0);

  const handleHeaderTap = () => {
    tap();
    setHeaderTapCount((prev) => {
      const next = prev + 1;
      if (next >= 10) {
        setFeatureModalVisible(true);
        return 0;
      }
      return next;
    });
  };

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
    { icon: Lock, label: 'Permissions', action: handlePermissionsClick },
    { icon: Info, label: 'App Settings', action: () => setAppSettingsModalVisible(true) },
    { icon: BookOpen, label: 'Privacy Policy', action: () => { tap(); router.push('/privacy' as any); } },
    { icon: User, label: 'Manage Account', action: () => { tap(); router.push('/delete-account' as any); } },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Settings" onBack={handleBack} onTitlePress={handleHeaderTap} />

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
      <WebPermissionModal
        visible={webPermissionModalVisible}
        onClose={() => setWebPermissionModalVisible(false)}
      />

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
                <Text style={{ color: t.textPrimary, fontWeight: '700' }}>1.0.4</Text>
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
