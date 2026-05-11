import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import { Car, Store } from 'lucide-react-native';
import { lightTheme, darkTheme, radius } from './theme';
import { tap } from './haptics';

/**
 * Sticky top toggle that swaps between the carpool tabs and the marketplace tabs.
 * Place at the very top of every tabs screen.
 */
export const ModeSwitcher: React.FC = () => {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const segs = useSegments() as string[];
  const inMarket = segs.includes('(market)');

  const go = (target: 'pool' | 'market') => {
    tap();
    if (target === 'market' && !inMarket) router.replace('/(market)');
    if (target === 'pool' && inMarket) router.replace('/(tabs)');
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: t.background }}>
      <View style={[styles.wrap, { backgroundColor: t.muted }]}>
        <Btn testID="mode-pool" active={!inMarket} t={t} icon={<Car color={!inMarket ? t.primaryContrast : t.textSecondary} size={14} />} label="Pool" onPress={() => go('pool')} />
        <Btn testID="mode-market" active={inMarket} t={t} icon={<Store color={inMarket ? t.primaryContrast : t.textSecondary} size={14} />} label="Market" onPress={() => go('market')} />
      </View>
    </SafeAreaView>
  );
};

const Btn: React.FC<any> = ({ active, t, icon, label, onPress, testID }) => (
  <TouchableOpacity testID={testID} onPress={onPress} activeOpacity={0.85}
    style={[styles.btn, active && { backgroundColor: t.primary }]}>
    {icon}
    <Text style={{ color: active ? t.primaryContrast : t.textSecondary, fontSize: 13, fontWeight: '700' }}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignSelf: 'center', padding: 4, marginTop: 6, borderRadius: 9999, gap: 4 },
  btn: { flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999 },
});
