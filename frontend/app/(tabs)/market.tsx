/**
 * (tabs)/market.tsx
 * Unified Explore tab screen showing a premium "Coming Soon" page with active mode switcher.
 */
import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass } from 'lucide-react-native';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { FloatView, FadeUp } from '../../src/components/marketplace/primitives';

export default function ExploreComingSoonScreen() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      <View style={styles.centerContainer}>
        <FloatView delay={100} style={[styles.iconContainer, { backgroundColor: t.muted }]}>
          <Compass color={t.textPrimary} size={48} strokeWidth={1.5} />
        </FloatView>

        <FadeUp delay={300} style={styles.textContainer}>
          <Text style={[styles.title, { color: t.textPrimary }]}>Explore Coming Soon</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            We're building a state-of-the-art interactive map to discover nearby rides, trending local stores, and professional service providers. Stay tuned for a brand new neighborhood experience! 🚀
          </Text>
        </FadeUp>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 80,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});
