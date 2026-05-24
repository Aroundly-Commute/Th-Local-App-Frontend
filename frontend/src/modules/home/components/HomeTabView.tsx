import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, Car } from 'lucide-react-native';
import { verdexColors as G, lightTheme, darkTheme } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';
import { useMarketData } from '../../marketplace/contexts/MarketDataContext';
import { useFeatureFlags } from '../../../services/feature-flag/FeatureFlagContext';
import MarketDashboard from '../../marketplace/screens/MarketDashboard';
import CommuteDashboard from '../../commute/screens/CommuteDashboard';

export default function HomeTabView() {
  const { activeMode, setActiveMode } = useMarketData();
  const { enableMarketplace, enableRideSharing } = useFeatureFlags();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  // Resolve the active tab based on feature flags
  const effectiveTab = !enableMarketplace ? 'pooling' : !enableRideSharing ? 'marketplace' : activeMode;

  const inMarket = effectiveTab === 'marketplace';
  const showSwitcher = enableMarketplace && enableRideSharing;

  const handlePress = (target: 'marketplace' | 'pooling') => {
    tap();
    setActiveMode(target);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      {/* ── Segmented Top Switcher ── */}
      {showSwitcher && (
        <View style={[styles.switcherContainer, { backgroundColor: t.background }]}>
          <View style={[styles.bar, { backgroundColor: t.surface, borderColor: t.border }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handlePress('marketplace')}
              style={[styles.btn, inMarket && { backgroundColor: G.g800 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShoppingBag color={inMarket ? G.lime : t.textSecondary} size={15} strokeWidth={2.5} />
                <Text style={[styles.label, { color: inMarket ? G.lime : t.textSecondary }]}>
                  Marketplace
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handlePress('pooling')}
              style={[styles.btn, !inMarket && { backgroundColor: G.g800 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Car color={!inMarket ? G.lime : t.textSecondary} size={16} strokeWidth={2.5} />
                <Text style={[styles.label, { color: !inMarket ? G.lime : t.textSecondary }]}>
                  Pooling
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Active Dashboard Render ── */}
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, display: effectiveTab === 'marketplace' ? 'flex' : 'none' }}>
          <MarketDashboard />
        </View>
        <View style={{ flex: 1, display: effectiveTab === 'pooling' ? 'flex' : 'none' }}>
          <CommuteDashboard />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  switcherContainer: {
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 8,
    alignItems: 'center',
    zIndex: 1000,
  },
  bar: {
    flexDirection: 'row',
    gap: 6,
    borderRadius: 28,
    padding: 4,
    width: '92%',
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
