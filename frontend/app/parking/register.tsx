import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Info, BadgeCheck, ShieldAlert } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success } from '../../src/core/utils/haptics';

type SpotState = {
  id: string;
  spotName: string;
  level: number;
  section: 'LEFT' | 'MIDDLE' | 'RIGHT';
  row: number;
  col: number;
  ownerId: string | null;
  approved: boolean;
};

export default function RegisterParking() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user } = useAuth();

  const [spots, setSpots] = useState<SpotState[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<SpotState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load current spots status
  const fetchSpots = async () => {
    try {
      setLoading(true);
      // We query grid state for a dummy date to fetch all 90 master spots
      const { data } = await api.get('/parking/grid-state', {
        params: { date: '2026-05-22', slotType: 'HOURLY' },
      });
      setSpots(data);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to fetch parking grid.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const handleSpotPress = (spot: SpotState) => {
    tap();
    if (spot.ownerId) {
      if (spot.ownerId === user?.id) {
        Alert.alert('Your Spot', `You already own ${spot.spotName}!`);
      } else {
        Alert.alert('Already Owned', `Spot ${spot.spotName} is already registered by another owner.`);
      }
      return;
    }
    setSelectedSpot(selectedSpot?.id === spot.id ? null : spot);
  };

  const handleRegister = async () => {
    if (!selectedSpot) return;
    try {
      tap();
      setSubmitting(true);
      await api.post('/parking/register', { spotName: selectedSpot.spotName });
      success();
      Alert.alert(
        'Registration Success',
        `Successfully registered spot ${selectedSpot.spotName}! It is now active and approved for scheduling.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to register spot.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to render a specific spot square
  const renderSpot = (level: number, section: 'LEFT' | 'MIDDLE' | 'RIGHT', row: number, col: number) => {
    const spot = spots.find(
      (s) => s.level === level && s.section === section && s.row === row && s.col === col
    );

    if (!spot) {
      return <View style={[styles.spotMock, { borderColor: t.border }]} />;
    }

    const isMine = spot.ownerId === user?.id;
    const isOwned = spot.ownerId !== null;
    const isSelected = selectedSpot?.id === spot.id;

    let bgColor = t.surface;
    let borderColor = t.border;
    let textColor = t.textSecondary;

    if (isMine) {
      bgColor = t.successBg;
      borderColor = t.success;
      textColor = t.success;
    } else if (isOwned) {
      bgColor = t.muted;
      borderColor = 'transparent';
      textColor = t.textTertiary;
    } else if (isSelected) {
      bgColor = t.primary;
      borderColor = t.primary;
      textColor = t.primaryContrast;
    }

    // Label of the spot (e.g. L5-L-1 or 1-1)
    const label = section === 'MIDDLE' ? `${row}-${col}` : `${row}`;

    return (
      <TouchableOpacity
        key={spot.id}
        activeOpacity={0.7}
        onPress={() => handleSpotPress(spot)}
        style={[
          styles.spotSquare,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: isSelected || isMine ? 2 : 1,
          },
        ]}
      >
        <Text style={[styles.spotLabel, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // Helper to render Towers based on Level and Side
  const renderTower = (level: number, side: 'LEFT' | 'RIGHT') => {
    // Map towers:
    // Level 1: A (left), J (right)
    // Level 2: B (left), I (right)
    // Level 3: C (left), H (right)
    // Level 4: D (left), G (right)
    // Level 5: E (left), F (right)
    const towerLetters: { [key: number]: { LEFT: string; RIGHT: string } } = {
      1: { LEFT: 'A', RIGHT: 'J' },
      2: { LEFT: 'B', RIGHT: 'I' },
      3: { LEFT: 'C', RIGHT: 'H' },
      4: { LEFT: 'D', RIGHT: 'G' },
      5: { LEFT: 'E', RIGHT: 'F' },
    };

    const letter = towerLetters[level]?.[side] || '?';

    return (
      <View style={[styles.towerBlock, { backgroundColor: t.muted, borderColor: t.border }]}>
        <Text style={[styles.towerLetter, { color: t.textPrimary }]}>{letter}</Text>
        <Text style={[styles.towerSub, { color: t.textSecondary }]}>TOWER</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => { tap(); router.back(); }}>
          <ChevronLeft color={t.textPrimary} size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Register Parking</Text>
          <Text style={[styles.headerSub, { color: t.textSecondary }]}>
            Claim your physical spot in the master grid
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={{ color: t.textSecondary, marginTop: 12 }}>Loading master grid state...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Top Info Banner */}
            <View style={[styles.banner, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Info color={t.primary} size={18} />
              <Text style={[styles.bannerText, { color: t.textSecondary }]}>
                Tap any available <Text style={{ fontWeight: '700', color: t.textPrimary }}>white square</Text> to claim and register it as your spot.
              </Text>
            </View>

            {/* Visual Grid Layout representing the uploaded image */}
            <View style={styles.layoutContainer}>
              {/* Level 5 down to 1 */}
              {[5, 4, 3, 2, 1].map((level) => (
                <View key={level} style={[styles.levelRow, { borderColor: t.border }]}>
                  
                  {/* Level marker */}
                  <View style={styles.levelMarker}>
                    <Text style={{ color: t.textSecondary, fontSize: 10, fontWeight: '700' }}>LVL {level}</Text>
                  </View>

                  {/* Left Column: 3 vertical spots */}
                  <View style={styles.leftColumn}>
                    {renderSpot(level, 'LEFT', 1, 1)}
                    {renderSpot(level, 'LEFT', 2, 1)}
                    {renderSpot(level, 'LEFT', 3, 1)}
                  </View>

                  {/* Left Tower */}
                  {renderTower(level, 'LEFT')}

                  {/* Center Column: 3 rows x 4 columns grid */}
                  <View style={styles.centerGrid}>
                    {[1, 2, 3].map((rowIdx) => (
                      <View key={rowIdx} style={styles.centerGridRow}>
                        {[1, 2, 3, 4].map((colIdx) => (
                          <React.Fragment key={colIdx}>
                            {renderSpot(level, 'MIDDLE', rowIdx, colIdx)}
                          </React.Fragment>
                        ))}
                      </View>
                    ))}
                  </View>

                  {/* Right Tower */}
                  {renderTower(level, 'RIGHT')}

                  {/* Right Column: 3 vertical spots */}
                  <View style={styles.rightColumn}>
                    {renderSpot(level, 'RIGHT', 1, 1)}
                    {renderSpot(level, 'RIGHT', 2, 1)}
                    {renderSpot(level, 'RIGHT', 3, 1)}
                  </View>

                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1 }]} />
                <Text style={[styles.legendText, { color: t.textSecondary }]}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: t.primary }]} />
                <Text style={[styles.legendText, { color: t.textSecondary }]}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: t.muted }]} />
                <Text style={[styles.legendText, { color: t.textSecondary }]}>Owned by Other</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: t.successBg, borderColor: t.success, borderWidth: 1 }]} />
                <Text style={[styles.legendText, { color: t.textSecondary }]}>Your Spot</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={[styles.footer, { backgroundColor: t.background, borderTopColor: t.border }]}>
            <View style={styles.summaryContainer}>
              <Text style={{ color: t.textSecondary, fontSize: 13 }}>Selected Spot</Text>
              {selectedSpot ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <BadgeCheck color={t.primary} size={18} />
                  <Text style={[styles.summaryTitle, { color: t.textPrimary }]}>
                    {selectedSpot.spotName} ({selectedSpot.section} Grid)
                  </Text>
                </View>
              ) : (
                <Text style={[styles.summaryPlaceholder, { color: t.textTertiary }]}>
                  None Selected
                </Text>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!selectedSpot || submitting}
              onPress={handleRegister}
              style={[
                styles.cta,
                { backgroundColor: selectedSpot ? t.primary : t.muted },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={t.primaryContrast} />
              ) : (
                <Text
                  style={[
                    styles.ctaText,
                    { color: selectedSpot ? t.primaryContrast : t.textSecondary },
                  ]}
                >
                  {selectedSpot ? 'Claim & Register Spot' : 'Select a spot above'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 140,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  layoutContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing.sm,
    width: '100%',
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
    alignItems: 'center',
  },
  rightColumn: {
    flexDirection: 'column',
    gap: spacing.xs,
    alignItems: 'center',
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
  spotSquare: {
    width: 25,
    height: 25,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotMock: {
    width: 25,
    height: 25,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  spotLabel: {
    fontSize: 9,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
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
  legendText: {
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.lg,
    borderTopWidth: 1,
    flexDirection: 'column',
    gap: spacing.md,
  },
  summaryContainer: {
    flexDirection: 'column',
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryPlaceholder: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  cta: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
