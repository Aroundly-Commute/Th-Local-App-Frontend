import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { ShoppingBag, Car } from 'lucide-react-native';
import { verdexColors as G } from '../theme/theme';
import { tap } from '../utils/haptics';
import { useMarketData } from '../../modules/marketplace/contexts/MarketDataContext';
import { useFeatureFlags } from '../../services/feature-flag/FeatureFlagContext';

/**
 * Verdex-style persistent top switcher.
 * Swaps between "Marketplace" and "Pooling" (Commute).
 * Responsive to dynamic feature flags.
 */
export const ModeSwitcher: React.FC = () => {
  const { activeMode, setActiveMode } = useMarketData();
  const { enableMarketplace, enableRideSharing } = useFeatureFlags();

  // If either marketplace or ride sharing is disabled, no switching is possible.
  if (!enableMarketplace || !enableRideSharing) {
    return null;
  }

  const inMarket = activeMode === 'marketplace';

  const handlePress = (target: 'marketplace' | 'pooling') => {
    tap();
    setActiveMode(target);
  };

  return (
    <View style={s.container}>
      <View style={[s.bar, { backgroundColor: '#fff', borderColor: `${G.g200}50` }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress('marketplace')}
          style={[s.btn, inMarket && { backgroundColor: G.g700 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <ShoppingBag color={inMarket ? G.lime : G.txt2} size={15} strokeWidth={2.5} />
            <Text style={[s.label, { color: inMarket ? G.lime : G.txt2 }]}>
              Marketplace
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress('pooling')}
          style={[s.btn, !inMarket && { backgroundColor: G.g700 }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Car color={!inMarket ? G.lime : G.txt2} size={16} strokeWidth={2.5} />
            <Text style={[s.label, { color: !inMarket ? G.lime : G.txt2 }]}>
              Pooling
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 12 : 12,
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
    shadowOpacity: 0.06,
    shadowRadius: 8,
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
