/**
 * market/components/primitives.tsx
 * Shared atomic components for the Verdex marketplace UI.
 * All animation uses react-native-reanimated (already installed).
 */
import React, { useEffect, useState } from 'react';
import {
  TouchableOpacity, Text, View, StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, withDelay, cancelAnimation, Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Polyline, Rect, Line } from 'react-native-svg';
import { verdexColors as G } from '../../theme';

// ─── Ripple / Tap Button ──────────────────────────────────────────────────────

export const RippleTap: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: any;
}> = ({ children, onPress, style }) => {
  const scale   = useSharedValue(1);
  const opacity = useSharedValue(1);

  const pressIn  = () => { scale.value = withTiming(0.93, { duration: 80 }); opacity.value = withTiming(0.82, { duration: 80 }); };
  const pressOut = () => { scale.value = withSpring(1, { damping: 12 }); opacity.value = withTiming(1, { duration: 120 }); };

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={pressIn}
      onPressOut={pressOut}
      onPress={onPress}
      style={style}
    >
      <Animated.View style={[anim, { flex: 1 }]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// ─── Float Animation Wrapper ──────────────────────────────────────────────────

export const FloatView: React.FC<{ children: React.ReactNode; delay?: number; style?: any }> = ({ children, delay = 0, style }) => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      ), -1
    ));
    return () => cancelAnimation(y);
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
};

// ─── Pulse Animation Wrapper ──────────────────────────────────────────────────

export const PulseView: React.FC<{ children: React.ReactNode; style?: any }> = ({ children, style }) => {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.06, { duration: 1000 }), withTiming(1, { duration: 1000 })),
      -1
    );
    return () => cancelAnimation(scale);
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
};

// ─── Fade-Slide-Up Wrapper ────────────────────────────────────────────────────

export const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; style?: any }> = ({ children, delay = 0, style }) => {
  const y       = useSharedValue(18);
  const opacity = useSharedValue(0);
  useEffect(() => {
    y.value       = withDelay(delay, withTiming(0, { duration: 380, easing: Easing.out(Easing.quad) }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: opacity.value }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
};

// ─── Animated Count-Up Number ─────────────────────────────────────────────────

export const CountUp: React.FC<{ target: number; suffix?: string; style?: any }> = ({ target, suffix = '', style }) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let cur = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      cur += step;
      if (cur >= target) { setVal(target); clearInterval(id); }
      else setVal(cur);
    }, 18);
    return () => clearInterval(id);
  }, [target]);
  return <Text style={style}>{val.toLocaleString()}{suffix}</Text>;
};

// ─── Flash Countdown Timer ────────────────────────────────────────────────────

export const FlashCountdown: React.FC<{ t: any }> = ({ t }) => {
  const [time, setTime] = useState(7423);
  useEffect(() => {
    const id = setInterval(() => setTime(p => p > 0 ? p - 1 : 7200), 1000);
    return () => clearInterval(id);
  }, []);
  const h = String(Math.floor(time / 3600)).padStart(2, '0');
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0');
  const s = String(time % 60).padStart(2, '0');

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {[h, m, s].map((seg, i) => (
        <React.Fragment key={i}>
          <View style={[p.timerBox, { backgroundColor: G.g800 }]}>
            <Text style={[p.timerText, { color: G.lime }]}>{seg}</Text>
          </View>
          {i < 2 && <Text style={{ color: G.g400, fontWeight: '800', fontSize: 13 }}>:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

export const Toast: React.FC<{ message: string }> = ({ message }) => {
  const y       = useSharedValue(20);
  const opacity = useSharedValue(0);
  useEffect(() => {
    y.value       = withSpring(0, { damping: 14 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }], opacity: opacity.value }));
  return (
    <Animated.View style={[p.toast, anim]}>
      <Text style={p.toastText}>{message}</Text>
    </Animated.View>
  );
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────

export const IconHome     = ({ c, sz = 22 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z" />
    <Path d="M9 21V12h6v9" />
  </Svg>
);
export const IconGrid     = ({ c, sz = 22 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" /><Rect x="14" y="3" width="7" height="7" rx="1.5" />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" /><Rect x="14" y="14" width="7" height="7" rx="1.5" />
  </Svg>
);
export const IconCart     = ({ c, sz = 22 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <Line x1="3" y1="6" x2="21" y2="6" />
    <Path d="M16 10a4 4 0 0 1-8 0" />
  </Svg>
);
export const IconHeart    = ({ c, sz = 22, filled = false }: { c: string; sz?: number; filled?: boolean }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </Svg>
);
export const IconUser     = ({ c, sz = 22 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </Svg>
);
export const IconZap      = ({ c, sz = 14, filled = false }: { c: string; sz?: number; filled?: boolean }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={filled ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </Svg>
);
export const IconMapPin   = ({ c, sz = 12 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <Circle cx="12" cy="10" r="3" />
  </Svg>
);
export const IconChevronDown  = ({ c, sz = 12 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="6 9 12 15 18 9" />
  </Svg>
);
export const IconChevronRight = ({ c, sz = 16 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="9 18 15 12 9 6" />
  </Svg>
);
export const IconSearch   = ({ c, sz = 16 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" /><Path d="m21 21-4.35-4.35" />
  </Svg>
);
export const IconShare    = ({ c, sz = 18 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="18" cy="5" r="3" /><Circle cx="6" cy="12" r="3" /><Circle cx="18" cy="19" r="3" />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Svg>
);
export const IconChevronLeft  = ({ c, sz = 18 }: { c: string; sz?: number }) => (
  <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);

import { useRouter } from 'expo-router';

export const MarketBackButton: React.FC<{
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
  style?: any;
}> = ({ onPress, color = G.g800, backgroundColor = '#fff', size = 18, style }) => {
  const router = useRouter();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(market)');
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        {
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
        },
        style
      ]}
    >
      <IconChevronLeft c={color} sz={size} />
    </TouchableOpacity>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const p = StyleSheet.create({
  timerBox:  { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 6 },
  timerText: { fontSize: 11, fontWeight: '800', fontFamily: 'monospace' },
  toast: {
    backgroundColor: G.g800,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  toastText: { color: G.lime, fontSize: 12.5, fontWeight: '700' },
});
