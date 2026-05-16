/**
 * market/components/MarketBottomNav.tsx
 * Verdex-style bottom navigation with SVG icons, animated slide-in underline,
 * active scale-pop, and cart badge count.
 */
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, cancelAnimation,
} from 'react-native-reanimated';
import { verdexColors as G } from '../../../src/theme';
import {
  IconHome, IconGrid, IconCart, IconHeart, IconUser,
} from './primitives';

const { width: SW } = Dimensions.get('window');

export type NavTab = 'home' | 'explore' | 'cart' | 'saved' | 'profile';

interface Props {
  active: NavTab;
  cartCount: number;
  onSelect: (tab: NavTab) => void;
}

const NAV: { key: NavTab; label: string }[] = [
  { key: 'home',    label: 'Home'    },
  { key: 'explore', label: 'Explore' },
  { key: 'cart',    label: 'Cart'    },
  { key: 'saved',   label: 'Saved'   },
  { key: 'profile', label: 'Profile' },
];

const TAB_W = SW / NAV.length;

function TabIcon({ tabKey, active }: { tabKey: NavTab; active: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (active) {
      scale.value = withSequence(
        withTiming(1.22, { duration: 120 }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [active]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const c = active ? G.lime : '#6AA8C0';
  return (
    <Animated.View style={anim}>
      <View style={[s.iconBox, active && { backgroundColor: G.g800 }]}>
        {tabKey === 'home'    && <IconHome    c={c} />}
        {tabKey === 'explore' && <IconGrid    c={c} />}
        {tabKey === 'cart'    && <IconCart    c={c} />}
        {tabKey === 'saved'   && <IconHeart   c={c} filled={active} />}
        {tabKey === 'profile' && <IconUser    c={c} />}
      </View>
    </Animated.View>
  );
}

export const MarketBottomNav: React.FC<Props> = ({ active, cartCount, onSelect }) => {
  const indicatorX = useSharedValue(0);

  useEffect(() => {
    const idx = NAV.findIndex(n => n.key === active);
    indicatorX.value = withSpring(idx * TAB_W + (TAB_W - 20) / 2, { damping: 20, stiffness: 160 });
  }, [active]);

  const indStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.value }] }));

  return (
    <View style={s.wrap}>
      {/* Sliding underline indicator */}
      <Animated.View style={[s.indicator, indStyle]} />

      {NAV.map(n => {
        const isActive = n.key === active;
        return (
          <TouchableOpacity key={n.key} onPress={() => onSelect(n.key)} style={s.tab} activeOpacity={0.8}>
            <View style={{ position: 'relative' }}>
              <TabIcon tabKey={n.key} active={isActive} />
              {/* Cart badge */}
              {n.key === 'cart' && cartCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                </View>
              )}
            </View>
            <Text style={[s.label, { color: isActive ? G.g600 : '#6AA8C0' }]}>{n.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: `${G.g300}20`,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    flexShrink: 0,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3.5,
    backgroundColor: G.g400,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    zIndex: 2,
  },
  tab:     { flex: 1, alignItems: 'center', gap: 3 },
  iconBox: { width: 40, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label:   { fontSize: 9.5, fontWeight: '700' },
  badge: {
    position: 'absolute', top: -4, right: -5,
    backgroundColor: G.lime, minWidth: 17, height: 17,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  badgeText: { color: G.g900, fontSize: 8, fontWeight: '900' },
});
