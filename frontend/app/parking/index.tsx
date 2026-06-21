import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  Search,
  ChevronLeft,
} from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing } from '../../src/core/theme/theme';
import { styles } from './index.styles';
import { tap, success } from '../../src/core/utils/haptics';
import { Shimmer } from '../../src/core/components/Shimmer';
import { Alert } from '../../src/core/components/CustomAlert';
import { DateTimePicker } from '../../src/modules/commute/components/DateTimePicker';
import { ParkingFilters, HOURLY_SLOTS } from '../../src/modules/commute/components/ParkingFilters';
import { TicketCard } from '../../src/modules/commute/components/TicketCard';
import { BookingDrawer } from '../../src/modules/commute/components/BookingDrawer';
import { ParkingMapView } from '../../src/modules/commute/components/ParkingMapView';
import { ParkingListView } from '../../src/modules/commute/components/ParkingListView';

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
    status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
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
  status: 'REQUESTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
  createdAt: string;
};

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

export default function Parking() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { user } = useAuth();
  const router = useRouter();

  // Tab State: 'map' | 'list' | 'tickets'
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'tickets'>('map');

  // Booking Flow States
  const [isBookingMode, setIsBookingMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const activeTickets = myBookings.filter(b => b.status === 'ACCEPTED' || b.status === 'REQUESTED');
  const hasActiveTicket = activeTickets.length > 0;
  const showTicketView = hasActiveTicket && !isBookingMode;

  // Automatically select first valid slot if current one is past
  useEffect(() => {
    if (selectedSlotType === 'HOURLY') {
      const todayStr = (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();

      if (selectedDate === todayStr) {
        const now = new Date();
        const istHours = new Date(now.getTime() + 5.5 * 60 * 60 * 1000).getUTCHours();
        const currentSlot = HOURLY_SLOTS[selectedHourlySlotIndex];
        const currentEndHour = parseInt(currentSlot.end.split(':')[0]);
        if (currentEndHour <= istHours) {
          const firstValidIdx = HOURLY_SLOTS.findIndex(slot => parseInt(slot.end.split(':')[0]) > istHours);
          if (firstValidIdx !== -1) {
            setSelectedHourlySlotIndex(firstValidIdx);
          }
        }
      }
    }
  }, [selectedDate, selectedSlotType, selectedHourlySlotIndex]);

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
    // Find availability matching filters using range checks
    const avail = spot.availabilities.find((av) => {
      const avStart = new Date(av.startTime);
      const avEnd = new Date(av.endTime);

      if (selectedSlotType === 'HOURLY') {
        const targetHourlySlot = HOURLY_SLOTS[selectedHourlySlotIndex];
        const targetStart = new Date(convertISTToUTC(selectedDate, targetHourlySlot.start));
        const targetEnd = new Date(convertISTToUTC(selectedDate, targetHourlySlot.end));

        // Rule 1: Hourly availability matches this exact hourly slot
        if (av.slotType === 'HOURLY') {
          return av.date === selectedDate && getISTDate(av.startTime).getUTCHours() === parseInt(targetHourlySlot.start.split(':')[0]);
        }
        // Rule 2: Daily availability matches any hourly slot on that day
        if (av.slotType === 'DAILY') {
          return av.date === selectedDate;
        }
        // Rule 3: Weekly/Monthly availability matches if this hourly slot lies within its window
        if (av.slotType === 'WEEKLY' || av.slotType === 'MONTHLY') {
          return targetStart >= avStart && targetEnd <= avEnd;
        }
      }

      if (selectedSlotType === 'DAILY') {
        const targetStart = new Date(convertISTToUTC(selectedDate, '00:00'));
        const targetEnd = new Date(convertISTToUTC(selectedDate, '23:59:59'));

        // Rule 2: Daily availability matches full day
        if (av.slotType === 'DAILY') {
          return av.date === selectedDate;
        }
        // Rule 3: Weekly/Monthly matches if full day lies within its window
        if (av.slotType === 'WEEKLY' || av.slotType === 'MONTHLY') {
          return targetStart >= avStart && targetEnd <= avEnd;
        }
      }

      if (selectedSlotType === 'WEEKLY' || selectedSlotType === 'MONTHLY') {
        const targetStart = new Date(convertISTToUTC(selectedDate, '00:00'));
        const daysToAdd = selectedSlotType === 'WEEKLY' ? 7 : 30;
        const dEnd = new Date(selectedDate);
        dEnd.setDate(dEnd.getDate() + daysToAdd);
        const year = dEnd.getFullYear();
        const month = String(dEnd.getMonth() + 1).padStart(2, '0');
        const dateVal = String(dEnd.getDate()).padStart(2, '0');
        const targetEnd = new Date(convertISTToUTC(`${year}-${month}-${dateVal}`, '00:00'));

        if (av.slotType === 'WEEKLY' || av.slotType === 'MONTHLY') {
          return targetStart >= avStart && targetEnd <= avEnd;
        }
      }

      return false;
    });

    if (!avail) {
      return { status: 'UNAVAILABLE' as const, avail: null, booking: null };
    }

    // Find if current spot has booking in the active time slot using overlap checks
    const bk = spot.bookings.find((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);

      if (selectedSlotType === 'HOURLY') {
        const targetHourlySlot = HOURLY_SLOTS[selectedHourlySlotIndex];
        const targetStart = new Date(convertISTToUTC(selectedDate, targetHourlySlot.start));
        const targetEnd = new Date(convertISTToUTC(selectedDate, targetHourlySlot.end));
        return targetStart < bEnd && targetEnd > bStart;
      }

      if (selectedSlotType === 'DAILY') {
        const targetStart = new Date(convertISTToUTC(selectedDate, '00:00'));
        const targetEnd = new Date(convertISTToUTC(selectedDate, '23:59:59'));
        return targetStart < bEnd && targetEnd > bStart;
      }

      if (selectedSlotType === 'WEEKLY' || selectedSlotType === 'MONTHLY') {
        const targetStart = new Date(convertISTToUTC(selectedDate, '00:00'));
        const daysToAdd = selectedSlotType === 'WEEKLY' ? 7 : 30;
        const dEnd = new Date(selectedDate);
        dEnd.setDate(dEnd.getDate() + daysToAdd);
        const year = dEnd.getFullYear();
        const month = String(dEnd.getMonth() + 1).padStart(2, '0');
        const dateVal = String(dEnd.getDate()).padStart(2, '0');
        const targetEnd = new Date(convertISTToUTC(`${year}-${month}-${dateVal}`, '00:00'));
        return targetStart < bEnd && targetEnd > bStart;
      }

      return false;
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

      // Calculate final pricing based on booking request:
      // If the selected slotType matches the availability slotType, charge the availability rate.
      // Otherwise, charge the spot's rate for the selected slotType duration basis.
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
            myBookings.map((bk) => (
              <TicketCard
                key={bk.id}
                bk={bk}
                t={t}
                onPress={() => {
                  tap();
                  router.push({
                    pathname: '/parking/ticket/[id]',
                    params: { id: bk.id }
                  });
                }}
              />
            ))
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
          <ParkingFilters
            t={t}
            selectedSlotType={selectedSlotType}
            setSelectedSlotType={setSelectedSlotType}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedHourlySlotIndex={selectedHourlySlotIndex}
            setSelectedHourlySlotIndex={setSelectedHourlySlotIndex}
            setShowDatePicker={setShowDatePicker}
          />

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
              <ParkingMapView
                spots={spots}
                selectedSpot={selectedSpot}
                onSpotPress={handleSpotPress}
                getSpotStatus={getSpotStatus}
                t={t}
                loading={loading}
              />
            )}

            {/* TAB 2: List View Finder */}
            {activeTab === 'list' && (
              <ParkingListView
                spots={spots}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSpotSelect={setSelectedSpot}
                getSpotStatus={getSpotStatus}
                getProximityText={getProximityText}
                selectedSlotType={selectedSlotType}
                t={t}
                loading={loading}
              />
            )}

            {/* Persistent Absolute Floating Bottom Sheet Drawer */}
            {selectedSpot && (
              <BookingDrawer
                selectedSpot={selectedSpot}
                status={getSpotStatus(selectedSpot).status}
                avail={getSpotStatus(selectedSpot).avail}
                proximityText={getProximityText(selectedSpot)}
                t={t}
                selectedSlotType={selectedSlotType}
                selectedDate={selectedDate}
                selectedHourlySlotLabel={selectedSlotType === 'HOURLY' ? HOURLY_SLOTS[selectedHourlySlotIndex].label : undefined}
                bookingInProgress={bookingInProgress}
                handleBookRequest={handleBookRequest}
                onDismiss={() => setSelectedSpot(null)}
                onViewTickets={() => {
                  setSelectedSpot(null);
                  setIsBookingMode(false);
                  setActiveTab('tickets');
                }}
              />
            )}
          </View>
        </View>
      )}
      {showDatePicker && (
        <DateTimePicker
          visible={showDatePicker}
          onClose={() => setShowDatePicker(false)}
          value={(() => {
            const [y, m, d] = selectedDate.split('-').map(Number);
            const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
            return new Date(date.getTime() - 5.5 * 60 * 60 * 1000);
          })()}
          onChange={(d) => {
            const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
            const year = istDate.getUTCFullYear();
            const month = String(istDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(istDate.getUTCDate()).padStart(2, '0');
            setSelectedDate(`${year}-${month}-${day}`);
          }}
        />
      )}
    </SafeAreaView>
  );
}


