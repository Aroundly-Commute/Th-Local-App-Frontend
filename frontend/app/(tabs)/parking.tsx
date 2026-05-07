import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme, Platform, Alert } from 'react-native';
import { MapPin, Info } from 'lucide-react-native';
import { lightTheme, darkTheme, spacing, radius } from '../../src/theme';
import { tap, success } from '../../src/haptics';

// Generate some dummy parking slots
const ROWS = 5;
const COLS = 4;
const generateSlots = () => {
  const slots = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const id = `${String.fromCharCode(65 + r)}${c + 1}`;
      // Randomly mark some as booked
      const isBooked = Math.random() > 0.7;
      row.push({ id, isBooked });
    }
    slots.push(row);
  }
  return slots;
};

const INITIAL_SLOTS = generateSlots();

export default function Parking() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const onSlotPress = (id: string, isBooked: boolean) => {
    if (isBooked) return;
    tap();
    setSelectedSlot(id === selectedSlot ? null : id);
  };

  const onBook = () => {
    if (!selectedSlot) return;
    success();
    Alert.alert('Booking Confirmed', `You have successfully booked parking slot ${selectedSlot}.`);
    setSelectedSlot(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: t.textPrimary }}>Parking Booking</Text>
        <Text style={{ fontSize: 15, color: t.textSecondary, marginTop: 4 }}>Select a slot in the GoPool Campus</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        {/* Screen/Entrance indicator */}
        <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
          <View style={[styles.entranceBar, { backgroundColor: t.primary }]} />
          <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: 8, fontWeight: '600', letterSpacing: 2 }}>ENTRANCE</Text>
        </View>

        {/* Parking Grid */}
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          {INITIAL_SLOTS.map((row, rIdx) => (
            <View key={rIdx} style={{ flexDirection: 'row', gap: spacing.md }}>
              {row.map((slot) => {
                const isSelected = selectedSlot === slot.id;
                
                let bgColor = t.surface;
                let borderColor = t.border;
                let textColor = t.textPrimary;

                if (slot.isBooked) {
                  bgColor = t.muted;
                  borderColor = 'transparent';
                  textColor = t.textTertiary;
                } else if (isSelected) {
                  bgColor = t.primary;
                  borderColor = t.primary;
                  textColor = t.primaryContrast;
                }

                return (
                  <TouchableOpacity
                    key={slot.id}
                    activeOpacity={0.7}
                    onPress={() => onSlotPress(slot.id, slot.isBooked)}
                    disabled={slot.isBooked}
                    style={[
                      styles.slot,
                      {
                        backgroundColor: bgColor,
                        borderColor: borderColor,
                        borderWidth: slot.isBooked ? 0 : 2,
                      }
                    ]}
                  >
                    <Text style={[styles.slotText, { color: textColor }]}>
                      {slot.id}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xl, marginTop: spacing.xxl }}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: t.surface, borderColor: t.border, borderWidth: 2 }]} />
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: t.primary }]} />
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: t.muted }]} />
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>Booked</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[styles.fab, { backgroundColor: t.background, borderTopColor: t.border }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ color: t.textSecondary, fontSize: 14 }}>Selected Slot</Text>
            <Text style={{ color: t.textPrimary, fontSize: 20, fontWeight: '700' }}>
              {selectedSlot ? selectedSlot : '--'}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: t.textSecondary, fontSize: 14 }}>Total Price</Text>
            <Text style={{ color: t.textPrimary, fontSize: 20, fontWeight: '700' }}>
              ${selectedSlot ? '5.00' : '0.00'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!selectedSlot}
          onPress={onBook}
          style={[
            styles.cta,
            { backgroundColor: selectedSlot ? t.primary : t.muted }
          ]}
        >
          <Text style={[
            styles.ctaText,
            { color: selectedSlot ? t.primaryContrast : t.textSecondary }
          ]}>
            {selectedSlot ? 'Book Parking' : 'Select a slot'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  entranceBar: {
    height: 6,
    width: 120,
    borderRadius: 3,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  slot: {
    width: 50,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotText: {
    fontSize: 15,
    fontWeight: '700',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  fab: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  cta: {
    height: 54,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
