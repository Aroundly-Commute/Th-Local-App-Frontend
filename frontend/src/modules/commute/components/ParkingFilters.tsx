import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, Calendar } from 'lucide-react-native';
import { tap } from '../../../core/utils/haptics';

export const HOURLY_SLOTS = [
  { label: '00:00 - 03:00', start: '00:00', end: '03:00' },
  { label: '03:00 - 06:00', start: '03:00', end: '06:00' },
  { label: '06:00 - 09:00', start: '06:00', end: '09:00' },
  { label: '09:00 - 12:00', start: '09:00', end: '12:00' },
  { label: '12:00 - 15:00', start: '12:00', end: '15:00' },
  { label: '15:00 - 18:00', start: '15:00', end: '18:00' },
  { label: '18:00 - 21:00', start: '18:00', end: '21:00' },
  { label: '21:00 - 24:00', start: '21:00', end: '24:00' },
];

interface ParkingFiltersProps {
  t: any;
  selectedSlotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  setSelectedSlotType: (type: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedHourlySlotIndex: number;
  setSelectedHourlySlotIndex: (index: number) => void;
  setShowDatePicker: (show: boolean) => void;
}

export function ParkingFilters({
  t,
  selectedSlotType,
  setSelectedSlotType,
  selectedDate,
  setSelectedDate,
  selectedHourlySlotIndex,
  setSelectedHourlySlotIndex,
  setShowDatePicker,
}: ParkingFiltersProps) {
  
  // Dynamic Horizontal Date Range Generator (7 Days starting from today)
  const dateOptions = (() => {
    const dates = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);

      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${monthNum}-${dayNum}`;

      dates.push({
        dateString,
        dayName: days[d.getDay()],
        dayVal: d.getDate(),
        monthName: months[d.getMonth()],
      });
    }
    return dates;
  })();

  return (
    <View style={{ backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 10 }}>
      {/* Timing Basis segmented control - NOW AT TOP */}
      <View style={[styles.durationRow, { marginTop: 10 }]}>
        {(['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map((basis) => {
          const isSel = selectedSlotType === basis;
          return (
            <TouchableOpacity
              key={basis}
              onPress={() => { tap(); setSelectedSlotType(basis); }}
              style={[
                styles.durationBtn,
                isSel && { backgroundColor: t.primary },
                { borderColor: t.border },
              ]}
            >
              <Text style={[styles.durationLabel, { color: isSel ? t.primaryContrast : t.textSecondary }]}>
                {basis}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Horizontal Dates Picker for HOURLY and DAILY */}
      {(selectedSlotType === 'HOURLY' || selectedSlotType === 'DAILY') ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.datePickerScroll}
        >
          {dateOptions.map((opt) => {
            const isSel = selectedDate === opt.dateString;
            return (
              <TouchableOpacity
                key={opt.dateString}
                onPress={() => { tap(); setSelectedDate(opt.dateString); }}
                style={[
                  styles.datePill,
                  isSel && { backgroundColor: t.primary, borderColor: t.primary },
                  { borderColor: t.border },
                ]}
              >
                <Text style={[styles.dateDayName, { color: isSel ? t.primaryContrast : t.textSecondary }]}>
                  {opt.dayName}
                </Text>
                <Text style={[styles.dateDayVal, { color: isSel ? t.primaryContrast : t.textPrimary }]}>
                  {opt.dayVal}
                </Text>
                <Text style={[styles.dateMonth, { color: isSel ? t.primaryContrast : t.textTertiary }]}>
                  {opt.monthName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        /* Date Range Picker for WEEKLY and MONTHLY */
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, gap: 12 }}>
          <TouchableOpacity
            onPress={() => { tap(); setShowDatePicker(true); }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: t.border,
              backgroundColor: t.surface,
            }}
          >
            <Calendar size={16} color={t.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: t.textPrimary }}>Select Start Date</Text>
          </TouchableOpacity>

          <View style={{ flex: 1, flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: t.muted, padding: 10, borderRadius: 8, justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, color: t.textSecondary, fontWeight: '700' }}>START DATE</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: t.textPrimary, marginTop: 2 }}>{selectedDate}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: t.muted, padding: 10, borderRadius: 8, justifyContent: 'center' }}>
              <Text style={{ fontSize: 9, color: t.textSecondary, fontWeight: '700' }}>END DATE</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: t.textPrimary, marginTop: 2 }}>
                {(() => {
                  const d = new Date(selectedDate);
                  const daysToAdd = selectedSlotType === 'WEEKLY' ? 7 : 30;
                  d.setDate(d.getDate() + daysToAdd);
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const dateVal = String(d.getDate()).padStart(2, '0');
                  return `${year}-${month}-${dateVal}`;
                })()}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Hourly 3h slot pills if Hourly is selected */}
      {selectedSlotType === 'HOURLY' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hourlySlotsScroll}
        >
          {HOURLY_SLOTS.map((slot, index) => {
            const isSel = selectedHourlySlotIndex === index;
            const isPast = (() => {
              const todayStr = (() => {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })();
              if (selectedDate !== todayStr) return false;
              const slotEndHour = parseInt(slot.end.split(':')[0]);
              const now = new Date();
              const istHours = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
              return slotEndHour <= istHours;
            })();

            return (
              <TouchableOpacity
                key={slot.label}
                disabled={isPast}
                onPress={() => { tap(); setSelectedHourlySlotIndex(index); }}
                style={[
                  styles.hourlySlotPill,
                  isSel && { backgroundColor: t.primary, borderColor: t.primary },
                  { borderColor: t.border },
                  isPast && { opacity: 0.25 },
                ]}
              >
                <Clock size={11} color={isSel ? t.primaryContrast : t.textSecondary} />
                <Text style={[styles.hourlySlotLabel, { color: isSel ? t.primaryContrast : t.textSecondary }]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  datePickerScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },
  datePill: {
    width: 58,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dateDayName: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateDayVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  dateMonth: {
    fontSize: 9,
    fontWeight: '600',
  },
  durationRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginTop: 10,
  },
  durationBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  hourlySlotsScroll: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 6,
  },
  hourlySlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  hourlySlotLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
