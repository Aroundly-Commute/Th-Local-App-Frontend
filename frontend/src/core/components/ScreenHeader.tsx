import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Platform } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme, spacing, radius, shadowStyle } from '../theme/theme';
import { tap } from '../utils/haptics';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  rightComponent?: React.ReactNode;
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, onBack, rightComponent }) => {
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  const handleBack = () => {
    tap();
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: t.surface, borderBottomColor: t.border }]}>
      <TouchableOpacity
        testID="header-back-button"
        onPress={handleBack}
        style={[styles.backBtn, { backgroundColor: t.isDark ? '#142E58' : '#E8FBF9' }]}
        activeOpacity={0.8}
      >
        <ChevronLeft color={t.isDark ? '#00D4BC' : '#0A1628'} size={20} strokeWidth={2.8} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: t.textPrimary }]} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.right}>
        {rightComponent || <View style={{ width: 36 }} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    height: Platform.OS === 'ios' ? 52 : 56,
    zIndex: 100,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadowStyle('#000', { width: 0, height: 1 }, 0.1, 1.5, 2),
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    marginHorizontal: spacing.sm,
    letterSpacing: -0.4,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 36,
  },
});
