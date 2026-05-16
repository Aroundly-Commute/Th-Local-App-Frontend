/**
 * (market)/index.tsx
 * Root screen for the marketplace module.
 *
 * Layout:
 *   ┌─────────────────────────────────┐
 *   │  [Marketplace] [Pooling]  ← pill toggle (like verdex_app.jsx screen toggle)
 *   │─────────────────────────────────│
 *   │  Ticker  (live deals marquee)   │
 *   │─────────────────────────────────│
 *   │  MarketHome  OR  ShopDetail     │  ← internal screen state
 *   │─────────────────────────────────│
 *   │  MarketBottomNav                │
 *   └─────────────────────────────────┘
 *
 * Tapping "Pooling" uses expo-router to replace to /(tabs) — the carpool app.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSequence, Easing,
} from 'react-native-reanimated';

import { verdexColors as G } from '../../src/theme';
import { tap } from '../../src/haptics';
import { CartProvider, useCart } from './CartContext';
import { MarketBottomNav }   from './components/MarketBottomNav';
import { Toast }             from './components/primitives';
import { MarketHome }        from './MarketHome';
import { ShopDetail }        from './ShopDetail';

// ─── Inner app (wraps everything that needs CartContext) ──────────────────────

function InnerMarket() {
  const router = useRouter();
  const { totalCount } = useCart();

  const [appTab,      setAppTab]      = useState<AppTab>('marketplace');
  const [screen,      setScreen]      = useState<MarketScreen>('home');
  const [activeNav,   setActiveNav]   = useState<any>('home');
  const [toast,       setToast]       = useState<string | null>(null);

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

  const handleAppTab = (t: AppTab) => {
    if (t === 'pooling') {
      router.replace('/(tabs)');
      return;
    }
    setAppTab(t);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: G.surf }}>
      {/* ── Screen content with fade+slide transition ── */}
      <Animated.View style={[{ flex: 1 }, screenAnim]}>
        {screen === 'home' ? (
          <MarketHome
            onShopPress={() => goScreen('detail')}
            showToast={showToast}
          />
        ) : (
          <ShopDetail
            onBack={() => goScreen('home')}
            showToast={showToast}
          />
        )}
      </Animated.View>

      {/* ── Bottom nav ── */}
      <MarketBottomNav
        active={activeNav}
        cartCount={totalCount}
        onSelect={(tab) => {
          tap();
          setActiveNav(tab);
          if (tab === 'home') goScreen('home');
          if (tab === 'cart') showToast(`Cart: ${totalCount} item${totalCount !== 1 ? 's' : ''}`);
        }}
      />

      {/* ── Toast ── */}
      {toast && (
        <View style={styles.toastWrap} pointerEvents="none">
          <Toast message={toast} />
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Root export — wraps with CartProvider ────────────────────────────────────

export default function MarketIndex() {
  return (
    <CartProvider>
      <InnerMarket />
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', bottom: 90, left: 0, right: 0, alignItems: 'center', zIndex: 999 },
});
