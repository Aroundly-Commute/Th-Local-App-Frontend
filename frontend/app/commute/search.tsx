import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  useColorScheme, KeyboardAvoidingView, Platform, TextInput,
  BackHandler, ActivityIndicator,
} from 'react-native';

import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  MapPin, Search as SearchIcon, Calendar, Clock, Users,
  ArrowDownUp, SlidersHorizontal, ChevronDown, ArrowUpDown, Check, Send
} from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../src/core/theme/theme';
import { RideCard } from '../../src/modules/commute/components/RideCard';
import { BuddyCard } from '../../src/modules/commute/components/BuddyCard';
import { Shimmer } from '../../src/core/components/Shimmer';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFeatureFlags } from '../../src/services/feature-flag/FeatureFlagContext';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { AnalyticsService } from '../../src/core/services/analytics';
import { DateTimePicker } from '../../src/modules/commute/components/DateTimePicker';
import { LocationSearchModal } from '../../src/modules/commute/components/search/LocationSearchModal';
import { styles } from './search.styles';

const POPULAR = ['Noida → CP', 'Gurgaon → Delhi', 'Faridabad → Delhi', 'Greater Noida → Noida'];





export default function Search() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string;
    hideTabs?: string;
    showAll?: string;
    from?: string;
    to?: string;
    fromCoords?: string;
    toCoords?: string;
    feature?: string;
    vehicleType?: string;
  }>();

  const [mode, setMode] = useState<'find' | 'offer'>('find');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromCoords, setFromCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [toCoords, setToCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [rides, setRides] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showAllLimit, setShowAllLimit] = useState(10);
  const [locLoading, setLocLoading] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>('CAR');
  const submittingRef = useRef(false);

  const [searchTarget, setSearchTarget] = useState<'from' | 'to' | null>(null);
  const [requestingRideId, setRequestingRideId] = useState<string | null>(null);
  const [requestedRideIds, setRequestedRideIds] = useState<string[]>([]);
  const [sharingCabId, setSharingCabId] = useState<string | null>(null);
  const [sharedCabIds, setSharedCabIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const { enablePopularRoutes } = useFeatureFlags();

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('@commute_recent_searches');
        if (saved) {
          const parsed = JSON.parse(saved) || [];
          const valid = parsed.filter((r: any) => r.fromCoords && r.toCoords);
          setRecentSearches(valid);
        }
      } catch (err) {
        console.error('Failed to load recent searches:', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (params.showAll === 'true') {
      setLoading(true);
      api.get(`/rides?page=1&limit=${showAllLimit}`)
        .then(({ data }) => {
          setRides(data || []);
        })
        .catch((err) => {
          console.error('Failed to load all rides:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params.showAll, showAllLimit]);

  const saveRecentSearch = async (fromVal: string, toVal: string) => {
    if (!fromCoords || !toCoords) return;
    try {
      const saved = await AsyncStorage.getItem('@commute_recent_searches');
      let list = saved ? JSON.parse(saved) : [];
      list = list.filter((r: any) => !(r.from === fromVal && r.to === toVal));
      list.unshift({
        from: fromVal,
        to: toVal,
        fromCoords,
        toCoords
      });
      list = list.slice(0, 3);
      await AsyncStorage.setItem('@commute_recent_searches', JSON.stringify(list));
      setRecentSearches(list);
    } catch (err) {
      console.error('Failed to save recent search:', err);
    }
  };

  const handleGetCurrentLocation = async () => {
    try {
      setLocLoading(true);
      tap();
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Please enable it in settings.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });

      const { latitude, longitude } = loc.coords;
      let placeName = 'Current Location';
      setFromCoords({ lat: latitude, lng: longitude });
      success();

      try {
        if (Platform.OS === 'web') {
          const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              placeName = data.results[0].formatted_address;
            }
          }
        } else {
          const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (addresses && addresses.length > 0) {
            const addr = addresses[0];
            const namePart = addr.name || addr.street || '';
            const districtPart = addr.district || addr.subregion || '';
            const cityPart = addr.city || addr.region || '';
            const parts = [namePart, districtPart, cityPart].filter(Boolean);
            placeName = parts.join(', ') || 'Current Location';
          }
        }
      } catch (e) {
        // Fallback is already handled
      }
      setFrom(placeName);
    } catch (err: any) {
      errorH();
      Alert.alert('Error', 'Failed to get current location: ' + err.message);
    } finally {
      setLocLoading(false);
    }
  };

  // Date/time as a single Date object for easy formatting (aligned in IST)
  const [datetime, setDatetime] = useState<Date>(() => {
    const d = new Date();
    const istMs = d.getTime() + 5.5 * 60 * 60 * 1000;
    const istDate = new Date(istMs);
    const targetHour = istDate.getUTCHours() + 1;
    const utcMs = Date.UTC(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate(),
      targetHour,
      0, 0, 0
    );
    return new Date(utcMs - 5.5 * 60 * 60 * 1000);
  });
  const [seats, setSeats] = useState('1');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Pick up mode param from navigation (e.g. from home "Offer Ride" button)
  useEffect(() => {
    if (params.mode === 'offer') {
      setMode('offer');
    } else if (params.mode === 'find') {
      setMode('find');
    }
  }, [params.mode]);

  useEffect(() => {
    if (params.from) setFrom(params.from);
    if (params.to) setTo(params.to);
    if (params.vehicleType) setVehicleType(params.vehicleType);
    if (params.fromCoords) {
      try {
        setFromCoords(JSON.parse(params.fromCoords));
      } catch (e) {
        console.error('Failed to parse fromCoords from params:', e);
      }
    }
    if (params.toCoords) {
      try {
        setToCoords(JSON.parse(params.toCoords));
      } catch (e) {
        console.error('Failed to parse toCoords from params:', e);
      }
    }
  }, [params.from, params.to, params.fromCoords, params.toCoords, params.vehicleType]);





  const dateLabel = datetime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const timeLabel = datetime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

  const handleSwapLocations = () => {
    tap();
    const tempFrom = from;
    const tempFromCoords = fromCoords;
    setFrom(to);
    setFromCoords(toCoords);
    setTo(tempFrom);
    setToCoords(tempFromCoords);
  };

  const handleRequestRide = async (ride: any) => {
    tap();
    setRequestingRideId(ride.id);
    try {
      const payload = {
        seats: parseInt(seats) || 1,
        riderStartName: from,
        riderEndName: to,
        riderStartCoords: fromCoords?.lng && fromCoords?.lat ? [Number(fromCoords.lng), Number(fromCoords.lat)] : undefined,
        riderEndCoords: toCoords?.lng && toCoords?.lat ? [Number(toCoords.lng), Number(toCoords.lat)] : undefined,
        riderStartTime: ride.startTime
      };

      await api.post(`/rides/${ride.id}/book`, payload);
      success();
      setRequestedRideIds(prev => [...prev, ride.id]);
      Alert.alert('Request Sent!', 'Your booking request has been sent successfully. You will be notified once the driver accepts.');
    } catch (e: any) {
      errorH();
      Alert.alert('Failed', e?.response?.data?.message || e?.response?.data?.detail || 'Try again');
    } finally {
      setRequestingRideId(null);
    }
  };

  const handleShareCab = async (buddyRequest: any) => {
    tap();
    setSharingCabId(buddyRequest.id);
    try {
      await api.post('/matchmaking/buddies/request', { buddyRequestId: buddyRequest.id });
      success();
      setSharedCabIds(prev => [...prev, buddyRequest.id]);
      Alert.alert(
        'Request Sent',
        `Your request to book a cab with ${buddyRequest.riderName || buddyRequest.rider?.name || 'Buddy'} has been successfully sent. You can track this request on your Requests page.`
      );
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send cab match request.');
    } finally {
      setSharingCabId(null);
    }
  };

  const handlePublishOfferDirectly = useCallback(async () => {
    if (!from.trim() || !to.trim()) {
      Alert.alert('Locations Needed', "Please select both 'From' and 'To' locations.");
      return;
    }
    if (!fromCoords || !toCoords) {
      Alert.alert('Selection Required', 'Please select both locations from the suggestions list.');
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    const istShifted = new Date(datetime.getTime() + 5.5 * 60 * 60 * 1000);
    const dateStr = `${istShifted.getUTCFullYear()}-${String(istShifted.getUTCMonth() + 1).padStart(2, '0')}-${String(istShifted.getUTCDate()).padStart(2, '0')}`;
    const timeStr = `${String(istShifted.getUTCHours()).padStart(2, '0')}:${String(istShifted.getUTCMinutes()).padStart(2, '0')}`;
    try {
      AnalyticsService.trackEvent('ride_offer_created', {
        start_place: from,
        end_place: to,
        seats_count: seats,
      }).catch(() => { });

      const { data: ride } = await api.post('/rides/offer', {
        startName: from, endName: to,
        startCoords: fromCoords ? [fromCoords.lng, fromCoords.lat] : null,
        endCoords: toCoords ? [toCoords.lng, toCoords.lat] : null,
        seats: parseInt(seats) || 1,
        price: 10,
        date: dateStr,
        time: timeStr,
        vehicleType,
      });
      success();
      saveRecentSearch(from, to);

      Alert.alert(
        'Success',
        'Ride offered! Finding matching passengers on your route...',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace({
                pathname: '/commute/matching-results' as any,
                params: { rideId: ride.id },
              });
            }
          }
        ]
      );
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Failed to create ride offer.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }, [from, to, fromCoords, toCoords, datetime, seats, router, vehicleType]);

  const submitAction = useCallback(async () => {
    if (!from.trim() || !to.trim()) {
      AnalyticsService.trackWarning('Location Validation Failed', { from, to }).catch(() => { });
      Alert.alert('Locations Needed', "Please select both 'From' and 'To' locations.");
      return;
    }
    if (!fromCoords || !toCoords) {
      Alert.alert('Selection Required', 'Please select both locations from the suggestions list.');
      return;
    }
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true); setSearched(true);
    try {
      saveRecentSearch(from, to);
      AnalyticsService.trackEvent('ride_search_initiated', {
        start_place: from,
        end_place: to,
      }).catch(() => { });

      const searchFeature = params.feature || (mode === 'offer' ? 'offer' : 'main');

      const { data } = await api.post('/matchmaking/search', {
        start: fromCoords ? { lng: fromCoords.lng, lat: fromCoords.lat } : { lng: 77.3910, lat: 28.5355 },
        end: toCoords ? { lng: toCoords.lng, lat: toCoords.lat } : { lng: 77.4, lat: 28.6 },
        startPlaceName: from || 'Origin',
        endPlaceName: to || 'Destination',
        startTime: datetime.toISOString(),
        feature: searchFeature,
      });

      const returnedSections = data.sections || [];
      setSections(returnedSections);

      // Flatten for rides compatibility list (resultsCount counts them all)
      const flatMatches = returnedSections.reduce((acc: any[], sec: any) => [...acc, ...(sec.data || [])], []);
      setRides(flatMatches);
    } catch (e: any) {
      errorH();
      AnalyticsService.trackError(e?.response?.data?.message || 'Submit Action Exception', false, { mode }).catch(() => { });
      Alert.alert('Error', e?.response?.data?.message || 'Action failed. Please check your connection.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }, [mode, from, to, fromCoords, toCoords, datetime, seats, router, params.feature]);

  const quickSearch = (r: any) => {
    tap();
    setFrom(r.from);
    setTo(r.to);
    setFromCoords(r.fromCoords || null);
    setToCoords(r.toCoords || null);
  };

  const handlePostSearch = () => {
    if (!fromCoords || !toCoords) {
      Alert.alert('Selection Required', 'Please select both locations from the suggestions list.');
      return;
    }
    tap();
    Alert.alert(
      'Post Ride Request',
      'Other users will see that you are looking for a ride from ' + (from || '').split(',')[0] + ' to ' + (to || '').split(',')[0] + '. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post Request',
          onPress: async () => {
            tap();
            setLoading(true);
            try {
              await api.post('/matchmaking/buddies', {
                startPlaceName: from,
                endPlaceName: to,
                startCoords: fromCoords ? [fromCoords.lng, fromCoords.lat] : null,
                endCoords: toCoords ? [toCoords.lng, toCoords.lat] : null,
                startTime: datetime.toISOString(),
                seatsNeeded: parseInt(seats) || 1,
              });
              success();
              Alert.alert(
                'Success',
                'Your Ride request has been posted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      router.replace('/(tabs)');
                    }
                  }
                ]
              );
            } catch (err: any) {
              errorH();
              Alert.alert('Error', err.response?.data?.message || 'Failed to post ride request.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader
        title={params.showAll === 'true' ? 'Rides Near You' : (mode === 'find' ? 'Find a Ride' : 'Offer a Ride')}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        {params.showAll !== 'true' && (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: 12, zIndex: 100 }}>
            <>
              {/* Tabs */}
              {params.hideTabs !== 'true' && (
                <View style={[styles.tabBar, { backgroundColor: t.muted }]}>
                  <TabBtn testID="tab-find" disabled={loading || locLoading} label="Find a Ride" active={mode === 'find'} t={t} onPress={() => { tap(); setMode('find'); }} />
                  <TabBtn testID="tab-offer" disabled={loading || locLoading} label="Offer a Ride" active={mode === 'offer'} t={t} onPress={() => { tap(); setMode('offer'); }} />
                </View>
              )}

                {/* From / To inputs (Metro style card) */}
                <View style={[styles.inputCard, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md, zIndex: 10 }]}>
                  <View style={styles.dropdownsContainer}>
                    <TouchableOpacity
                      disabled={loading || locLoading}
                      onPress={() => { tap(); setSearchTarget('from'); }}
                      activeOpacity={0.8}
                      style={[styles.dropdownTrigger, { borderBottomWidth: 1, borderBottomColor: t.border, opacity: (loading || locLoading) ? 0.6 : 1 }]}
                    >
                      <MapPin color={t.primary} size={16} />
                      <Text
                        style={[
                          styles.dropdownLabel,
                          { color: from ? t.textPrimary : t.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {from || 'From (Origin)'}
                      </Text>
                      <ChevronDown color={t.textSecondary} size={16} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      disabled={loading || locLoading}
                      onPress={() => { tap(); setSearchTarget('to'); }}
                      activeOpacity={0.8}
                      style={[styles.dropdownTrigger, { opacity: (loading || locLoading) ? 0.6 : 1 }]}
                    >
                      <MapPin color="#D81B60" size={16} />
                      <Text
                        style={[
                          styles.dropdownLabel,
                          { color: to ? t.textPrimary : t.textSecondary },
                        ]}
                        numberOfLines={1}
                      >
                        {to || 'To (Destination)'}
                      </Text>
                      <ChevronDown color={t.textSecondary} size={16} />
                    </TouchableOpacity>

                    {/* Swap Button */}
                    <TouchableOpacity
                      disabled={loading || locLoading}
                      style={[styles.swapButton, { backgroundColor: t.primary, borderColor: t.background, opacity: (loading || locLoading) ? 0.6 : 1 }]}
                      onPress={handleSwapLocations}
                      activeOpacity={0.85}
                    >
                      <ArrowUpDown color="#FFFFFF" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Date / Time / Seats row */}
                <View style={[styles.filters, { marginTop: spacing.sm, zIndex: 0 }]}>
                  {/* Date picker trigger */}
                  <TouchableOpacity
                    testID="date-picker-btn"
                    disabled={loading || locLoading}
                    onPress={() => { tap(); setShowDatePicker(true); }}
                    style={[styles.filterChip, { borderColor: t.border, flex: 1, opacity: (loading || locLoading) ? 0.6 : 1 }]}
                  >
                    <Calendar color={t.textSecondary} size={13} />
                    <Text style={[styles.filterChipText, { color: t.textPrimary }]} numberOfLines={1}>{dateLabel}</Text>
                  </TouchableOpacity>

                  {/* Time picker trigger */}
                  <TouchableOpacity
                    testID="time-picker-btn"
                    disabled={loading || locLoading}
                    onPress={() => { tap(); setShowTimePicker(true); }}
                    style={[styles.filterChip, { borderColor: t.border, flex: 1, opacity: (loading || locLoading) ? 0.6 : 1 }]}
                  >
                    <Clock color={t.textSecondary} size={13} />
                    <Text style={[styles.filterChipText, { color: t.textPrimary }]} numberOfLines={1}>{timeLabel}</Text>
                  </TouchableOpacity>

                  {/* Seats manual input */}
                  <View style={[styles.filterChip, { borderColor: t.border, width: 72, opacity: (loading || locLoading) ? 0.6 : 1 }]}>
                    <Users color={t.textSecondary} size={13} />
                    <TextInput
                      testID="seats-input"
                      editable={!loading && !locLoading}
                      value={seats}
                      onChangeText={setSeats}
                      keyboardType="numeric"
                      maxLength={1}
                      style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600', flex: 1, padding: 0 }}
                      placeholderTextColor={t.textSecondary}
                      placeholder="1"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  testID="publish-submit"
                  disabled={loading || locLoading}
                  onPress={() => {
                    tap();
                    if (mode === 'find') {
                      submitAction();
                    } else {
                      handlePublishOfferDirectly();
                    }
                  }}
                  activeOpacity={0.8}
                  style={[
                    styles.cta,
                    {
                      backgroundColor: t.primary,
                      marginTop: spacing.md,
                      zIndex: 0,
                      opacity: (loading || locLoading) ? 0.6 : 1
                    }
                  ]}
                >
                  <Text style={[styles.ctaText, { color: t.primaryContrast }]}>
                    {mode === 'find' ? 'Search Rides' : 'Offer Ride'}
                  </Text>
                </TouchableOpacity>
            </>
          </View>
        )}

        {/* Content */}
        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, paddingBottom: 140 }}>
          {params.showAll === 'true' ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: t.textPrimary }]}>
                  {loading ? 'Loading rides…' : `${rides.length} rides available`}
                </Text>
              </View>

              {loading ? (
                <View style={{ gap: 12 }}>
                  <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
                  <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {rides.map((r) => (
                    <RideCard key={r.id} ride={r} t={t} testID={`search-ride-${r.id}`}
                      onPress={() => {
                        tap();
                        router.push(`/ride/${r.id}?seats=${seats}` as any);
                      }} />
                  ))}
                  {rides.length === 0 && (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <SearchIcon color={t.textTertiary} size={28} />
                      <Text style={{ color: t.textSecondary, marginTop: 8 }}>No rides available on campus.</Text>
                    </View>
                  )}
                  {rides.length >= showAllLimit && (
                    <TouchableOpacity
                      onPress={() => { tap(); setShowAllLimit(prev => prev + 10); }}
                      activeOpacity={0.8}
                      style={{
                        height: 48,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: spacing.md,
                        marginBottom: spacing.lg,
                        backgroundColor: t.surface,
                        borderColor: t.border,
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>Show More</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </>
          ) : !searched ? (
            <>
              {recentSearches.length > 0 && (
                <>
                  <Text style={[styles.section, { color: t.textPrimary }]}>Recent Searches</Text>
                  <View style={{ gap: 8 }}>
                    {recentSearches.map((r, i) => (
                      <TouchableOpacity
                        key={i}
                        testID={`recent-${i}`}
                        onPress={() => quickSearch(r)}
                        activeOpacity={0.7}
                        style={[styles.recentRow, { backgroundColor: t.surface, borderColor: t.border }]}
                      >
                        <View style={[styles.recentIcon, { backgroundColor: t.muted }]}>
                          <MapPin color={t.textPrimary} size={14} />
                        </View>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
                            {r.from}
                          </Text>
                          <Text style={{ color: t.textSecondary, marginHorizontal: 8 }}>→</Text>
                          <Text style={{ color: t.textPrimary, fontSize: 13, fontWeight: '600', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
                            {r.to}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {enablePopularRoutes && (
                <>
                  <Text style={[styles.section, { color: t.textPrimary, marginTop: recentSearches.length > 0 ? spacing.xl : 0 }]}>Popular Routes</Text>
                  <View style={styles.popularWrap}>
                    {POPULAR.map((p) => (
                      <TouchableOpacity key={p} activeOpacity={0.7} onPress={() => { tap(); }}
                        style={[styles.popularChip, { borderColor: t.border, backgroundColor: t.surface }]}>
                        <Text style={[styles.popularText, { color: t.textPrimary }]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <>
              <View style={styles.resultsHeader}>
                <Text style={[styles.resultsCount, { color: t.textPrimary }]}>
                  {loading ? 'Searching…' : `${rides.length} rides found`}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={[styles.iconBtn, { borderColor: t.border }]} onPress={() => tap()}>
                    <ArrowDownUp color={t.textPrimary} size={14} />
                    <Text style={[styles.iconBtnText, { color: t.textPrimary }]}>Sort</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.iconBtn, { borderColor: t.border }]} onPress={() => tap()}>
                    <SlidersHorizontal color={t.textPrimary} size={14} />
                    <Text style={[styles.iconBtnText, { color: t.textPrimary }]}>Filter</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {loading ? (
                <View style={{ gap: 12 }}>
                  <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
                  <Shimmer style={{ height: 150, borderRadius: radius.lg }} />
                </View>
              ) : (
                <View style={{ gap: 12 }}>
                  {sections.map((section, idx) => {
                    if (!section.data || section.data.length === 0) return null;
                    return (
                      <View key={section.type || idx} style={{ marginTop: 8, marginBottom: 16 }}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: t.textPrimary, marginBottom: 10 }}>
                          {section.title} ({section.data.length})
                        </Text>
                        <View style={{ gap: 12 }}>
                          {section.data.map((item: any) => {
                            if (item.driverId) {
                              const isRequested = requestedRideIds.includes(item.id);
                              const isRequesting = requestingRideId === item.id;
                              return (
                                <View
                                  key={item.id}
                                  style={{
                                    borderRadius: radius.lg,
                                    padding: spacing.md,
                                    borderWidth: 1,
                                    gap: 10,
                                    elevation: 2,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                    backgroundColor: t.surface,
                                    borderColor: t.border
                                  }}
                                >
                                  <RideCard
                                    ride={item}
                                    t={t}
                                    compact
                                    style={{ borderWidth: 0, padding: 0, backgroundColor: 'transparent' }}
                                    testID={`search-ride-${item.id}`}
                                    onPress={() => {
                                      tap();
                                      router.push({
                                        pathname: `/ride/${item.id}`,
                                        params: {
                                          fromName: from,
                                          toName: to,
                                          fromLat: fromCoords?.lat,
                                          fromLng: fromCoords?.lng,
                                          toLat: toCoords?.lat,
                                          toLng: toCoords?.lng,
                                          seats: seats,
                                          estimatedFare: item.estimatedFare ? JSON.stringify(item.estimatedFare) : undefined,
                                        }
                                      } as any);
                                    }}
                                  />

                                  {/* Request Ride Action Button */}
                                  <TouchableOpacity
                                    disabled={isRequested || isRequesting}
                                    onPress={() => handleRequestRide(item)}
                                    activeOpacity={0.8}
                                    style={{
                                      height: 40,
                                      borderRadius: radius.md,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderWidth: 1,
                                      backgroundColor: isRequested ? t.successBg : t.primary,
                                      borderColor: isRequested ? t.success : t.primary,
                                      marginTop: spacing.xs
                                    }}
                                  >
                                    {isRequesting ? (
                                      <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : isRequested ? (
                                      <>
                                        <Check size={14} color={t.success} />
                                        <Text style={{ color: t.success, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                          Request Sent
                                        </Text>
                                      </>
                                    ) : (
                                      <>
                                        <Send size={13} color={t.primaryContrast} />
                                        <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                          Request Ride
                                        </Text>
                                      </>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              );
                            } else {
                              const isShared = sharedCabIds.includes(item.id);
                              const isSharing = sharingCabId === item.id;
                              return (
                                <View
                                  key={item.id}
                                  style={{
                                    borderRadius: radius.lg,
                                    padding: spacing.md,
                                    borderWidth: 1,
                                    gap: 10,
                                    elevation: 2,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 4,
                                    backgroundColor: t.surface,
                                    borderColor: t.border
                                  }}
                                >
                                  <BuddyCard
                                    buddy={item}
                                    t={t}
                                    style={{ borderWidth: 0, padding: 0, backgroundColor: 'transparent' }}
                                    onPress={() => {
                                      tap();
                                      router.push({
                                        pathname: `/buddy/${item.id}`,
                                        params: {
                                          mode
                                        }
                                      } as any);
                                    }}
                                  />

                                  {/* Share Cab Action Button */}
                                  <TouchableOpacity
                                    disabled={isShared || isSharing}
                                    onPress={() => handleShareCab(item)}
                                    activeOpacity={0.8}
                                    style={{
                                      height: 40,
                                      borderRadius: radius.md,
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderWidth: 1,
                                      backgroundColor: isShared ? t.successBg : t.primary,
                                      borderColor: isShared ? t.success : t.primary,
                                      marginTop: spacing.xs
                                    }}
                                  >
                                    {isSharing ? (
                                      <ActivityIndicator size="small" color="#FFFFFF" />
                                    ) : isShared ? (
                                      <>
                                        <Check size={14} color={t.success} />
                                        <Text style={{ color: t.success, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                          Request Sent
                                        </Text>
                                      </>
                                    ) : (
                                      <>
                                        <Send size={13} color={t.primaryContrast} />
                                        <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                          Share Cab
                                        </Text>
                                      </>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              );
                            }
                          })}
                        </View>
                      </View>
                    );
                  })}

                  {rides.length === 0 && (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                      <SearchIcon color={t.textTertiary} size={28} />
                      <Text style={{ color: t.textSecondary, marginTop: 8 }}>
                        {mode === 'offer' ? 'No passengers match your offer route.' : 'No rides match your search.'}
                      </Text>
                      <Text style={{ color: t.textTertiary, marginTop: 4, fontSize: 12, textAlign: 'center', marginBottom: 16 }}>
                        {mode === 'offer' ? 'You can still publish your offer directly for passenger requests created later.' : 'Try adjusting the time window or search radius.'}
                      </Text>
                      <TouchableOpacity
                        testID="post-search-cta-empty"
                        activeOpacity={0.8}
                        onPress={mode === 'offer' ? handlePublishOfferDirectly : handlePostSearch}
                        style={{
                          backgroundColor: t.primary,
                          paddingHorizontal: 20,
                          paddingVertical: 12,
                          borderRadius: radius.md,
                        }}
                      >
                        <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 14 }}>
                          {mode === 'offer' ? 'Publish Ride Offer' : 'Post as Ride Request'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {rides.length > 0 && (
                    <View style={{ marginTop: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: t.border, alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: t.textSecondary, fontSize: 13, textAlign: 'center' }}>
                        {mode === 'offer' ? 'Want to publish the ride offer anyway?' : "Didn't find a matching ride?"}
                      </Text>
                      <TouchableOpacity
                        testID="post-search-cta"
                        activeOpacity={0.8}
                        onPress={mode === 'offer' ? handlePublishOfferDirectly : handlePostSearch}
                        style={{
                          backgroundColor: t.muted,
                          paddingHorizontal: 20,
                          paddingVertical: 12,
                          borderRadius: radius.md,
                          borderWidth: 1,
                          borderColor: t.border,
                        }}
                      >
                        <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: 14 }}>
                          {mode === 'offer' ? 'Publish Ride Offer' : 'Post Your Search Request'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <DateTimePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={datetime}
        onChange={(d) => setDatetime(d)}
        mode="date"
      />

      {/* Time Picker Modal */}
      <DateTimePicker
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        value={datetime}
        onChange={(d) => setDatetime(d)}
        mode="time"
      />

      {/* Location Search Modal Overlay */}
      {searchTarget !== null && (
        <LocationSearchModal
          visible={searchTarget !== null}
          onClose={() => setSearchTarget(null)}
          value={searchTarget === 'from' ? from : to}
          placeholder={searchTarget === 'from' ? 'From (Origin)' : 'To (Destination)'}
          t={t}
          onSelect={(name, lat, lng) => {
            if (searchTarget === 'from') {
              setFrom(name);
              setFromCoords({ lat, lng });
            } else {
              setTo(name);
              setToCoords({ lat, lng });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const TabBtn: React.FC<{ label: string; active: boolean; t: Theme; onPress: () => void; testID?: string; disabled?: boolean }>
  = ({ label, active, t, onPress, testID, disabled }) => (
    <TouchableOpacity testID={testID} disabled={disabled} onPress={onPress} activeOpacity={0.8}
      style={[styles.tabBtn, active && { backgroundColor: t.background }, disabled && { opacity: 0.6 }]}>
      <Text style={[styles.tabBtnText, { color: active ? t.textPrimary : t.textSecondary, fontWeight: active ? '700' : '500' }]}>{label}</Text>
    </TouchableOpacity>
  );




