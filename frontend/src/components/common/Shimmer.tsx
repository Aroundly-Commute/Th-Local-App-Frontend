import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { lightTheme, darkTheme } from '../../theme';
import { useColorScheme } from 'react-native';

export const Shimmer: React.FC<{ style?: ViewStyle | ViewStyle[] }> = ({ style }) => {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.base, { backgroundColor: t.shimmerBase }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: t.shimmerHighlight }, animatedStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  base: { borderRadius: 12, overflow: 'hidden' },
});
