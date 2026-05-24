/**
 * src/modules/marketplace/screens/MarketDashboard.tsx
 * Encapsulated Marketplace dashboard (home + detail views).
 * Decoupled from file-based routing.
 */
import React, { useState } from 'react';
import {
  View, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, Easing,
} from 'react-native-reanimated';

import { verdexColors as G } from '../../../core/theme/theme';
import { Toast }             from '../components/primitives';
import { MarketHome }        from './MarketHome';
import { ShopDetail }        from './ShopDetail';
import { useRouter }         from 'expo-router';

type MarketScreen = 'home' | 'detail';

export default function MarketDashboard() {
  const router = useRouter();
  const [screen,      setScreen]      = useState<MarketScreen>('home');
  const [toast,       setToast]       = useState<string | null>(null);

  // Dynamic detail states
  const [selectedShopId, setSelectedShopId] = useState<string>('s1');
  const [selectedShopType, setSelectedShopType] = useState<'shop' | 'provider'>('shop');

  // Fade transition
  const opacity  = useSharedValue(1);
  const slideX   = useSharedValue(0);
  const screenAnim = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateX: slideX.value }],
  }));

  const goScreen = (s: MarketScreen) => {
    opacity.value  = withTiming(0, { duration: 120, easing: Easing.in(Easing.quad) });
    slideX.value   = withTiming(24, { duration: 120 });
    setTimeout(() => {
      setScreen(s);
      opacity.value = withTiming(1, { duration: 200 });
      slideX.value  = withTiming(0, { duration: 200 });
    }, 130);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: G.surf }}>
      {/* ── Screen content with fade+slide transition ── */}
      <Animated.View style={[{ flex: 1 }, screenAnim]}>
        {screen === 'home' ? (
          <MarketHome
            onShopPress={(id, type) => {
              router.push(`/shop/${id}?type=${type}` as any);
            }}
            showToast={showToast}
          />
        ) : (
          <ShopDetail
            shopId={selectedShopId}
            shopType={selectedShopType}
            onBack={() => goScreen('home')}
            showToast={showToast}
          />
        )}
      </Animated.View>

      {/* ── Toast ── */}
      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <Toast message={toast} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center', zIndex: 999 },
});
