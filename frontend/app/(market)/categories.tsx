import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { ModeSwitcher } from '../../src/core/components/ModeSwitcher';
import { tap } from '../../src/core/utils/haptics';
import { mockCategories } from '../../src/modules/marketplace/screens/marketData';

export default function Categories() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [cats, setCats] = useState<any[]>([]);

  useEffect(() => { setCats(mockCategories); }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ModeSwitcher />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 130 }}>
        <Text style={[styles.h1, { color: t.textPrimary }]}>All Categories</Text>
        <Text style={[styles.sub, { color: t.textSecondary }]}>Browse every shop type in your community</Text>

        <View style={styles.grid}>
          {cats.map((c) => (
            <TouchableOpacity
              key={c.id}
              testID={`cat-tile-${c.id}`}
              activeOpacity={0.85}
              onPress={() => { tap(); router.push({ pathname: '/(market)', params: { category: c.id } } as any); }}
              style={[styles.tile, { backgroundColor: t.surface, borderColor: t.border }]}
            >
              <View style={[styles.icon, { backgroundColor: t.mintBg }]}>
                <Text style={{ fontSize: 26 }}>{c.icon}</Text>
              </View>
              <Text style={[styles.name, { color: t.textPrimary }]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6, marginTop: spacing.sm },
  sub: { fontSize: 13, marginTop: 4, marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47.5%', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, gap: 10, minHeight: 110 },
  icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700' },
});
