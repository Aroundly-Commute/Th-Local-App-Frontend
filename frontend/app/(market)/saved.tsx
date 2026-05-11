import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { lightTheme, darkTheme, spacing } from '../../src/theme';
import { ModeSwitcher } from '../../src/ModeSwitcher';

export default function Saved() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ModeSwitcher />
      <View style={styles.empty}>
        <Bookmark color={t.textTertiary} size={42} />
        <Text style={[styles.title, { color: t.textPrimary }]}>No saved shops yet</Text>
        <Text style={[styles.hint, { color: t.textSecondary }]}>Tap the bookmark on any shop to save it for quick access.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: 6 },
  title: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  hint: { fontSize: 13, textAlign: 'center' },
});
