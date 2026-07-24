import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  RefreshControl, Dimensions, Platform, ActivityIndicator, Image, Linking,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  MapPin, Users, Calendar, Leaf, Search as SearchIcon,
  ChevronRight, Star, Clock, ChevronDown, Home, Briefcase,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { useAuth } from '../../../core/auth/auth';
import { api } from '../../../core/api/api';
import { lightTheme, darkTheme, spacing, radius, Theme } from '../../../core/theme/theme';
import { Shimmer } from '../../../core/components/Shimmer';
import { VerifiedAvatar } from '../../../core/components/VerifiedAvatar';
import { RideCard } from '../components/RideCard';
import { UpcomingRideCard } from '../components/UpcomingRideCard';
import { RequestedRideCard } from '../components/RequestedRideCard';
import { NearbyRideCard } from '../components/NearbyRideCard';
import { BuddyCard } from '../components/BuddyCard';
import { tap } from '../../../core/utils/haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFeatureFlags } from '../../../services/feature-flag/FeatureFlagContext';
import { Alert } from '../../../core/components/CustomAlert';

const CarPoolingIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill={color} />
  </Svg>
);

const CabBuddyIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <Circle cx="9" cy="7" r="4" />
    <Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </Svg>
);

const OfferRideIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="3" />
    <Line x1="12" y1="2" x2="12" y2="9" />
    <Line x1="12" y1="15" x2="12" y2="22" />
    <Line x1="2" y1="12" x2="9" y2="12" />
    <Line x1="15" y1="12" x2="22" y2="12" />
  </Svg>
);

const PublicTransportIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM18 11H6V6h12v5z" fill={color} />
  </Svg>
);

const GooglePlayIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 2.6C2.8 2.8 2.7 3.1 2.7 3.5v17c0 .4.1.7.3.9l.1.1 9.6-9.6v-.2L3.1 2.5l-.1.1z" fill="#3FCCFF" />
    <Path d="M16.1 15.7l-3.4-3.4v-.2l3.4-3.4.1.1 3.8 2.2c1.1.6 1.1 1.6 0 2.2l-3.8 2.2-.1.3z" fill="#FFDF00" />
    <Path d="M12.7 12.1L3.1 21.7c.3.3.8.3 1.4 0l8.2-4.7-3-4.9z" fill="#FF3A44" />
    <Path d="M12.7 11.9L3.1 2.3c.3-.3.8-.3 1.4 0l8.2 4.7-3-4.9z" fill="#00F57C" />
  </Svg>
);

const cabBuddyPromoImg = require('../../../../assets/images/cab_buddy_promo.webp');
const carpoolPromoImg = require('../../../../assets/images/carpool_promo.webp');
const offerRidePromoImg = require('../../../../assets/images/offer_ride_promo.webp');
const googlePlayBadgeImg = require('../../../../assets/images/get-it-on-google-play-badge.png');

const cabBuddyIconImg = Platform.select({
  web: require('../../../../assets/images/cab_buddy_icon.webp'),
  default: require('../../../../assets/images/cab_buddy_icon.png'),
});
const carpoolIconImg = Platform.select({
  web: require('../../../../assets/images/carpool_icon.webp'),
  default: require('../../../../assets/images/carpool_icon.png'),
});
const publicTransportIconImg = Platform.select({
  web: require('../../../../assets/images/public_transport_icon.webp'),
  default: require('../../../../assets/images/public_transport_icon.png'),
});
const offerRideIconImg = Platform.select({
  web: require('../../../../assets/images/offer_ride_icon.webp'),
  default: require('../../../../assets/images/offer_ride_icon.png'),
});
const parkingIconImg = Platform.select({
  web: require('../../../../assets/images/parking_icon.webp'),
  default: require('../../../../assets/images/parking_icon.png'),
});


