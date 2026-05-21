import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Platform } from 'react-native';
import { useSegments } from 'expo-router';
import { verdexColors as G, lightTheme, darkTheme } from './theme';
import { tap } from './haptics';
import { useMarketData } from './contexts/MarketDataContext';

/**
 * Verdex-style persistent top switcher.
 * Swaps between "Marketplace" and "Pooling".
 */
export const ModeSwitcher: React.FC = () => {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const segs = useSegments() as string[];
  const { activeMode, setActiveMode } = useMarketData();
  
  // Logic to determine active tab based on context state
  const inMarket = activeMode === 'marketplace';
  const inAuth = segs.includes('(auth)');

  // Don't show in auth screens or splash
  if (inAuth || (segs.length === 0)) return null;

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
          <Text style={[s.label, { color: inMarket ? G.lime : G.txt2 }]}>
            🏪 Marketplace
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => handlePress('pooling')}
          style={[s.btn, !inMarket && { backgroundColor: G.g700 }]}
        >
          <Text style={[s.label, { color: !inMarket ? G.lime : G.txt2 }]}>
            🚗 Pooling
          </Text>
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
