import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, cancelAnimation,
} from 'react-native-reanimated';
import { verdexColors as G } from '../../../core/theme/theme';

const ITEMS = [
  '🔥 Flash Sale LIVE', '⚡ 10-min delivery', '🌿 Local brands only',
  '💊 Pharma at your door', '🎓 Tutors near you', '🛒 1200+ shops listed',
];
const TEXT = ITEMS.join('   ·   ');

export const Ticker: React.FC = () => {
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(-1, { duration: 18000, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(x);
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value * 600 }],
  }));

  return (
    <View style={s.wrap}>
      <Animated.View style={anim}>
        <Text style={s.text} numberOfLines={1}>
          {TEXT}{'   ·   '}{TEXT}{'   ·   '}{TEXT}
        </Text>
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  wrap: {
    backgroundColor: G.g800,
    height: 32,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  text: {
    color: G.lime,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 0,
    includeFontPadding: false,
  },
});