export default function CommuteDashboard() {
  const queryClient = useQueryClient();
  const { enableRideSharing, enableParking } = useFeatureFlags();
  const t = lightTheme;
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const hasInitialFetched = useRef(false);
  const [showFloatingSearch, setShowFloatingSearch] = useState(false);

  const [currentLocation, setCurrentLocation] = useState<string>('Fetching location...');
  const [activeLocation, setActiveLocation] = useState<string>('Fetching location...');

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y;
    const threshold = 100;
    setShowFloatingSearch((prev) => {
      if (y >= threshold && !prev) return true;
      if (y < threshold && prev) return false;
      return prev;
    });
  }, []);

  const { data: stats, isLoading: statsLoading, refetch: refreshStats } = useQuery({
    queryKey: ['sustainability'],
    queryFn: async () => {
      const { data } = await api.get('/sustainability/me');
      return data;
    },
    staleTime: 30000,
  });

  const { data: ridesData, isLoading: ridesLoading, refetch: refreshRides } = useQuery({
    queryKey: ['rides', 'nearby', 3, activeLocation],
    queryFn: async () => {
      let url = '/rides?page=1&limit=3&radius=3000';
      try {
        const cachedActiveData = await AsyncStorage.getItem('@active_location_data');
        if (cachedActiveData) {
          const { latitude, longitude } = JSON.parse(cachedActiveData);
          if (latitude && longitude) {
            url += `&latitude=${latitude}&longitude=${longitude}`;
          }
        }
      } catch (e) {
        console.error('Failed to load active location coordinates:', e);
      }
      const { data } = await api.get(url);
      return data;
    },
    staleTime: 30000,
  });


  const { data: buddiesData, isLoading: buddiesLoading, refetch: refreshBuddies } = useQuery({
    queryKey: ['buddies', 3, activeLocation],
    queryFn: async () => {
      try {
        let url = '/matchmaking/buddies?page=1&limit=3&radius=3000';
        const cachedActiveData = await AsyncStorage.getItem('@active_location_data');
        if (cachedActiveData) {
          const { latitude, longitude } = JSON.parse(cachedActiveData);
          if (latitude && longitude) {
            url += `&latitude=${latitude}&longitude=${longitude}`;
          }
        }
        const { data } = await api.get(url);
        return data;
      } catch (err) {
        console.error('Failed to fetch buddy requests:', err);
        return [];
      }
    },
    staleTime: 30000,
  });



  const { data: savedPlaces = [], refetch: refreshSavedPlaces } = useQuery<any[]>({
    queryKey: ['saved-places'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/saved-places');
        return data;
      } catch (err) {
        console.error('Failed to fetch saved places on dashboard:', err);
        return [];
      }
    },
    staleTime: 30000,
  });

  const fetchAndStoreCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      let placeName = 'Current Location';

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

      await AsyncStorage.setItem('@current_location', placeName);
      await AsyncStorage.setItem(
        '@current_location_data',
        JSON.stringify({ address: placeName, latitude, longitude })
      );
      setCurrentLocation(placeName);

      // Also update active location if it was not explicitly selected or if it's set to "Fetching location..." or "Select Location"
      const cachedActive = await AsyncStorage.getItem('@active_location');
      if (!cachedActive || cachedActive === 'Fetching location...' || cachedActive === 'Select Location') {
        setActiveLocation(placeName);
      }
    } catch (err) {
      console.error('Failed to fetch and store current location:', err);
    }
  };

  // Load and cache current location
  useEffect(() => {
    const initLocation = async () => {
      try {
        const cachedCurrent = await AsyncStorage.getItem('@current_location');
        const cachedActive = await AsyncStorage.getItem('@active_location');
        
        if (cachedCurrent) {
          setCurrentLocation(cachedCurrent);
        }
        if (cachedActive) {
          setActiveLocation(cachedActive);
        } else if (cachedCurrent) {
          setActiveLocation(cachedCurrent);
        }

        // Fetch actual device location
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission was denied.');
          return;
        }

        await fetchAndStoreCurrentLocation();
      } catch (err) {
        console.error('Failed to load/fetch current location:', err);
      }
    };

    initLocation();
  }, []);

  const rides = ridesData || [];
  const buddies = buddiesData || [];
  const loading = statsLoading && ridesLoading && buddiesLoading && !stats && !ridesData && !buddiesData;

  const greeting = (() => {
    const d = new Date();
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5));
    const h = istTime.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshStats(), refreshRides(), refreshBuddies(), refreshSavedPlaces()]);
    } catch { } finally {
      setRefreshing(false);
    }
  }, [refreshStats, refreshRides, refreshBuddies, refreshSavedPlaces]);

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['saved-places'] });
      
      const checkLocationPerm = async () => {
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          const granted = status === 'granted';
          
          if (granted) {
            await fetchAndStoreCurrentLocation();
          }
          
          const active = await AsyncStorage.getItem('@active_location');
          if (active && active !== 'Fetching location...') {
            setActiveLocation(active);
          } else {
            if (granted) {
              const current = await AsyncStorage.getItem('@current_location');
              setActiveLocation(current || 'Fetching location...');
            } else {
              // Missing permission: show first saved place, or "Select Location"
              if (savedPlaces && savedPlaces.length > 0) {
                const firstPlace = savedPlaces[0].name || savedPlaces[0].address || 'Select Location';
                setActiveLocation(firstPlace);
              } else {
                setActiveLocation('Select Location');
              }
            }
          }
        } catch (err) {
          console.error('[DASHBOARD] Location check error:', err);
        }
      };

      checkLocationPerm();

      if (hasInitialFetched.current) {
        queryClient.invalidateQueries({ queryKey: ['sustainability'] });
        queryClient.invalidateQueries({ queryKey: ['rides'] });
        queryClient.invalidateQueries({ queryKey: ['buddies'] });
      } else {
        hasInitialFetched.current = true;
      }
    }, [queryClient, savedPlaces])
  );

  const nearbyRides = (rides || []).slice(0, 3);
  const buddiesList = (buddies || []).slice(0, 3);

  const { width: screenWidth } = Dimensions.get('window');
  const contentWidth = Math.min(screenWidth, 600);
  const containerWidth = contentWidth - spacing.lg * 2;
  const promoCardWidth = Math.min(containerWidth * 0.85, 340);

  const hasMultipleNearby = nearbyRides.length > 1;
  const nearbyCardWidth = hasMultipleNearby ? containerWidth * 0.95 : containerWidth;

  const hasMultipleBuddies = buddiesList.length > 1;
  const buddiesCardWidth = hasMultipleBuddies ? containerWidth * 0.95 : containerWidth;

  const handleOfferRide = () => {
    tap();
    if (!user?.vehicle) {
      Alert.alert(
        'Vehicle Required',
        'To offer a ride, you must register your vehicle first.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Register Now',
            onPress: () => {
              tap();
              router.push({
                pathname: '/commute/vehicles' as any,
                params: { redirectAfter: 'offer-ride' },
              });
            },
          },
        ]
      );
    } else {
      router.push({ pathname: '/commute/search' as any, params: { mode: 'offer', feature: 'offer', hideTabs: 'true' } });
    }
  };

  const handleBuddyPress = (buddy: any) => {
    tap();
    let origin_lat, origin_lng, dest_lat, dest_lng;
    if (buddy.startPointGeoJson) {
      try { const p = typeof buddy.startPointGeoJson === 'string' ? JSON.parse(buddy.startPointGeoJson) : buddy.startPointGeoJson; origin_lng = p.coordinates[0]; origin_lat = p.coordinates[1]; } catch {}
    }
    if (buddy.endPointGeoJson) {
      try { const p = typeof buddy.endPointGeoJson === 'string' ? JSON.parse(buddy.endPointGeoJson) : buddy.endPointGeoJson; dest_lng = p.coordinates[0]; dest_lat = p.coordinates[1]; } catch {}
    }
    router.push({
      pathname: `/buddy/${buddy.id}` as any,
      params: {
        fromName: buddy.startPlaceName,
        toName: buddy.endPlaceName,
        fromLat: origin_lat ? String(origin_lat) : undefined,
        fromLng: origin_lng ? String(origin_lng) : undefined,
        toLat: dest_lat ? String(dest_lat) : undefined,
        toLng: dest_lng ? String(dest_lng) : undefined,
      }
    });
  };

  const handleParkingPress = () => {
    tap();
    Alert.alert(
      'Smart Parking Availability',
      'This service is currently available only in selected partner societies and office complexes. Digital layout maps for each society are currently under progress.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Proceed',
          onPress: () => {
            tap();
            router.push('/parking' as any);
          },
        },
      ]
    );
  };

  const services = [
    {
      label: 'Share a Cab',
      icon: cabBuddyIconImg,
      onPress: () => router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'buddy', hideTabs: 'true' } }),
    },
    {
      label: 'Car Pooling',
      icon: carpoolIconImg,
      onPress: () => router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'carpool', hideTabs: 'true' } }),
    },
    {
      label: 'Parking',
      icon: parkingIconImg,
      onPress: handleParkingPress,
    },
    {
      label: 'Offer Ride',
      icon: offerRideIconImg,
      onPress: handleOfferRide,
    },
  ];

  const isDark = false;

  const showEmptyState = !loading && nearbyRides.length === 0 && buddies.length === 0;

  const promoCards = [
    {
      title: 'Share a Cab',
      description: 'Matches two people going to the same route so they can book a cab and split the fare.',
      image: cabBuddyPromoImg,
      buttonLabel: 'Share a Cab',
      onPress: () => {
        router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'buddy', hideTabs: 'true' } });
      },
    },
    {
      title: 'Car Pooling',
      description: 'Going to some place? Request nearby, pool in with your neighbour going on the same route.',
      image: carpoolPromoImg,
      buttonLabel: 'Find Carpool',
      onPress: () => {
        router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'carpool', hideTabs: 'true' } });
      },
    },
    {
      title: 'Offer a Ride',
      description: 'Register your vehicle, share your empty seats with others heading your way, and split travel costs.',
      image: offerRidePromoImg,
      buttonLabel: 'Offer Ride',
      onPress: handleOfferRide,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: t.background }}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: 120,
          paddingTop: 24,
          maxWidth: 600,
          width: '100%',
          alignSelf: 'center',
        }}
        refreshControl={Platform.OS !== 'web' ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.textPrimary} /> : undefined}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Top Header Row: Location on Left, Profile + Refresh on Right */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md, zIndex: 100 }}>
          <TouchableOpacity
            testID="location-selector"
            onPress={() => {
              tap();
              router.push({ pathname: '/commute/saved-places' as any, params: { selectMode: 'true' } });
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <MapPin size={16} color={t.primary} style={{ marginRight: spacing.xs }} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: t.textPrimary,
                marginRight: spacing.xs,
                maxWidth: contentWidth * 0.5,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {activeLocation}
            </Text>
            <ChevronDown size={14} color={t.textSecondary} />
          </TouchableOpacity>


        </View>

        {/* Greeting & Header Subtitle */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[styles.greet, { color: t.textSecondary }]}>{greeting}</Text>
          <Text style={[styles.title, { color: t.textPrimary, marginBottom: 0 }]}>Where to today?</Text>
        </View>

        {/* Quick search */}
        <View style={{ backgroundColor: t.background, paddingTop: spacing.sm, paddingBottom: spacing.sm, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg, zIndex: 99, opacity: showFloatingSearch ? 0 : 1 }}>
          <TouchableOpacity
            testID="home-search-bar"
            onPress={() => { tap(); router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'main', hideTabs: 'true' } }); }}
            activeOpacity={0.7}
            style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <SearchIcon color={t.textSecondary} size={18} />
            <Text style={[styles.searchText, { color: t.textSecondary }]}>Search destination…</Text>
          </TouchableOpacity>
        </View>

        {/* Services Grid */}
        <View style={styles.actions}>
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <TouchableOpacity
                key={s.label}
                testID={`action-${s.label}`}
                onPress={() => { tap(); s.onPress(); }}
                activeOpacity={0.75}
                style={styles.actionCard}
              >
                <View style={styles.actionIconContainer}>
                  <Image source={Icon} style={styles.actionIconImage} resizeMode="cover" />
                </View>
                <Text style={[styles.actionLabel, { color: t.textPrimary }]}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>




        {/* Rides Near You */}
        {(loading || (nearbyRides && nearbyRides.length > 0)) && (
          <>
            <SectionHeader t={t} title="Rides Near You" actionLabel="See all" onAction={() => router.push({ pathname: '/commute/search' as any, params: { showAll: 'true', hideTabs: 'true' } })} />
            {loading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              >
                <Shimmer style={{ width: nearbyCardWidth, height: 150, borderRadius: radius.lg }} />
                <Shimmer style={{ width: nearbyCardWidth, height: 150, borderRadius: radius.lg }} />
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={nearbyCardWidth + 12}
                snapToAlignment="start"
                style={{ marginHorizontal: -spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              >
                {nearbyRides.map((r: any) => (
                  <NearbyRideCard
                    key={r.id}
                    ride={r}
                    t={t}
                    testID={`home-ride-${r.id}`}
                    onPress={() => {
                      tap();
                      let origin_lat, origin_lng, dest_lat, dest_lng;
                      if (r.startPointGeoJson) {
                        try { const p = typeof r.startPointGeoJson === 'string' ? JSON.parse(r.startPointGeoJson) : r.startPointGeoJson; origin_lng = p.coordinates[0]; origin_lat = p.coordinates[1]; } catch {}
                      }
                      if (r.endPointGeoJson) {
                        try { const p = typeof r.endPointGeoJson === 'string' ? JSON.parse(r.endPointGeoJson) : r.endPointGeoJson; dest_lng = p.coordinates[0]; dest_lat = p.coordinates[1]; } catch {}
                      }
                      router.push({
                        pathname: `/ride/${r.id}` as any,
                        params: {
                          fromName: r.startPlaceName || r.origin,
                          toName: r.endPlaceName || r.destination,
                          fromLat: origin_lat ? String(origin_lat) : undefined,
                          fromLng: origin_lng ? String(origin_lng) : undefined,
                          toLat: dest_lat ? String(dest_lat) : undefined,
                          toLng: dest_lng ? String(dest_lng) : undefined,
                        }
                      });
                    }}
                    style={{ width: nearbyCardWidth }}
                  />
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* Buddies Seeking Rides */}
        {(loading || (buddiesList && buddiesList.length > 0)) && (
          <>
            <SectionHeader 
              t={t} 
              title={buddiesList.length === 1 ? "Buddy Seeking Ride" : "Buddies Seeking Rides"} 
              actionLabel="See all" 
              onAction={() => router.push('/commute/buddies-seeking')} 
            />
            {loading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              >
                <Shimmer style={{ width: buddiesCardWidth, height: 150, borderRadius: radius.lg }} />
                <Shimmer style={{ width: buddiesCardWidth, height: 150, borderRadius: radius.lg }} />
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={buddiesCardWidth + 12}
                snapToAlignment="start"
                style={{ marginHorizontal: -spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              >
                {buddiesList.map((b: any) => (
                  <BuddyCard
                    key={b.id}
                    buddy={b}
                    t={t}
                    onPress={() => handleBuddyPress(b)}
                    style={{ width: buddiesCardWidth }}
                  />
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* Onboarding / Feature Suggestions */}
        <View style={styles.promoContainer}>
          <Text style={[styles.promoSectionTitle, { color: t.textPrimary }]}>Explore Aroundly Features</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={promoCardWidth + 16}
            snapToAlignment="start"
            style={{ marginHorizontal: -spacing.lg, marginTop: spacing.xs }}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 16 }}
          >
            {promoCards.map((card, idx) => (
              <View
                key={idx}
                style={[
                  styles.promoCard,
                  {
                    backgroundColor: t.surface,
                    borderColor: t.border,
                    width: promoCardWidth,
                  }
                ]}
              >
                <Image
                  source={card.image}
                  style={styles.promoImage}
                  resizeMode="cover"
                />
                <View style={styles.promoContent}>
                  <Text style={[styles.promoTitle, { color: t.textPrimary }]}>{card.title}</Text>
                  <Text style={[styles.promoDesc, { color: t.textSecondary }]}>{card.description}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => { tap(); card.onPress(); }}
                    style={[styles.promoButton, { backgroundColor: t.primary }]}
                  >
                    <Text style={styles.promoButtonText}>{card.buttonLabel}</Text>
                    <ChevronRight color="#FFFFFF" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Impact stats */}
        <View style={[styles.impact, { backgroundColor: t.successBg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Leaf color={t.success} size={16} />
            <Text style={[styles.impactTitle, { color: t.success }]}>Your Green Impact</Text>
            <Text style={[styles.impactMonth, { color: t.success, opacity: 0.7 }]}>· This month</Text>
          </View>
          {(stats?.rides_count ?? 0) === 0 ? (
            <Text style={[styles.impactPlaceholder, { color: t.success, opacity: 0.8 }]}>
              No rides shared yet. Start carpooling or offering rides to track your CO₂ savings and split travel costs!
            </Text>
          ) : (
            <View style={styles.impactRow}>
              <ImpactStat label="Rides Shared" value={`${stats?.rides_count ?? 0}`} t={t} />
              <View style={[styles.impactDivider, { backgroundColor: t.success, opacity: 0.15 }]} />
              <ImpactStat label="CO₂ Saved" value={`${stats?.co2_saved_kg?.toFixed(1) ?? '0.0'}kg`} t={t} />
              <View style={[styles.impactDivider, { backgroundColor: t.success, opacity: 0.15 }]} />
              <ImpactStat label="Money Saved" value={`₹${stats?.money_saved?.toFixed(0) ?? '0'}`} t={t} testID="money-saved" />
            </View>
          )}
        </View>

        {/* Play Store download option for web users */}
        {Platform.OS === 'web' && (
          <View style={[styles.downloadBanner, { backgroundColor: t.successBg, borderColor: t.border }]}>
            <View style={styles.downloadBannerLeft}>
              <Text style={[styles.downloadBannerTitle, { color: t.textPrimary }]}>
                Experience Aroundly on Android
              </Text>
              <Text style={[styles.downloadBannerDesc, { color: t.textSecondary }]}>
                Get real-time commute updates, cab buddy match notifications, and offline access by downloading our app directly from the Google Play Store.
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                tap();
                Linking.openURL('https://play.google.com/store/apps/details?id=com.bpandey690.frontend');
              }}
            >
              <Image
                source={googlePlayBadgeImg}
                style={{ width: 135, height: 40 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Floating Sticky Search Bar (Positioned outside ScrollView, resolving Android touch bugs) */}
      {showFloatingSearch && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: t.background,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
            paddingHorizontal: spacing.lg,
            zIndex: 999,
          }}
        >
          <TouchableOpacity
            testID="floating-home-search-bar"
            onPress={() => { tap(); router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'main', hideTabs: 'true' } }); }}
            activeOpacity={0.7}
            style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.border }]}
          >
            <SearchIcon color={t.textSecondary} size={18} />
            <Text style={[styles.searchText, { color: t.textSecondary }]}>Search destination…</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const SectionHeader: React.FC<{ t: Theme; title: string; actionLabel?: string; onAction?: () => void }> = ({ t, title, actionLabel, onAction }) => (
  <View style={styles.sectionHeader}>
    <Text style={[styles.sectionTitle, { color: t.textPrimary }]}>{title}</Text>
    {actionLabel ? (
      <TouchableOpacity onPress={() => { tap(); onAction?.(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
        <Text style={[styles.sectionAction, { color: t.textPrimary }]}>{actionLabel}</Text>
        <ChevronRight color={t.textPrimary} size={14} />
      </TouchableOpacity>
    ) : null}
  </View>
);

const ImpactStat: React.FC<{ label: string; value: string; t: Theme; testID?: string }> = ({ label, value, t, testID }) => (
  <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
    <Text testID={testID} style={[styles.impactValue, { color: t.success }]}>{value}</Text>
    <Text style={[styles.impactLabel, { color: t.success, opacity: 0.75 }]}>{label}</Text>
  </View>
);

// BuddyCard is now imported as a separate component from ../components/BuddyCard

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  greet: { fontSize: 13, marginTop: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.8, marginTop: 2, marginBottom: spacing.lg },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1 },
  searchText: { fontSize: 15 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xl, marginBottom: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  sectionAction: { fontSize: 13, fontWeight: '600' },
  upcomingCard: { padding: spacing.md, borderRadius: radius.lg, gap: 14 },
  upcomingName: { fontSize: 15, fontWeight: '600' },
  upcomingMeta: { fontSize: 12 },
  todayPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9999 },
  todayText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  upcomingRoute: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)' },
  upcomingLoc: { fontSize: 13, fontWeight: '500' },
  upcomingPrice: { fontSize: 16, fontWeight: '700' },
  impact: { marginTop: spacing.xl, padding: spacing.md, borderRadius: radius.lg, gap: 12 },
  impactTitle: { fontSize: 14, fontWeight: '700' },
  impactMonth: { fontSize: 12, fontWeight: '500' },
  impactRow: { flexDirection: 'row', alignItems: 'center' },
  impactDivider: { width: 1, height: 32, marginHorizontal: 4 },
  impactValue: { fontSize: 18, fontWeight: '700' },
  impactLabel: { fontSize: 11, fontWeight: '500' },
  impactPlaceholder: { fontSize: 13, fontWeight: '500', lineHeight: 18, marginTop: 4 },
  actionIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  promoContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  promoSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: spacing.md,
  },
  promoCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  promoImage: {
    width: '100%',
    height: 140,
  },
  promoContent: {
    padding: spacing.md,
    gap: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  promoDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
  promoButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  downloadBanner: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
  },
  downloadBannerLeft: {
    flex: 1,
    minWidth: 260,
    gap: 4,
  },
  downloadBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  downloadBannerDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  googlePlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 12,
    alignSelf: 'flex-start',
  },
  googlePlayBadgeTextContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  googlePlayBadgeSub: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  googlePlayBadgeMain: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: -2,
  },
});
