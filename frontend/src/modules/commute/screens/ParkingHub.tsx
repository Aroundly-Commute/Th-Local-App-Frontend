import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
  Alert,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Info,
  Calendar,
  Clock,
  DollarSign,
  Search,
  QrCode,
  AlertCircle,
  Sparkles,
  Ticket,
  ChevronLeft,
  BadgeCheck,
  CheckCircle,
  XCircle,
  RefreshCw,
} from 'lucide-react-native';
import { api } from '../../../core/api/api';
import { useAuth } from '../../../core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../../core/theme/theme';
import { tap, success } from '../../../core/utils/haptics';
import { Shimmer } from '../../../core/components/Shimmer';

type SpotState = {
  id: string;
  spotName: string;
  level: number;
  section: 'LEFT' | 'MIDDLE' | 'RIGHT';
  row: number;
  col: number;
  ownerId: string | null;
  approved: boolean;
  priceHourly: number;
  priceDaily: number;
  priceWeekly: number;
  priceMonthly: number;
  owner?: {
    name: string;
    email: string;
    phoneNumber: string | null;
  } | null;
  availabilities: Array<{
    id: string;
    date: string;
    slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    startTime: string;
    endTime: string;
    price: number;
    isBooked: boolean;
  }>;
  bookings: Array<{
    id: string;
    userId: string;
    date: string;
    slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
    startTime: string;
    endTime: string;
    price: number;
    status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

type MyBooking = {
  id: string;
  spotId: string;
  spot: {
    spotName: string;
    level: number;
    section: string;
    owner?: {
      name: string;
      email: string;
    } | null;
  };
  date: string;
  slotType: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  startTime: string;
  endTime: string;
  price: number;
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
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

export default function ParkingHub() {
  const t = lightTheme;
  const { user } = useAuth();
  const router = useRouter();

  // Tab State: 'map' | 'list' | 'tickets'
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'tickets'>('map');

  // Booking Flow States
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [selectedDate, setSelectedDate] = useState('2026-05-22');
  const [selectedSlotType, setSelectedSlotType] = useState<'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>('HOURLY');
  const [selectedHourlySlotIndex, setSelectedHourlySlotIndex] = useState(4); // Default: 12:00 - 15:00

  // Search filter for List view
  const [searchQuery, setSearchQuery] = useState('');

  // Live spots and tickets data
  const [spots, setSpots] = useState<SpotState[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Selected visual grid spot
  const [selectedSpot, setSelectedSpot] = useState<SpotState | null>(null);

  const activeTickets = myBookings.filter(b => b.status === 'ACCEPTED' || b.status === 'REQUESTED');
  const hasActiveTicket = activeTickets.length > 0;
  const showTicketView = hasActiveTicket && !isBookingMode;

  // Dynamic Horizontal Date Range Generator (7 Days starting 2026-05-22)
  const dateOptions = (() => {
    const dates = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const start = new Date('2026-05-22');

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

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

  // Load spots state and bookings
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch grid state
      const { data: gridData } = await api.get('/parking/grid-state', {
        params: { date: selectedDate, slotType: selectedSlotType },
      });
      setSpots(gridData);

      // 2. Fetch my bookings
      const { data: bookingsData } = await api.get('/parking/my-bookings');
      setMyBookings(bookingsData);

      // Clear selection if date/slot changes
      setSelectedSpot(null);
    } catch (err) {
      console.error('[PARKING] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedSlotType, selectedHourlySlotIndex]);

  // Compute spot reservation condition details
  const getSpotStatus = (spot: SpotState) => {
    const targetHourlySlot = HOURLY_SLOTS[selectedHourlySlotIndex];

    // Find availability matching filters
    const avail = spot.availabilities.find((av) => {
      if (av.slotType !== selectedSlotType) return false;
      if (av.date !== selectedDate) return false;

      if (selectedSlotType === 'HOURLY') {
        const avStartHour = getISTDate(av.startTime).getUTCHours();
        const targetStartHour = parseInt(targetHourlySlot.start.split(':')[0]);
        return avStartHour === targetStartHour;
      }
      return true;
    });

    if (!avail) {
      return { status: 'UNAVAILABLE' as const, avail: null, booking: null };
    }

    // Find if current spot has booking in the active time slot
    const bk = spot.bookings.find((b) => {
      if (b.slotType !== selectedSlotType) return false;
      if (b.date !== selectedDate) return false;

      if (selectedSlotType === 'HOURLY') {
        const bStartHour = getISTDate(b.startTime).getUTCHours();
        const targetStartHour = parseInt(targetHourlySlot.start.split(':')[0]);
        return bStartHour === targetStartHour;
      }
      return true;
    });

    if (bk) {
      if (bk.userId === user?.id) {
        if (bk.status === 'ACCEPTED') {
          return { status: 'MINE_CONFIRMED' as const, avail, booking: bk };
        } else if (bk.status === 'REQUESTED') {
          return { status: 'MINE_REQUESTED' as const, avail, booking: bk };
        }
        return { status: 'MINE_REJECTED' as const, avail, booking: bk };
      } else {
        if (bk.status === 'ACCEPTED') {
          return { status: 'OTHER_BOOKED' as const, avail, booking: bk };
        } else if (bk.status === 'REQUESTED') {
          // If another user requested but not yet accepted, it is technically still available/requestable
          return { status: 'OTHER_REQUESTED' as const, avail, booking: bk };
        }
      }
    }

    if (avail.isBooked) {
      return { status: 'OTHER_BOOKED' as const, avail, booking: null };
    }

    return { status: 'AVAILABLE' as const, avail, booking: null };
  };

  const handleSpotPress = (spot: SpotState) => {
    tap();
    const { status } = getSpotStatus(spot);

    if (status === 'UNAVAILABLE') {
      Alert.alert('Unavailable Slot', `Spot ${spot.spotName} has no availability listed by the owner for this time.`);
      return;
    }
    if (status === 'OTHER_BOOKED') {
      Alert.alert('Spot Occupied', `Spot ${spot.spotName} is already booked by another campus passenger.`);
      return;
    }

    setSelectedSpot(selectedSpot?.id === spot.id ? null : spot);
  };

  const handleBookRequest = async () => {
    if (!selectedSpot) return;
    const { avail } = getSpotStatus(selectedSpot);
    if (!avail) return;

    try {
      tap();
      setBookingInProgress(true);

      // Build target start and end dates based on selection
      let startStr = '';
      let endStr = '';

      if (selectedSlotType === 'HOURLY') {
        const slot = HOURLY_SLOTS[selectedHourlySlotIndex];
        startStr = convertISTToUTC(selectedDate, slot.start);
        endStr = convertISTToUTC(selectedDate, slot.end);
      } else if (selectedSlotType === 'DAILY') {
        startStr = convertISTToUTC(selectedDate, '00:00');
        endStr = convertISTToUTC(selectedDate, '23:59:59');
      } else if (selectedSlotType === 'WEEKLY') {
        startStr = convertISTToUTC(selectedDate, '00:00');
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 7);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateVal = String(d.getDate()).padStart(2, '0');
        endStr = convertISTToUTC(`${year}-${month}-${dateVal}`, '00:00');
      } else {
        startStr = convertISTToUTC(selectedDate, '00:00');
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateVal = String(d.getDate()).padStart(2, '0');
        endStr = convertISTToUTC(`${year}-${month}-${dateVal}`, '00:00');
      }

      let finalPrice = avail.price;
      if (avail.slotType !== selectedSlotType) {
        if (selectedSlotType === 'HOURLY') {
          finalPrice = selectedSpot.priceHourly;
        } else if (selectedSlotType === 'DAILY') {
          finalPrice = selectedSpot.priceDaily;
        } else if (selectedSlotType === 'WEEKLY') {
          finalPrice = selectedSpot.priceWeekly;
        } else if (selectedSlotType === 'MONTHLY') {
          finalPrice = selectedSpot.priceMonthly;
        }
      }

      await api.post('/parking/bookings', {
        spotId: selectedSpot.id,
        availabilityId: avail.id,
        date: selectedDate,
        slotType: selectedSlotType,
        startTime: startStr,
        endTime: endStr,
        price: finalPrice,
      });

      success();
      Alert.alert(
        'Request Placed',
        `Your reservation request for spot ${selectedSpot.spotName} has been submitted!`,
        [
          {
            text: 'Great',
            onPress: () => {
              loadData();
              setIsBookingMode(false);
              setActiveTab('tickets');
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err.response?.data?.message || 'Failed to submit reservation.');
    } finally {
      setBookingInProgress(false);
    }
  };

  // Map section anchors nearby to render descriptive locations
  const getProximityText = (spot: SpotState) => {
    // Determine near Tower letter
    const towers: { [key: number]: { LEFT: string; RIGHT: string } } = {
      1: { LEFT: 'A', RIGHT: 'J' },
      2: { LEFT: 'B', RIGHT: 'I' },
      3: { LEFT: 'C', RIGHT: 'H' },
      4: { LEFT: 'D', RIGHT: 'G' },
      5: { LEFT: 'E', RIGHT: 'F' },
    };
    const rowT = towers[spot.level];
    if (spot.section === 'LEFT') {
      return `Level ${spot.level}, right next to Tower ${rowT?.LEFT}`;
    } else if (spot.section === 'RIGHT') {
      return `Level ${spot.level}, right next to Tower ${rowT?.RIGHT}`;
    } else {
      return `Level ${spot.level}, center row between Tower ${rowT?.LEFT} and Tower ${rowT?.RIGHT}`;
    }
  };

  // Helper renderers
  const renderVisualSpot = (level: number, section: 'LEFT' | 'MIDDLE' | 'RIGHT', row: number, col: number) => {
    const spot = spots.find(
      (s) => s.level === level && s.section === section && s.row === row && s.col === col
    );

    if (!spot) {
      return <View key={`mock-${level}-${section}-${row}-${col}`} style={[styles.spotMock, { borderColor: t.border }]} />;
    }

    const { status, avail } = getSpotStatus(spot);
    const isSelected = selectedSpot?.id === spot.id;

    let bgColor = t.surface;
    let borderColor = t.border;
    let textColor = t.textSecondary;
    let borderWidth = 1;

    if (status === 'UNAVAILABLE') {
      bgColor = t.background;
      borderColor = t.border;
      textColor = t.textTertiary;
    } else if (status === 'MINE_CONFIRMED') {
      bgColor = t.successBg;
      borderColor = t.success;
      textColor = t.success;
      borderWidth = 2;
    } else if (status === 'MINE_REQUESTED') {
      bgColor = t.warningBg;
      borderColor = t.warning;
      textColor = t.warning;
      borderWidth = 2;
    } else if (status === 'OTHER_BOOKED') {
      bgColor = t.errorBg;
      borderColor = t.error;
      textColor = t.error;
    } else if (status === 'OTHER_REQUESTED') {
      bgColor = t.accentBg;
      borderColor = t.accent;
      textColor = t.accent;
    } else if (status === 'AVAILABLE') {
      bgColor = '#10B981'; // Vibrant Green
      borderColor = '#059669';
      textColor = '#FFFFFF';
    }

    if (isSelected) {
      borderColor = t.primary;
      borderWidth = 2.5;
    }

    const label = section === 'MIDDLE' ? `${row}-${col}` : `${row}`;

    return (
      <TouchableOpacity
        key={spot.id}
        activeOpacity={0.8}
        onPress={() => handleSpotPress(spot)}
        style={[
          styles.spotSquare,
          {
            backgroundColor: bgColor,
            borderColor: borderColor,
            borderWidth: borderWidth,
          },
        ]}
      >
        <Text style={[styles.spotLabel, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
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
      <View key={`tower-${level}-${side}`} style={[styles.towerBlock, { backgroundColor: t.muted, borderColor: t.border }]}>
        <Text style={[styles.towerLetter, { color: t.textPrimary }]}>{letter}</Text>
        <Text style={[styles.towerSub, { color: t.textSecondary }]}>TOWER</Text>
      </View>
    );
  };

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

  // Ticket QR code rendering logic
  const getQRCodeUrl = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
  };

  const renderQRCode = (text: string) => (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Image
        source={{ uri: getQRCodeUrl(text) }}
        style={{ width: 140, height: 140, borderRadius: 8, backgroundColor: '#fff', padding: 8 }}
      />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            testID="parking-back-btn"
            onPress={() => {
              tap();
              if (isBookingMode && hasActiveTicket) {
                setIsBookingMode(false);
                setActiveTab('tickets');
              } else {
                router.back();
              }
            }}
            style={{ 
              marginRight: 4, 
              width: 32, 
              height: 32, 
              borderRadius: 16, 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: t.isDark ? '#142E58' : '#E8FBF9' 
            }}
            activeOpacity={0.8}
          >
            <ChevronLeft color={t.isDark ? '#00D4BC' : '#0A1628'} size={18} strokeWidth={2.8} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: t.textPrimary }]}>Aroundly Parking Hub</Text>
        </View>
        {!isBookingMode && !showTicketView && (
          <TouchableOpacity style={styles.refreshBtn} onPress={() => { tap(); loadData(); }}>
            <RefreshCw color={t.textSecondary} size={18} />
          </TouchableOpacity>
        )}
      </View>

      {showTicketView ? (
        /* --- TICKETS VIEW (PRIORITY FLOW) --- */
        <ScrollView
          contentContainerStyle={styles.ticketsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[t.primary]} tintColor={t.primary} />
          }
        >
          {loading ? (
            <View style={{ gap: 16, padding: spacing.md }}>
              <Shimmer style={{ height: 180, borderRadius: 16 }} />
              <Shimmer style={{ height: 180, borderRadius: 16 }} />
            </View>
          ) : (
            myBookings.map((bk) => {
            const isAccepted = bk.status === 'ACCEPTED';
            const isRequested = bk.status === 'REQUESTED';
            const isRejected = bk.status === 'REJECTED';

            let statusColor = t.textSecondary;
            let statusBg = t.muted;
            if (isAccepted) {
              statusColor = t.success;
              statusBg = t.successBg;
            } else if (isRequested) {
              statusColor = t.warning;
              statusBg = t.warningBg;
            } else if (isRejected) {
              statusColor = t.error;
              statusBg = t.errorBg;
            }

            return (
              <TouchableOpacity
                key={bk.id}
                activeOpacity={0.9}
                onPress={() => {
                  tap();
                  router.push({
                    pathname: '/parking/ticket/[id]',
                    params: { id: bk.id }
                  });
                }}
                style={[styles.ticketPassCard, { backgroundColor: t.surface, borderColor: t.border }]}
              >
                {/* Left Cutout Circle */}
                <View style={[styles.ticketCutoutLeft, { backgroundColor: t.background, borderColor: t.border }]} />
                {/* Right Cutout Circle */}
                <View style={[styles.ticketCutoutRight, { backgroundColor: t.background, borderColor: t.border }]} />

                {/* Ticket Header branding */}
                <View style={[styles.ticketHeader, { borderBottomColor: t.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={16} color={t.primary} />
                    <Text style={[styles.ticketTitle, { color: t.textPrimary }]}>GO-PASS DIGITAL PASS</Text>
                  </View>
                  <View style={[styles.ticketStatusBadge, { backgroundColor: statusBg }]}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: statusColor }}>{bk.status}</Text>
                  </View>
                </View>

                {/* Main Stub */}
                <View style={styles.ticketBody}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View>
                      <Text style={{ fontSize: 10, color: t.textTertiary }}>PARKING SPOT</Text>
                      <Text style={[styles.ticketSpotCode, { color: t.textPrimary }]}>{bk.spot.spotName}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, color: t.textTertiary }}>BOOKING CHARGE</Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: t.textPrimary }}>₹{bk.price}</Text>
                    </View>
                  </View>

                  {/* Location and Info anchors */}
                  <View style={styles.ticketDetailsGrid}>
                    <View style={styles.ticketDetailCell}>
                      <MapPin size={12} color={t.textTertiary} />
                      <Text style={[styles.ticketDetailVal, { color: t.textSecondary }]}>
                        Level {bk.spot.level} ({bk.spot.section})
                      </Text>
                    </View>
                    <View style={styles.ticketDetailCell}>
                      <Calendar size={12} color={t.textTertiary} />
                      <Text style={[styles.ticketDetailVal, { color: t.textSecondary }]}>{bk.date}</Text>
                    </View>
                    <View style={styles.ticketDetailCell}>
                      <Clock size={12} color={t.textTertiary} />
                      <Text style={[styles.ticketDetailVal, { color: t.textSecondary }]} numberOfLines={1}>
                        {bk.slotType} ({formatISTTime(bk.startTime)})
                      </Text>
                    </View>
                    <View style={styles.ticketDetailCell}>
                      <Info size={12} color={t.textTertiary} />
                      <Text style={[styles.ticketDetailVal, { color: t.textSecondary }]} numberOfLines={1}>
                        Owner: {bk.spot.owner?.name || 'Campus Resident'}
                      </Text>
                    </View>
                  </View>

                  {/* Tear boundary line */}
                  <View style={[styles.ticketTearLine, { borderTopColor: t.border }]} />

                  {/* QR Code and Stub barcode */}
                  {isAccepted ? (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: t.success, marginBottom: 4 }}>
                        ✓ RESERVATION CONFIRMED PASS
                      </Text>
                      {renderQRCode("aroundly://parking/ticket/" + bk.id + "?spot=" + bk.spot.spotName)}
                      <Text style={{ fontSize: 8, color: t.textTertiary, letterSpacing: 2, marginTop: 4 }}>
                        ID: {bk.id.substring(0, 18).toUpperCase()}
                      </Text>
                    </View>
                  ) : isRequested ? (
                    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                      <ActivityIndicator size="small" color={t.warning} style={{ marginBottom: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: t.warning, textAlign: 'center' }}>
                        Awaiting confirmation from spot owner
                      </Text>
                      <Text style={{ fontSize: 10, color: t.textTertiary, textAlign: 'center', marginTop: 2 }}>
                        You will see a barcode/ticket here once the request is accepted.
                      </Text>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                      <AlertCircle size={20} color={t.error} style={{ marginBottom: 4 }} />
                      <Text style={{ fontSize: 12, fontWeight: '600', color: t.error, textAlign: 'center' }}>
                        This booking request was rejected
                      </Text>
                      <Text style={{ fontSize: 10, color: t.textTertiary, textAlign: 'center', marginTop: 2 }}>
                        Please select another available green spot to request booking.
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
          )}

          {/* Book Another Slot CTA */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setIsBookingMode(true);
              setActiveTab('map');
            }}
            style={[styles.bookAnotherCta, { backgroundColor: t.primary }]}
          >
            <Text style={[styles.bookAnotherCtaTxt, { color: t.primaryContrast }]}>
              Book Another Slot
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        /* --- BOOKING WORKSPACE (MAP / LIST VIEWS) --- */
        <View style={{ flex: 1 }}>
          {/* Date Filter & Timing filters */}
          <View style={{ backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.border, paddingBottom: 10 }}>
            {/* Horizontal Dates Picker */}
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

            {/* Timing Basis segmented control */}
            <View style={styles.durationRow}>
              {['HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY'].map((basis) => {
                const isSel = selectedSlotType === basis;
                return (
                  <TouchableOpacity
                    key={basis}
                    onPress={() => { tap(); setSelectedSlotType(basis as any); }}
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

            {/* Hourly 3h slot pills if Hourly is selected */}
            {selectedSlotType === 'HOURLY' && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourlySlotsScroll}
              >
                {HOURLY_SLOTS.map((slot, index) => {
                  const isSel = selectedHourlySlotIndex === index;
                  return (
                    <TouchableOpacity
                      key={slot.label}
                      onPress={() => { tap(); setSelectedHourlySlotIndex(index); }}
                      style={[
                        styles.hourlySlotPill,
                        isSel && { backgroundColor: t.primary, borderColor: t.primary },
                        { borderColor: t.border },
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

          {/* Main Tab Controller navigation - Only Map and List Views! */}
          <View style={[styles.tabBar, { borderBottomColor: t.border }]}>
            <TouchableOpacity
              onPress={() => { tap(); setActiveTab('map'); }}
              style={[styles.tabBtn, activeTab === 'map' && { borderBottomColor: t.primary }]}
            >
              <MapPin size={16} color={activeTab === 'map' ? t.primary : t.textSecondary} />
              <Text style={[styles.tabText, { color: activeTab === 'map' ? t.textPrimary : t.textSecondary }]}>
                Map View
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { tap(); setActiveTab('list'); }}
              style={[styles.tabBtn, activeTab === 'list' && { borderBottomColor: t.primary }]}
            >
              <Search size={16} color={activeTab === 'list' ? t.primary : t.textSecondary} />
              <Text style={[styles.tabText, { color: activeTab === 'list' ? t.textPrimary : t.textSecondary }]}>
                List View
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            {/* TAB 1: Visual Map Grid */}
            {activeTab === 'map' && (
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
                <View style={[StyleSheet.absoluteFillObject, { backgroundColor: t.isDark ? 'rgba(10, 22, 40, 0.65)' : 'rgba(255, 255, 255, 0.65)', justifyContent: 'center', alignItems: 'center', zIndex: 10 }]}>
                  <ActivityIndicator size="large" color={t.primary} />
                  <Text style={{ color: t.textSecondary, marginTop: 12, fontSize: 13, fontWeight: '600' }}>syncing parking state...</Text>
                </View>
              )}
            </View>
          )}

            {/* TAB 2: List View Finder */}
            {activeTab === 'list' && (
              <View style={{ flex: 1, padding: spacing.md }}>
                <View style={[styles.searchBox, { borderColor: t.border, backgroundColor: t.surface }]}>
                  <Search size={18} color={t.textTertiary} />
                  <TextInput
                    style={[styles.searchInput, { color: t.textPrimary }]}
                    placeholder="Filter available spots by Tower A-J or Row..."
                    placeholderTextColor={t.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
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
                          onPress={() => { setSelectedSpot(spot); tap(); }}
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
                              ₹{avail?.slotType === selectedSlotType
                                ? avail?.price
                                : selectedSlotType === 'HOURLY'
                                ? spot.priceHourly
                                : selectedSlotType === 'DAILY'
                                ? spot.priceDaily
                                : selectedSlotType === 'WEEKLY'
                                ? spot.priceWeekly
                                : spot.priceMonthly
                              }
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
            )}

            {/* Persistent Absolute Floating Bottom Sheet Drawer */}
            {selectedSpot && (
              <View style={[styles.drawerSheet, { backgroundColor: t.background, borderTopColor: t.border }]}>
                {/* Drawer handle indicator */}
                <View style={styles.drawerHeaderHandle}>
                  <View style={[styles.handleBar, { backgroundColor: t.border }]} />
                </View>

                {(() => {
                  const { status, avail } = getSpotStatus(selectedSpot);
                  return (
                    <View>
                      <View style={styles.drawerTitleRow}>
                        <View>
                          <Text style={[styles.drawerSpotName, { color: t.textPrimary }]}>
                            Spot {selectedSpot.spotName}
                          </Text>
                          <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
                            {getProximityText(selectedSpot)}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 10, color: t.textTertiary }}>RATE BASIS</Text>
                          <Text style={{ fontSize: 18, fontWeight: '800', color: t.success }}>
                            ₹{avail?.slotType === selectedSlotType
                              ? avail?.price
                              : selectedSlotType === 'HOURLY'
                              ? selectedSpot.priceHourly
                              : selectedSlotType === 'DAILY'
                              ? selectedSpot.priceDaily
                              : selectedSlotType === 'WEEKLY'
                              ? selectedSpot.priceWeekly
                              : selectedSpot.priceMonthly
                            }
                          </Text>
                        </View>
                      </View>

                      {/* Meta info grid */}
                      <View style={[styles.drawerDetails, { backgroundColor: t.surface, borderColor: t.border }]}>
                        <View style={styles.drawerDetailItem}>
                          <Calendar size={14} color={t.primary} />
                          <Text style={{ fontSize: 12, color: t.textSecondary }}>{selectedDate}</Text>
                        </View>
                        <View style={styles.drawerDetailItem}>
                          <Clock size={14} color={t.primary} />
                          <Text style={{ fontSize: 12, color: t.textSecondary }}>
                            {selectedSlotType} {selectedSlotType === 'HOURLY' && `(${HOURLY_SLOTS[selectedHourlySlotIndex].label})`}
                          </Text>
                        </View>
                        <View style={styles.drawerDetailItem}>
                          <Info size={14} color={t.primary} />
                          <Text style={{ fontSize: 12, color: t.textSecondary }}>
                            Spot Owner: {selectedSpot.owner?.name || 'Verified Employee'}
                          </Text>
                        </View>
                      </View>

                      {/* Booking Status warning notes */}
                      {status === 'MINE_REQUESTED' && (
                        <View style={[styles.statusNote, { backgroundColor: t.warningBg, borderColor: t.warning }]}>
                          <Clock size={16} color={t.warning} />
                          <Text style={{ fontSize: 12, color: t.warning, flex: 1 }}>
                            You have requested this spot! Waiting for the owner to accept or decline.
                          </Text>
                        </View>
                      )}

                      {status === 'MINE_CONFIRMED' && (
                        <View style={[styles.statusNote, { backgroundColor: t.successBg, borderColor: t.success }]}>
                          <BadgeCheck size={16} color={t.success} />
                          <Text style={{ fontSize: 12, color: t.success, flex: 1 }}>
                            You already booked this spot successfully! View code in the "My Tickets" tab.
                          </Text>
                        </View>
                      )}

                      {/* Dynamic Action Button */}
                      <View style={styles.drawerActions}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => { tap(); setSelectedSpot(null); }}
                          style={[styles.drawerCancelCta, { borderColor: t.border }]}
                        >
                          <Text style={[styles.drawerCancelCtaTxt, { color: t.textSecondary }]}>Dismiss</Text>
                        </TouchableOpacity>

                        {status === 'AVAILABLE' || status === 'OTHER_REQUESTED' ? (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={handleBookRequest}
                            disabled={bookingInProgress}
                            style={[styles.drawerActionCta, { backgroundColor: t.primary }]}
                          >
                            {bookingInProgress ? (
                              <ActivityIndicator size="small" color={t.primaryContrast} />
                            ) : (
                              <Text style={[styles.drawerActionCtaTxt, { color: t.primaryContrast }]}>
                                Request Booking Slot
                              </Text>
                            )}
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => { tap(); setSelectedSpot(null); setIsBookingMode(false); setActiveTab('tickets'); }}
                            style={[styles.drawerActionCta, { backgroundColor: t.accent }]}
                          >
                            <Text style={[styles.drawerActionCtaTxt, { color: t.primaryContrast }]}>
                              View My Tickets
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })()}
              </View>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerScroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    gap: 8,
  },
  datePill: {
    width: 58,
    height: 72,
    borderRadius: radius.md,
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
    paddingHorizontal: spacing.lg,
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
    paddingHorizontal: spacing.lg,
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
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dotBadge: {
    position: 'absolute',
    right: '20%',
    top: '30%',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapScrollBody: {
    padding: spacing.md,
    paddingBottom: 160,
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
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
    fontWeight: '800',
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
  ticketsContainer: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  emptyTickets: {
    alignItems: 'center',
    paddingVertical: 100,
    gap: 8,
  },
  emptyTicketsTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  ticketPassCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  ticketCutoutLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    position: 'absolute',
    left: -8,
    top: 50,
    zIndex: 10,
  },
  ticketCutoutRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    position: 'absolute',
    right: -8,
    top: 50,
    zIndex: 10,
  },
  ticketHeader: {
    padding: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ticketStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ticketBody: {
    padding: spacing.md,
  },
  ticketSpotCode: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  ticketDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ticketDetailCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '47%',
  },
  ticketDetailVal: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketTearLine: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  barcodeContainer: {
    flexDirection: 'row',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  drawerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: 1.5,
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  drawerHeaderHandle: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  drawerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  drawerSpotName: {
    fontSize: 20,
    fontWeight: '800',
  },
  drawerDetails: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: spacing.md,
  },
  drawerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 10,
    marginBottom: spacing.md,
  },
  drawerActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  drawerCancelCta: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerCancelCtaTxt: {
    fontSize: 14,
    fontWeight: '700',
  },
  drawerActionCta: {
    flex: 2,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerActionCtaTxt: {
    fontSize: 14,
    fontWeight: '800',
  },
  bookAnotherCta: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookAnotherCtaTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
});
