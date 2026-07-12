import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, CreditCard } from 'lucide-react-native';
import { lightTheme, spacing, radius } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';

export default function PaymentsScreen() {
  const t = lightTheme;
  const router = useRouter();

  const handleBack = () => {
    tap();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: '#EFF6FF' }]}>
          <CreditCard color="#3B82F6" size={40} />
        </View>
        <Text style={[styles.title, { color: t.textPrimary }]}>Payments Coming Soon</Text>
        <Text style={[styles.subtitle, { color: t.textSecondary }]}>
          We are currently integrating secure cashless transactions, UPI auto-splits, and wallet cards to make paying for shared rides and parking absolutely seamless.
        </Text>
        
        <View style={[styles.badge, { backgroundColor: '#DBEAFE' }]}>
          <Text style={styles.badgeText}>🚀 Feature Preview</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  badgeText: {
    color: '#1E40AF',
    fontSize: 13,
    fontWeight: '700',
  },
});
