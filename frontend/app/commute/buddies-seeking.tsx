import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, RefreshControl, Platform, ActivityIndicator } from 'react-native';

import { useFocusEffect, useRouter } from 'expo-router';
import { Clock, Users } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { Shimmer } from '../../src/core/components/Shimmer';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { BuddyCard } from '../../src/modules/commute/components/BuddyCard';
import { useQuery } from '@tanstack/react-query';
import { Alert } from '../../src/core/components/CustomAlert';

export default function BuddiesSeeking() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [limit, setLimit] = useState(10);
  const hasInitialFetched = useRef(false);

  const { data: buddies, isLoading: cacheLoading, refetch: refresh } = useQuery({
    queryKey: ['buddies', 'list', limit],
    queryFn: async () => {
      const { data } = await api.get(`/matchmaking/buddies?page=1&limit=${limit}`);
      return data || [];
    }
  });

  const loading = cacheLoading && !buddies;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } catch {} finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      if (hasInitialFetched.current) {
        refresh().catch(() => {});
      } else {
        hasInitialFetched.current = true;
      }
    }, [refresh])
  );

  const handleBuddyPress = (buddy: any) => {
    tap();
    let origin_lat, origin_lng, dest_lat, dest_lng;
    if (buddy.startPointGeoJson) {
      try { const p = typeof buddy.startPointGeoJson === 'string' ? JSON.parse(buddy.startPointGeoJson) : buddy.startPointGeoJson; origin_lng = p.coordinates[0]; origin_lat = p.coordinates[1]; } catch {}
    }
    if (buddy.endPointGeoJson) {
      try { const p = typeof buddy.endPointGeoJson === 'string' ? JSON.parse(buddy.endPointGeoJson) : buddy.endPointGeoJson; dest_lng = p.coordinates[0]; dest_lat = p.coordinates[1]; } catch {}
    }
    router.push({
      pathname: `/buddy/${buddy.id}` as any,
      params: {
        fromName: buddy.startPlaceName,
        toName: buddy.endPlaceName,
        fromLat: origin_lat ? String(origin_lat) : undefined,
        fromLng: origin_lng ? String(origin_lng) : undefined,
        toLat: dest_lat ? String(dest_lat) : undefined,
        toLng: dest_lng ? String(dest_lng) : undefined,
      }
    });
  };

  const hasMore = buddies && buddies.length >= limit;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader 
        title="Buddies Seeking Rides" 
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 140, gap: 12 }}
        refreshControl={Platform.OS !== 'web' ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.textPrimary} /> : undefined}
      >
        {loading ? (
          <>
            <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
            <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
            <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
          </>
        ) : buddies?.length === 0 ? (
          <View style={styles.empty}>
            <Users color={t.textTertiary} size={42} />
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No active buddy requests</Text>
            <Text style={[styles.emptyHint, { color: t.textSecondary }]}>There are no pending ride requests from other commuters at the moment.</Text>
          </View>
        ) : (
          <>
            {buddies?.map((b: any) => (
              <BuddyCard
                key={b.id}
                buddy={b}
                t={t}
                onPress={() => handleBuddyPress(b)}
              />
            ))}
            {hasMore && (
              <TouchableOpacity
                onPress={() => { tap(); setLimit(prev => prev + 10); }}
                activeOpacity={0.8}
                style={[styles.showMoreBtn, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <Text style={[styles.showMoreText, { color: t.textPrimary }]}>Show More</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// BuddyCard is now imported as a separate component from ../../src/modules/commute/components/BuddyCard;

const styles = StyleSheet.create({
  empty: { alignItems: 'center', padding: 40, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  emptyHint: { fontSize: 13, textAlign: 'center' },
  showMoreBtn: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
