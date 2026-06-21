import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, useColorScheme, ScrollView, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';
import { Alert } from '../../../core/components/CustomAlert';

interface DateTimePickerProps {
  visible: boolean;
  onClose: () => void;
  value: Date;
  onChange: (d: Date) => void;
  mode?: 'date' | 'time';
}

export function DateTimePicker({
  visible,
  onClose,
  value,
  onChange,
  mode = 'date',
}: DateTimePickerProps) {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  const getISTComponents = (d: Date) => {
    const istShifted = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
    return {
      year: istShifted.getUTCFullYear(),
      month: istShifted.getUTCMonth(),
      day: istShifted.getUTCDate(),
      hour: istShifted.getUTCHours(),
      minute: istShifted.getUTCMinutes(),
    };
  };

  const [tempYear, setTempYear] = useState(() => getISTComponents(value).year);
  const [tempMonth, setTempMonth] = useState(() => getISTComponents(value).month);
  const [tempDay, setTempDay] = useState(() => getISTComponents(value).day);
  const [tempHour, setTempHour] = useState(() => getISTComponents(value).hour);
  const [tempMin, setTempMin] = useState(() => getISTComponents(value).minute);

  const hourScrollRef = useRef<ScrollView>(null);
  const minScrollRef = useRef<ScrollView>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  useEffect(() => {
    const comps = getISTComponents(value);
    setTempYear(comps.year);
    setTempMonth(comps.month);
    setTempDay(comps.day);
    setTempHour(comps.hour);
    setTempMin(comps.minute);
  }, [visible, value]);

  useEffect(() => {
    if (visible && mode === 'time') {
      setTimeout(() => {
        const hourIndex = tempHour; // 0 to 23
        const minIndex = minutes.indexOf(tempMin); // 0 to 11

        if (hourScrollRef.current) {
          hourScrollRef.current.scrollTo({ y: hourIndex * 40, animated: false });
        }
        if (minScrollRef.current) {
          minScrollRef.current.scrollTo({ y: minIndex * 40, animated: false });
        }
      }, 150);
    }
  }, [visible, mode, tempHour, tempMin]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getISTToday = () => {
    const d = new Date();
    const istMs = d.getTime() + 5.5 * 60 * 60 * 1000;
    const istDate = new Date(istMs);
    return new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()));
  };

  const clampDay = (d: number, y: number, m: number) => Math.min(d, daysInMonth(y, m));

  const isPastTime = (() => {
    if (mode !== 'time') return false;
    const comps = getISTComponents(value);
    const utcMs = Date.UTC(comps.year, comps.month, comps.day, tempHour, tempMin, 0, 0);
    const selectedDateWithTime = new Date(utcMs - 5.5 * 60 * 60 * 1000);
    return selectedDateWithTime < new Date();
  })();

  const confirm = () => {
    const comps = getISTComponents(value);
    let d: Date;
    if (mode === 'date') {
      const targetDay = clampDay(tempDay, tempYear, tempMonth);
      const utcMs = Date.UTC(tempYear, tempMonth, targetDay, comps.hour, comps.minute, 0, 0);
      d = new Date(utcMs - 5.5 * 60 * 60 * 1000);

      if (new Date(Date.UTC(tempYear, tempMonth, targetDay)) < getISTToday()) {
        Alert.alert('Invalid Date', 'Please select a future or present date.');
        return;
      }
    } else {
      const utcMs = Date.UTC(comps.year, comps.month, comps.day, tempHour, tempMin, 0, 0);
      d = new Date(utcMs - 5.5 * 60 * 60 * 1000);

      if (d < new Date()) {
        Alert.alert('Invalid Time', 'Please select a future or present time.');
        return;
      }
    }
    onChange(d);
    onClose();
  };

  const renderCalendarGrid = () => {
    const today = getISTToday();
    const days = [];
    const firstDayIndex = new Date(tempYear, tempMonth, 1).getDay();
    const totalDays = new Date(tempYear, tempMonth + 1, 0).getDate();

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<View key={`pad-${i}`} style={{ width: '14.28%', height: 36 }} />);
    }

    for (let day = 1; day <= totalDays; day++) {
      const thisDate = new Date(Date.UTC(tempYear, tempMonth, day));
      const isDisabled = thisDate < today;
      const isSelected = day === tempDay;

      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          disabled={isDisabled}
          onPress={() => {
            tap();
            setTempDay(day);
          }}
          style={{
            width: '14.28%',
            height: 36,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 18,
            backgroundColor: isSelected ? t.primary : 'transparent',
            opacity: isDisabled ? 0.25 : 1,
            marginVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: isSelected ? '700' : '500',
              color: isSelected ? '#fff' : t.textPrimary,
            }}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={{ width: '100%' }}>
        {/* Month Header Navigation */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <TouchableOpacity
            onPress={() => {
              tap();
              setTempMonth((m) => {
                if (m === 0) {
                  setTempYear((y) => y - 1);
                  return 11;
                }
                return m - 1;
              });
            }}
          >
            <ChevronLeft color={t.textPrimary} size={20} />
          </TouchableOpacity>
          <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: '700' }}>
            {MONTHS[tempMonth]} {tempYear}
          </Text>
          <TouchableOpacity
            onPress={() => {
              tap();
              setTempMonth((m) => {
                if (m === 11) {
                  setTempYear((y) => y + 1);
                  return 0;
                }
                return m + 1;
              });
            }}
          >
            <ChevronRight color={t.textPrimary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Weekday Labels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
            <Text
              key={w}
              style={{
                width: '14.28%',
                textAlign: 'center',
                color: t.textSecondary,
                fontSize: 11,
                fontWeight: '600',
              }}
            >
              {w}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{days}</View>
      </View>
    );
  };

  const renderTimeScrollPicker = () => {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 32, height: 160, marginVertical: 12 }}>
        {/* Hours Scroll */}
        <View style={{ width: 80, alignItems: 'center' }}>
          <Text style={{ color: t.textSecondary, fontSize: 10, fontWeight: '700', marginBottom: 6 }}>HOUR</Text>
          <ScrollView
            ref={hourScrollRef}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ paddingVertical: 40 }}
            style={{ width: '100%' }}
          >
            {hours.map((h) => {
              const isSelected = h === tempHour;
              return (
                <TouchableOpacity
                  key={`hour-${h}`}
                  onPress={() => {
                    tap();
                    setTempHour(h);
                  }}
                  style={{
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? t.primary : 'transparent',
                    borderRadius: 18,
                    marginVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: isSelected ? 18 : 15,
                      fontWeight: isSelected ? '800' : '500',
                      color: isSelected ? '#fff' : t.textSecondary,
                    }}
                  >
                    {String(h).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Separator */}
        <Text style={{ fontSize: 24, fontWeight: '800', color: t.textTertiary, alignSelf: 'center', marginTop: 12 }}>
          :
        </Text>

        {/* Minutes Scroll */}
        <View style={{ width: 80, alignItems: 'center' }}>
          <Text style={{ color: t.textSecondary, fontSize: 10, fontWeight: '700', marginBottom: 6 }}>MIN</Text>
          <ScrollView
            ref={minScrollRef}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            contentContainerStyle={{ paddingVertical: 40 }}
            style={{ width: '100%' }}
          >
            {minutes.map((m) => {
              const isSelected = m === tempMin;
              return (
                <TouchableOpacity
                  key={`min-${m}`}
                  onPress={() => {
                    tap();
                    setTempMin(m);
                  }}
                  style={{
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? t.primary : 'transparent',
                    borderRadius: 18,
                    marginVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      fontSize: isSelected ? 18 : 15,
                      fontWeight: isSelected ? '800' : '500',
                      color: isSelected ? '#fff' : t.textSecondary,
                    }}
                  >
                    {String(m).padStart(2, '0')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={onClose} />
      <View
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          paddingBottom: 40,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 20, textAlign: 'center' }}>
          {mode === 'date' ? 'Select Date' : 'Select Time'}
        </Text>

        <View style={{ marginBottom: 20 }}>{mode === 'date' ? renderCalendarGrid() : renderTimeScrollPicker()}</View>

        {mode === 'time' && isPastTime && (
          <View
            style={{
              backgroundColor: t.errorBg,
              borderColor: t.error,
              borderWidth: 1,
              padding: 10,
              borderRadius: 8,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text style={{ color: t.error, fontSize: 12, fontWeight: '600', textAlign: 'center', flex: 1 }}>
              ⚠️ Selected time has already passed. Please select future time.
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={confirm}
          style={{
            backgroundColor: t.primary,
            height: 50,
            borderRadius: 9999,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Confirm Selection</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
