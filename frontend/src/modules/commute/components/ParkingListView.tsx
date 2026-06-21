import React from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, MapPin } from 'lucide-react-native';
import { Shimmer } from '../../../core/components/Shimmer';
import { spacing, radius } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';

interface ParkingListViewProps {
  spots: any[];
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSpotSelect: (spot: any) => void;
  getSpotStatus: (spot: any) => { status: any; avail: any; booking: any };
  getProximityText: (spot: any) => string;
  selectedSlotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  t: any;
  loading: boolean;
}

export function ParkingListView({
  spots,
  searchQuery,
  onSearchQueryChange,
  onSpotSelect,
  getSpotStatus,
  getProximityText,
  selectedSlotType,
  t,
  loading,
}: ParkingListViewProps) {

  // Filters search queries inside List view
  const availableSpotsList = spots.filter((spot) => {
    const { status } = getSpotStatus(spot);
    if (status !== 'AVAILABLE') return false;

    // Search query matches spot name or nearby tower letter
    if (searchQuery.trim() === '') return true;
    const query = searchQuery.toLowerCase();
    const spotNameMatch = spot.spotName.toLowerCase().includes(query);
    const textMatch = getProximityText(spot).toLowerCase().includes(query);
    return spotNameMatch || textMatch;
  });

  return (
    <View style={{ flex: 1, padding: spacing.md }}>
      <View style={[styles.searchBox, { borderColor: t.border, backgroundColor: t.surface }]}>
        <Search size={18} color={t.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: t.textPrimary }]}
          placeholder="Filter available spots by Tower A-J or Row..."
          placeholderTextColor={t.textTertiary}
          value={searchQuery}
          onChangeText={onSearchQueryChange}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ gap: 12 }}>
            <Shimmer style={{ height: 100, borderRadius: 12 }} />
            <Shimmer style={{ height: 100, borderRadius: 12 }} />
            <Shimmer style={{ height: 100, borderRadius: 12 }} />
          </View>
        ) : availableSpotsList.length === 0 ? (
          <View style={styles.emptyList}>
            <MapPin size={48} color={t.textTertiary} />
            <Text style={[styles.emptyListTitle, { color: t.textSecondary }]}>
              No available spots matching search
            </Text>
            <Text style={{ fontSize: 12, color: t.textTertiary, textAlign: 'center', marginTop: 4 }}>
              Change timing parameters, check other slots, or look for other levels.
            </Text>
          </View>
        ) : (
          availableSpotsList.map((spot) => {
            const { avail } = getSpotStatus(spot);
            return (
              <TouchableOpacity
                key={spot.id}
                activeOpacity={0.8}
                onPress={() => {
                  onSpotSelect(spot);
                  tap();
                }}
                style={[styles.spotListItem, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.listSpotBadge}>
                      <Text style={styles.listSpotBadgeTxt}>{spot.spotName}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: t.textSecondary }}>{spot.section} Section</Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary, marginTop: 8 }}>
                    {getProximityText(spot)}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.textTertiary, marginTop: 2 }}>
                    Owner: {spot.owner?.name || 'Verified Employee'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: t.success }}>
                    ₹
                    {avail?.slotType === selectedSlotType
                      ? avail?.price
                      : selectedSlotType === 'HOURLY'
                      ? spot.priceHourly
                      : selectedSlotType === 'DAILY'
                      ? spot.priceDaily
                      : selectedSlotType === 'WEEKLY'
                      ? spot.priceWeekly
                      : spot.priceMonthly}
                  </Text>
                  <View style={styles.listActionBtn}>
                    <Text style={styles.listActionTxt}>Select</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: 80,
    gap: 8,
  },
  emptyListTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  spotListItem: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  listSpotBadge: {
    backgroundColor: '#0F2240',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  listSpotBadgeTxt: {
    color: '#00E5CC',
    fontSize: 10,
    fontWeight: '800',
  },
  listActionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 8,
  },
  listActionTxt: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
