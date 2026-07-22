import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Modal,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Repeat, Plus, Trash2, Edit3, Clock, Users, MapPin, X, Check } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../core/api/api';
import { lightTheme, spacing, radius, shadowStyle } from '../../../core/theme/theme';
import { tap, success, errorH } from '../../../core/utils/haptics';
import { ScreenHeader } from '../../../core/components/ScreenHeader';
import { Alert } from '../../../core/components/CustomAlert';

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export function RecurringRidesScreen() {
  const router = useRouter();
  const t = lightTheme;
  const queryClient = useQueryClient();

  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const [editDays, setEditDays] = useState<number[]>([]);
  const [editTime, setEditTime] = useState('');
  const [editSeats, setEditSeats] = useState('1');
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['recurring-schedules'],
    queryFn: async () => {
      const { data } = await api.get('/rides/recurring');
      return data;
    },
  });

  const handleToggleActive = async (schedule: any) => {
    tap();
    const isCurrentlyActive = !schedule.endDate || new Date(schedule.endDate) > new Date();
    const nextStatus = !isCurrentlyActive;

    try {
      await api.patch(`/rides/recurring/${schedule.id}`, { isActive: nextStatus });
      success();
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update schedule status.');
    }
  };

  const handleDelete = (schedule: any) => {
    tap();
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this recurring ride schedule? Future automated ride postings will stop.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/rides/recurring/${schedule.id}`);
              success();
              queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
            } catch (err: any) {
              errorH();
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete schedule.');
            }
          },
        },
      ]
    );
  };

  const openEditModal = (schedule: any) => {
    tap();
    setEditingSchedule(schedule);
    setEditDays(schedule.daysOfWeek || []);
    setEditTime(schedule.timeOfDay || '08:30');
    setEditSeats(String(schedule.seatsAvailable || 1));
  };

  const toggleEditDay = (dayVal: number) => {
    tap();
    setEditDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;
    if (editDays.length === 0) {
      Alert.alert('Days Required', 'Please select at least one day of the week.');
      return;
    }
    tap();
    setIsUpdating(true);
    try {
      await api.patch(`/rides/recurring/${editingSchedule.id}`, {
        daysOfWeek: editDays,
        timeOfDay: editTime,
        seatsAvailable: parseInt(editSeats, 10) || 1,
      });
      success();
      setEditingSchedule(null);
      queryClient.invalidateQueries({ queryKey: ['recurring-schedules'] });
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader
        title="Recurring Rides"
        rightComponent={
          <TouchableOpacity
            onPress={() => {
              tap();
              router.push('/commute/search?mode=offer' as any);
            }}
            style={styles.addHeaderBtn}
          >
            <Plus color={t.primary} size={20} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, paddingBottom: 80 }}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={t.primary} size="large" />
          </View>
        ) : schedules.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Repeat color={t.textTertiary} size={48} />
            <Text style={[styles.emptyTitle, { color: t.textPrimary }]}>No Recurring Schedules</Text>
            <Text style={[styles.emptySubtitle, { color: t.textSecondary }]}>
              Set up a weekly commute schedule to automatically publish your rides every week without manually re-entering details.
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.createBtn, { backgroundColor: t.primary }]}
              onPress={() => {
                tap();
                router.push('/commute/search?mode=offer' as any);
              }}
            >
              <Plus color={t.primaryContrast} size={18} />
              <Text style={[styles.createBtnText, { color: t.primaryContrast }]}>Create Recurring Ride</Text>
            </TouchableOpacity>
          </View>
        ) : (
          schedules.map((item: any) => {
            const isActive = !item.endDate || new Date(item.endDate) > new Date();

            return (
              <View
                key={item.id}
                style={[
                  styles.scheduleCard,
                  {
                    backgroundColor: t.surface,
                    borderColor: isActive ? t.primary : t.border,
                    borderLeftWidth: 4,
                    borderLeftColor: isActive ? t.primary : t.textTertiary,
                  },
                ]}
              >
                {/* Route Header */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MapPin color={t.primary} size={16} />
                      <Text style={[styles.routeText, { color: t.textPrimary }]} numberOfLines={1}>
                        {item.startPlaceName || 'Start'} ➔ {item.endPlaceName || 'Destination'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Clock color={t.textSecondary} size={14} />
                        <Text style={{ fontSize: 13, fontWeight: '700', color: t.textPrimary }}>
                          {item.timeOfDay || '08:30'}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Users color={t.textSecondary} size={14} />
                        <Text style={{ fontSize: 13, color: t.textSecondary }}>
                          {item.seatsAvailable} Seats
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Active Switch Toggle */}
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Switch
                      trackColor={{ false: '#767577', true: '#10B981' }}
                      thumbColor={isActive ? '#FFFFFF' : '#f4f3f4'}
                      onValueChange={() => handleToggleActive(item)}
                      value={isActive}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isActive ? '#10B981' : t.textTertiary }}>
                      {isActive ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}
                    </Text>
                  </View>
                </View>

                {/* Days Badges */}
                <View style={styles.daysRow}>
                  {DAYS_OF_WEEK.map((d) => {
                    const isDaySelected = (item.daysOfWeek || []).includes(d.value);
                    return (
                      <View
                        key={d.value}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: isDaySelected ? (isActive ? t.primary : t.textSecondary) : t.surfaceElevated,
                            borderColor: isDaySelected ? 'transparent' : t.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: isDaySelected ? t.primaryContrast : t.textTertiary,
                          }}
                        >
                          {d.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Card Action Buttons */}
                <View style={[styles.actionsRow, { borderTopColor: t.border }]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.actionBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Edit3 color={t.primary} size={16} />
                    <Text style={[styles.actionBtnText, { color: t.primary }]}>Modify Schedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.actionBtn}
                    onPress={() => handleDelete(item)}
                  >
                    <Trash2 color={t.error} size={16} />
                    <Text style={[styles.actionBtnText, { color: t.error }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modify Modal */}
      <Modal
        visible={!!editingSchedule}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingSchedule(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Modify Recurring Schedule</Text>
              <TouchableOpacity onPress={() => setEditingSchedule(null)} activeOpacity={0.7}>
                <X color={t.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: spacing.md, paddingVertical: spacing.sm }}>
              {/* Departure Time */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Departure Time (HH:MM 24hr format)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
                  value={editTime}
                  onChangeText={setEditTime}
                  placeholder="08:30"
                  placeholderTextColor={t.textTertiary}
                />
              </View>

              {/* Seats Available */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Available Seats</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: t.surface, borderColor: t.border, color: t.textPrimary }]}
                  value={editSeats}
                  onChangeText={setEditSeats}
                  keyboardType="numeric"
                  placeholder="3"
                  placeholderTextColor={t.textTertiary}
                />
              </View>

              {/* Days Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Recurring Days</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 4 }}>
                  {DAYS_OF_WEEK.map((d) => {
                    const selected = editDays.includes(d.value);
                    return (
                      <TouchableOpacity
                        key={d.value}
                        onPress={() => toggleEditDay(d.value)}
                        activeOpacity={0.8}
                        style={[
                          styles.editDayBtn,
                          {
                            backgroundColor: selected ? t.primary : t.surface,
                            borderColor: selected ? t.primary : t.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: selected ? t.primaryContrast : t.textSecondary,
                          }}
                        >
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isUpdating}
              style={[styles.saveModalBtn, { backgroundColor: t.primary }]}
              onPress={handleSaveEdit}
            >
              {isUpdating ? (
                <ActivityIndicator color={t.primaryContrast} />
              ) : (
                <>
                  <Check color={t.primaryContrast} size={18} />
                  <Text style={{ color: t.primaryContrast, fontWeight: '700' }}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addHeaderBtn: {
    padding: 6,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    padding: spacing.xl,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  createBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
  scheduleCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    ...shadowStyle('#000', { width: 0, height: 1 }, 0.05, 1, 2),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  routeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 4,
  },
  dayChip: {
    flex: 1,
    height: 28,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  textInput: {
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  editDayBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveModalBtn: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
});
