import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, Check, X, Calendar, DollarSign, Clock, MapPin, User as UserIcon } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { tap, success } from '../../src/core/utils/haptics';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';

type Spot = {
  id: string;
  spotName: string;
  level: number;
  section: string;
  approved: boolean;
  availabilities: Array<{
    id: string;
    date: string;
    slotType: string;
    startTime: string;
    endTime: string;
    price: number;
    isBooked: boolean;
  }>;
};

type BookingRequest = {
  id: string;
  spotId: string;
  spot: {
    spotName: string;
  };
  userId: string;
  user: {
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  date: string;
  slotType: string;
  startTime: string;
  endTime: string;
  price: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
};

const HOURLY_SLOTS = [
  { label: '00:00 - 03:00', start: '00:00', end: '03:00' },
  { label: '03:00 - 06:00', start: '03:00', end: '06:00' },
  { label: '06:00 - 09:00', start: '06:00', end: '09:00' },
  { label: '09:00 - 12:00', start: '09:00', end: '12:00' },
  { label: '12:00 - 15:00', start: '12:00', end: '15:00' },
  { label: '15:00 - 18:00', start: '15:00', end: '18:00' },
  { label: '18:00 - 21:00', start: '18:00', end: '21:00' },
  { label: '21:00 - 24:00', start: '21:00', end: '24:00' },
];

const getISTDate = (dateInput: string | Date | number): Date => {
  const d = new Date(dateInput);
  return new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
};

const formatISTTime = (utcTimeStr: string): string => {
  const istDate = getISTDate(utcTimeStr);
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const convertISTToUTC = (dateStr: string, timeStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes, seconds = 0] = timeStr.split(':').map(Number);
  const utcMs = Date.UTC(year, month - 1, day, hours, minutes, seconds);
  return new Date(utcMs - 5.5 * 60 * 60 * 1000).toISOString();
};

// Minimal inline calendar date picker for Weekly/Monthly
function DateTimePicker({
  visible, onClose, value, onChange,
}: {
  visible: boolean; onClose: () => void;
  value: Date; onChange: (d: Date) => void;
}) {
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

  useEffect(() => {
    const comps = getISTComponents(value);
    setTempYear(comps.year);
    setTempMonth(comps.month);
    setTempDay(comps.day);
  }, [visible, value]);

  const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const getISTToday = () => {
    const d = new Date();
    const istMs = d.getTime() + 5.5 * 60 * 60 * 1000;
    const istDate = new Date(istMs);
    return new Date(Date.UTC(istDate.getUTCFullYear(), istDate.getUTCMonth(), istDate.getUTCDate()));
  };

  const clampDay = (d: number, y: number, m: number) => Math.min(d, daysInMonth(y, m));

  const confirm = () => {
    const targetDay = clampDay(tempDay, tempYear, tempMonth);
    const utcMs = Date.UTC(tempYear, tempMonth, targetDay, 12, 0, 0, 0);
    const d = new Date(utcMs - 5.5 * 60 * 60 * 1000);
    
    if (new Date(Date.UTC(tempYear, tempMonth, targetDay)) < getISTToday()) {
      Alert.alert('Invalid Date', 'Please select a future or present date.');
      return;
    }
    onChange(d);
    onClose();
  };

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
        onPress={() => { tap(); setTempDay(day); }}
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
        <Text style={{
          fontSize: 13,
          fontWeight: isSelected ? '700' : '500',
          color: isSelected ? '#fff' : t.textPrimary,
        }}>
          {day}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} activeOpacity={1} onPress={onClose} />
      <View style={{ backgroundColor: t.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <Text style={{ color: t.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 20, textAlign: 'center' }}>
          Select Date
        </Text>
        
        <View style={{ marginBottom: 20 }}>
          <View style={{ width: '100%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity onPress={() => {
                tap();
                setTempMonth(m => {
                  if (m === 0) {
                    setTempYear(y => y - 1);
                    return 11;
                  }
                  return m - 1;
                });
              }}>
                <ChevronLeft color={t.textPrimary} size={20} />
              </TouchableOpacity>
              <Text style={{ color: t.textPrimary, fontSize: 15, fontWeight: '700' }}>
                {MONTHS[tempMonth]} {tempYear}
              </Text>
              <TouchableOpacity onPress={() => {
                tap();
                setTempMonth(m => {
                  if (m === 11) {
                    setTempYear(y => y + 1);
                    return 0;
                  }
                  return m + 1;
                });
              }}>
                <ChevronRight color={t.textPrimary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((w) => (
                <Text key={w} style={{ width: '14.28%', textAlign: 'center', color: t.textSecondary, fontSize: 11, fontWeight: '600' }}>
                  {w}
                </Text>
              ))}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {days}
            </View>
          </View>
        </View>

        <TouchableOpacity onPress={confirm}
          style={{ backgroundColor: t.primary, height: 50, borderRadius: 9999, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Confirm Selection</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export default function ManageParking() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'spots' | 'requests'>('spots');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Availability Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState(() => {
    const d = new Date();
    const istMs = d.getTime() + 5.5 * 60 * 60 * 1000;
    const istDate = new Date(istMs);
    const year = istDate.getUTCFullYear();
    const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(istDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [slotType, setSlotType] = useState<'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('HOURLY');
  const [selectedHourlySlotIndex, setSelectedHourlySlotIndex] = useState(4); // Defaults to 12:00 - 15:00
  const [customPrice, setCustomPrice] = useState('50');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Automatically select first valid slot if current one is past
  useEffect(() => {
    if (slotType === 'HOURLY') {
      const todayStr = (() => {
        const d = new Date();
        const istMs = d.getTime() + 5.5 * 60 * 60 * 1000;
        const istDate = new Date(istMs);
        const year = istDate.getUTCFullYear();
        const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(istDate.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();

      if (dateInput === todayStr) {
        const now = new Date();
        const istHours = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
        const currentSlot = HOURLY_SLOTS[selectedHourlySlotIndex];
        if (currentSlot) {
          const currentEndHour = parseInt(currentSlot.end.split(':')[0]);
          if (currentEndHour <= istHours) {
            const firstValidIdx = HOURLY_SLOTS.findIndex(slot => parseInt(slot.end.split(':')[0]) > istHours);
            if (firstValidIdx !== -1) {
              setSelectedHourlySlotIndex(firstValidIdx);
            }
          }
        }
      }
    }
  }, [dateInput, slotType, selectedHourlySlotIndex]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'spots') {
        const { data } = await api.get('/parking/my-spots');
        setSpots(data);
      } else {
        const { data } = await api.get('/parking/my-spots/requests');
        setRequests(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleOpenAddAvailability = (spotId: string) => {
    tap();
    setSelectedSpotId(spotId);
    setSlotType('HOURLY');
    setCustomPrice('50'); // Default price for HOURLY
    setIsModalOpen(true);
  };

  // Adjust price when slotType changes
  const handleSlotTypeChange = (type: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    tap();
    setSlotType(type);
    if (type === 'HOURLY') setCustomPrice('50');
    else if (type === 'DAILY') setCustomPrice('100');
    else if (type === 'WEEKLY') setCustomPrice('500');
    else if (type === 'MONTHLY') setCustomPrice('2000');
  };

    const handleSaveAvailability = async () => {
    if (!selectedSpotId) return;

    // Build ISO dates
    let startTimeStr = '';
    let endTimeStr = '';

    if (slotType === 'HOURLY') {
      const slot = HOURLY_SLOTS[selectedHourlySlotIndex];
      startTimeStr = convertISTToUTC(dateInput, slot.start);
      endTimeStr = convertISTToUTC(dateInput, slot.end);
    } else if (slotType === 'DAILY') {
      startTimeStr = convertISTToUTC(dateInput, '00:00');
      endTimeStr = convertISTToUTC(dateInput, '23:59:59');
    } else if (slotType === 'WEEKLY') {
      startTimeStr = convertISTToUTC(dateInput, '00:00');
      const d = new Date(dateInput);
      d.setDate(d.getDate() + 7);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      endTimeStr = convertISTToUTC(`${year}-${month}-${dateVal}`, '00:00');
    } else {
      startTimeStr = convertISTToUTC(dateInput, '00:00');
      const d = new Date(dateInput);
      d.setMonth(d.getMonth() + 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      endTimeStr = convertISTToUTC(`${year}-${month}-${dateVal}`, '00:00');
    }

    try {
      tap();
      await api.post(`/parking/my-spots/${selectedSpotId}/availability`, {
        date: dateInput,
        slotType,
        startTime: startTimeStr,
        endTime: endTimeStr,
        price: parseFloat(customPrice),
      });
      success();
      setIsModalOpen(false);
      Alert.alert('Success', 'Availability slot registered successfully!');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add availability.');
    }
  };

  const handleRequestAction = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      tap();
      await api.patch(`/parking/bookings/${requestId}/status`, { status });
      success();
      Alert.alert('Success', `Booking request has been ${status.toLowerCase()}!`);
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update request.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title="Manage My Parking" />

      {/* Tabs segment */}
      <View style={[styles.tabsRow, { borderBottomColor: t.border }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { tap(); setActiveTab('spots'); }}
          style={[styles.tabButton, activeTab === 'spots' && { borderBottomColor: t.primary }]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'spots' ? t.textPrimary : t.textSecondary },
            ]}
          >
            My Spots
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => { tap(); setActiveTab('requests'); }}
          style={[styles.tabButton, activeTab === 'requests' && { borderBottomColor: t.primary }]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'requests' ? t.textPrimary : t.textSecondary },
            ]}
          >
            Booking Requests
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {activeTab === 'spots' ? (
            spots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MapPin color={t.textTertiary} size={48} />
                <Text style={[styles.emptyTitle, { color: t.textSecondary }]}>No registered spots</Text>
                <Text style={[styles.emptySub, { color: t.textTertiary }]}>
                  You haven't claimed any spots yet. Register your spot from your profile configurations.
                </Text>
              </View>
            ) : (
              spots.map((spot) => (
                <View key={spot.id} style={[styles.spotCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                  <View style={styles.spotCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MapPin color={t.primary} size={18} />
                      <Text style={[styles.spotName, { color: t.textPrimary }]}>{spot.spotName}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: spot.approved ? t.successBg : t.muted }]}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: spot.approved ? t.success : t.textSecondary }}>
                        {spot.approved ? 'APPROVED' : 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  {/* Active Availabilities List */}
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: t.textSecondary, marginBottom: 6 }}>
                      Active Availabilities
                    </Text>
                    {spot.availabilities.length === 0 ? (
                      <Text style={{ fontSize: 13, color: t.textTertiary, fontStyle: 'italic' }}>
                        No planning configured. Tap below to add availability slots.
                      </Text>
                    ) : (
                      spot.availabilities.map((av) => (
                        <View
                          key={av.id}
                          style={[styles.availRow, { backgroundColor: t.background, borderColor: t.border }]}
                        >
                          <View>
                            <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary }}>
                              {av.date} ({av.slotType})
                            </Text>
                            <Text style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>
                              {av.slotType === 'HOURLY' ? `${formatISTTime(av.startTime)} - ${formatISTTime(av.endTime)}` : 'All day'}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: t.textPrimary }}>
                              ₹{av.price}
                            </Text>
                            <View style={[styles.bookedBadge, { backgroundColor: av.isBooked ? t.successBg : t.muted }]}>
                              <Text style={{ fontSize: 9, fontWeight: '700', color: av.isBooked ? t.success : t.textSecondary }}>
                                {av.isBooked ? 'RESERVED' : 'AVAILABLE'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))
                    )}
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleOpenAddAvailability(spot.id)}
                    style={[styles.addButton, { borderColor: t.border }]}
                  >
                    <Plus color={t.textPrimary} size={16} />
                    <Text style={{ fontSize: 13, fontWeight: '600', color: t.textPrimary }}>
                      Mark Spot Available
                    </Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : requests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Clock color={t.textTertiary} size={48} />
              <Text style={[styles.emptyTitle, { color: t.textSecondary }]}>No active requests</Text>
              <Text style={[styles.emptySub, { color: t.textTertiary }]}>
                Passengers searching for parking will request bookings here once you mark your spots available.
              </Text>
            </View>
          ) : (
            requests.map((req) => (
              <View key={req.id} style={[styles.requestCard, { backgroundColor: t.surface, borderColor: t.border }]}>
                <View style={styles.requestCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={[styles.avatarMock, { backgroundColor: t.muted }]}>
                      <UserIcon color={t.textSecondary} size={16} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                        {req.user.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: t.textSecondary }}>
                        {req.user.email}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: t.textPrimary }}>
                      ₹{req.price}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: t.primary }}>
                      {req.spot.spotName}
                    </Text>
                  </View>
                </View>

                <View style={[styles.requestDetails, { backgroundColor: t.background, borderColor: t.border }]}>
                  <View style={styles.detailItem}>
                    <Calendar color={t.textSecondary} size={14} />
                    <Text style={{ fontSize: 12, color: t.textSecondary }}>{req.date}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Clock color={t.textSecondary} size={14} />
                    <Text style={{ fontSize: 12, color: t.textSecondary }}>
                      {req.slotType} ({formatISTTime(req.startTime)} - {formatISTTime(req.endTime)})
                    </Text>
                  </View>
                </View>

                {req.status === 'REQUESTED' ? (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRequestAction(req.id, 'REJECTED')}
                      style={[styles.actionButton, styles.rejectBtn]}
                    >
                      <X color="#ef4444" size={16} />
                      <Text style={[styles.actionBtnLabel, { color: '#ef4444' }]}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleRequestAction(req.id, 'ACCEPTED')}
                      style={[styles.actionButton, styles.acceptBtn]}
                    >
                      <Check color="#10b981" size={16} />
                      <Text style={[styles.actionBtnLabel, { color: '#10b981' }]}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.statusBanner, { backgroundColor: req.status === 'ACCEPTED' ? t.successBg : t.muted }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: req.status === 'ACCEPTED' ? t.success : t.textSecondary }}>
                      {req.status}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Add Availability Modal */}
      <Modal animationType="slide" transparent visible={isModalOpen}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: t.background }]}>
            <Text style={[styles.modalTitle, { color: t.textPrimary }]}>Mark Spot Available</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Date Selector */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>
                  {slotType === 'WEEKLY' || slotType === 'MONTHLY' ? 'Start Date' : 'Date'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={() => { tap(); setShowDatePicker(true); }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      flex: 1,
                      height: 48,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.surface,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Calendar size={16} color={t.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>
                      {dateInput || 'Select Date'}
                    </Text>
                  </TouchableOpacity>

                  {(slotType === 'WEEKLY' || slotType === 'MONTHLY') && (
                    <View style={{
                      flex: 1,
                      height: 48,
                      borderRadius: radius.md,
                      borderWidth: 1,
                      borderColor: t.border,
                      backgroundColor: t.muted,
                      paddingHorizontal: 12,
                      justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 10, color: t.textSecondary, fontWeight: '700' }}>END DATE</Text>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: t.textPrimary, marginTop: 2 }}>
                        {(() => {
                          const d = new Date(dateInput);
                          const daysToAdd = slotType === 'WEEKLY' ? 7 : 30;
                          d.setDate(d.getDate() + daysToAdd);
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const dateVal = String(d.getDate()).padStart(2, '0');
                          return `${year}-${month}-${dateVal}`;
                        })()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Timing Duration Segment */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Duration Basis</Text>
                <View style={styles.segContainer}>
                  {['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => handleSlotTypeChange(type as any)}
                      style={[
                        styles.segButton,
                        slotType === type && { backgroundColor: t.primary },
                        { borderColor: t.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.segText,
                          { color: slotType === type ? t.primaryContrast : t.textSecondary },
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* 3-Hour Slot picker for Hourly */}
              {slotType === 'HOURLY' && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Select 3-Hour Slot</Text>
                  <View style={styles.gridPicker}>
                    {HOURLY_SLOTS.map((slot, index) => {
                      const isPast = (() => {
                        const todayStr = (() => {
                          const d = new Date();
                          const istMs = d.getTime() + 5.5 * 60 * 60 * 1000;
                          const istDate = new Date(istMs);
                          const year = istDate.getUTCFullYear();
                          const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
                          const day = String(istDate.getUTCDate()).padStart(2, '0');
                          return `${year}-${month}-${day}`;
                        })();
                        if (dateInput !== todayStr) return false;
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
                            styles.gridSlotBtn,
                            selectedHourlySlotIndex === index && { backgroundColor: t.primary, borderColor: t.primary },
                            { borderColor: t.border },
                            isPast && { opacity: 0.25 },
                          ]}
                        >
                          <Text
                            style={[
                              styles.gridSlotText,
                              { color: selectedHourlySlotIndex === index ? t.primaryContrast : t.textSecondary },
                            ]}
                          >
                            {slot.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Pricing Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>Price (Rupees)</Text>
                <TextInput
                  style={[styles.inputField, { color: t.textPrimary, borderColor: t.border, backgroundColor: t.surface }]}
                  value={customPrice}
                  onChangeText={setCustomPrice}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { tap(); setIsModalOpen(false); }}
                style={[styles.modalCta, { borderColor: t.border, borderWidth: 1 }]}
              >
                <Text style={[styles.modalCtaText, { color: t.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleSaveAvailability}
                style={[styles.modalCta, { backgroundColor: t.primary }]}
              >
                <Text style={[styles.modalCtaText, { color: t.primaryContrast }]}>Save Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {showDatePicker && (
        <DateTimePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          value={(() => {
            const [y, m, d] = dateInput.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
            return new Date(date.getTime() - 5.5 * 60 * 60 * 1000);
          })()}
          onChange={(d) => {
            const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
            const year = istDate.getUTCFullYear();
            const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(istDate.getUTCDate()).padStart(2, '0');
            setDateInput(`${year}-${month}-${day}`);
          }}
        />
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
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: spacing.xl,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  spotCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  spotCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotName: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.xs,
  },
  bookedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  requestCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarMock: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestDetails: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 40,
    borderRadius: radius.md,
  },
  rejectBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  acceptBtn: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#6ee7b7',
  },
  actionBtnLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusBanner: {
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputField: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  segContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  segButton: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridSlotBtn: {
    width: '48%',
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridSlotText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingBottom: 20,
  },
  modalCta: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCtaText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
