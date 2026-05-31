import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Key, Bus, ArrowLeft } from 'lucide-react-native';
import { lightTheme, darkTheme, spacing, radius } from '../src/core/theme/theme';
import { tap } from '../src/core/utils/haptics';

export default function ComingSoonScreen() {
  const router = useRouter();
  const { feature } = useLocalSearchParams();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const isDark = cs === 'dark';

  const featureName = (feature as string) || 'Feature';
  
  // Custom copy and icons based on the feature
  const isRental = featureName.toLowerCase().includes('rental');
  const Icon = isRental ? Key : Bus;
  
  const title = `${featureName} Coming Soon`;
  const description = isRental
    ? "Aroundly is bringing a state-of-the-art car rental service to your fingertips! Soon you'll be able to rent premium sedans, reliable SUVs, and electric vehicles by the hour or day directly from our trusted community partners."
    : "We are building an all-in-one public transit companion! Get real-time schedules, find the fastest metro and bus connections, and book private shuttle seats seamlessly to complete your multi-modal commute.";

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.container, { backgroundColor: t.background }]}>
      {/* Top Navigation Row */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={[styles.backIconBtn, { backgroundColor: t.surface, borderColor: t.border }]}
        >
          <ArrowLeft color={t.textPrimary} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Animated-like premium Icon Outer Container */}
        <View style={[styles.iconOuterRing, { borderColor: isDark ? t.border : '#61f8f8' }]}>
          <View style={[styles.iconInnerRing, { backgroundColor: isDark ? t.muted : '#eff4ff' }]}>
            <Icon color={isDark ? t.primary : '#006a6a'} size={48} strokeWidth={1.5} />
          </View>
        </View>

        {/* Text Container */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: t.textPrimary }]}>{title}</Text>
          <Text style={[styles.description, { color: t.textSecondary }]}>{description}</Text>
        </View>
      </View>

      {/* Bottom Button Container */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.85}
          style={[
            styles.backBtn,
            { backgroundColor: t.textPrimary }
          ]}
        >
          <Text style={[styles.backBtnText, { color: t.background }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  iconOuterRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconInnerRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  textContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  backBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
