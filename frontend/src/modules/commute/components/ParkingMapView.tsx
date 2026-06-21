import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SpotSquare } from './SpotSquare';
import { spacing, radius } from '../../../core/theme/theme';

interface ParkingMapViewProps {
  spots: any[];
  selectedSpot: any;
  onSpotPress: (spot: any) => void;
  getSpotStatus: (spot: any) => { status: any; avail: any; booking: any };
  t: any;
  loading: boolean;
}

export function ParkingMapView({
  spots,
  selectedSpot,
  onSpotPress,
  getSpotStatus,
  t,
  loading,
}: ParkingMapViewProps) {

  const renderVisualSpot = (level: number, section: 'LEFT' | 'MIDDLE' | 'RIGHT', row: number, col: number) => {
    const spot = spots.find(
      (s) => s.level === level && s.section === section && s.row === row && s.col === col
    );

    if (!spot) {
      return (
        <SpotSquare
          key={`mock-${level}-${section}-${row}-${col}`}
          t={t}
          level={level}
          section={section}
          row={row}
          col={col}
        />
      );
    }

    const { status } = getSpotStatus(spot);
    const isSelected = selectedSpot?.id === spot.id;

    return (
      <SpotSquare
        key={spot.id}
        spot={spot}
        status={status}
        isSelected={isSelected}
        t={t}
        onPress={onSpotPress}
        level={level}
        section={section}
        row={row}
        col={col}
      />
    );
  };

  const renderVisualTower = (level: number, side: 'LEFT' | 'RIGHT') => {
    const towerLetters: { [key: number]: { LEFT: string; RIGHT: string } } = {
      1: { LEFT: 'A', RIGHT: 'J' },
      2: { LEFT: 'B', RIGHT: 'I' },
      3: { LEFT: 'C', RIGHT: 'H' },
      4: { LEFT: 'D', RIGHT: 'G' },
      5: { LEFT: 'E', RIGHT: 'F' },
    };
    const letter = towerLetters[level]?.[side] || '?';

    return (
      <View
        key={`tower-${level}-${side}`}
        style={[styles.towerBlock, { backgroundColor: t.muted, borderColor: t.border }]}
      >
        <Text style={[styles.towerLetter, { color: t.textPrimary }]}>{letter}</Text>
        <Text style={[styles.towerSub, { color: t.textSecondary }]}>TOWER</Text>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.mapScrollBody}>
        {/* Legends color code */}
        <View style={[styles.legendContainer, { marginTop: 0, marginBottom: spacing.md }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.legendLabel, { color: t.textSecondary }]}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 }]} />
            <Text style={[styles.legendLabel, { color: t.textSecondary }]}>Unavailable</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: t.successBg, borderColor: t.success, borderWidth: 1 }]} />
            <Text style={[styles.legendLabel, { color: t.textSecondary }]}>Your Booking</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: t.warningBg, borderColor: t.warning, borderWidth: 1 }]} />
            <Text style={[styles.legendLabel, { color: t.textSecondary }]}>Your Request</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: t.errorBg, borderColor: t.error, borderWidth: 1 }]} />
            <Text style={[styles.legendLabel, { color: t.textSecondary }]}>Occupied</Text>
          </View>
        </View>

        {/* Master 90 spot physical visual layout grid */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
          <View style={styles.layoutGridContainer}>
            {[5, 4, 3, 2, 1].map((level) => (
              <View key={level} style={[styles.levelRow, { borderColor: t.border }]}>
                {/* Level Tag */}
                <View style={styles.levelMarker}>
                  <Text style={{ color: t.textTertiary, fontSize: 9, fontWeight: '800' }}>LVL {level}</Text>
                </View>

                {/* Left Column Section: 3 vertical spots */}
                <View style={styles.leftColumn}>
                  {renderVisualSpot(level, 'LEFT', 1, 1)}
                  {renderVisualSpot(level, 'LEFT', 2, 1)}
                  {renderVisualSpot(level, 'LEFT', 3, 1)}
                </View>

                {/* Left Tower blocks */}
                {renderVisualTower(level, 'LEFT')}

                {/* Center Section Grid: 3 rows x 4 columns */}
                <View style={styles.centerGrid}>
                  {[1, 2, 3].map((rowIdx) => (
                    <View key={rowIdx} style={styles.centerGridRow}>
                      {[1, 2, 3, 4].map((colIdx) => renderVisualSpot(level, 'MIDDLE', rowIdx, colIdx))}
                    </View>
                  ))}
                </View>

                {/* Right Tower blocks */}
                {renderVisualTower(level, 'RIGHT')}

                {/* Right Column Section: 3 vertical spots */}
                <View style={styles.rightColumn}>
                  {renderVisualSpot(level, 'RIGHT', 1, 1)}
                  {renderVisualSpot(level, 'RIGHT', 2, 1)}
                  {renderVisualSpot(level, 'RIGHT', 3, 1)}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      {loading && (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: t.isDark ? 'rgba(10, 22, 40, 0.65)' : 'rgba(255, 255, 255, 0.65)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10,
            },
          ]}
        >
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={{ color: t.textSecondary, marginTop: 12, fontSize: 13, fontWeight: '600' }}>
            syncing parking state...
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapScrollBody: {
    padding: spacing.md,
    paddingBottom: 160,
  },
  layoutGridContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.sm,
    position: 'relative',
  },
  levelMarker: {
    position: 'absolute',
    left: 8,
    top: 4,
  },
  leftColumn: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  rightColumn: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  towerBlock: {
    width: 52,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  towerLetter: {
    fontSize: 22,
    fontWeight: '800',
  },
  towerSub: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  centerGrid: {
    flexDirection: 'column',
    gap: spacing.xs,
  },
  centerGridRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
