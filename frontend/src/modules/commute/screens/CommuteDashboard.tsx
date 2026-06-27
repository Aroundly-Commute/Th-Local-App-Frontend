import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme,
  RefreshControl, Dimensions, Platform, ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  MapPin, Users, Calendar, Leaf, Search as SearchIcon,
  ChevronRight, Star, Clock, RefreshCw, ChevronDown, Home, Briefcase,
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
import { useQuery } from '@tanstack/react-query';
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

const cabBuddyPromoImg = require('../../../../assets/images/cab_buddy_promo.png');
const carpoolPromoImg = require('../../../../assets/images/carpool_promo.png');
const offerRidePromoImg = require('../../../../assets/images/offer_ride_promo.png');

const cabBuddyIconImg = require('../../../../assets/images/cab_buddy_icon.png');
const carpoolIconImg = require('../../../../assets/images/carpool_icon.png');
const publicTransportIconImg = require('../../../../assets/images/public_transport_icon.png');
const offerRideIconImg = require('../../../../assets/images/offer_ride_icon.png');

export default function CommuteDashboard() {
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
    }
  });

  const { data: ridesData, isLoading: ridesLoading, refetch: refreshRides } = useQuery({
    queryKey: ['rides', 'nearby', 3],
    queryFn: async () => {
      const { data } = await api.get('/rides?page=1&limit=3');
      return data;
    }
  });

  const { data: myRidesData, isLoading: myRidesLoading, refetch: refreshMyRides } = useQuery({
    queryKey: ['rides', 'my', 3],
    queryFn: async () => {
      const { data } = await api.get('/rides/my?page=1&limit=3');
      return data;
    }
  });

  const { data: buddiesData, isLoading: buddiesLoading, refetch: refreshBuddies } = useQuery({
    queryKey: ['buddies', 3],
    queryFn: async () => {
      try {
        const { data } = await api.get('/matchmaking/buddies?page=1&limit=3');
        return data;
      } catch (err) {
        console.error('Failed to fetch buddy requests:', err);
        return [];
      }
    }
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
    }
  });

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
        setCurrentLocation(placeName);

        // If active location was never explicitly selected, update active location to current
        const checkActive = await AsyncStorage.getItem('@active_location');
        if (!checkActive) {
          setActiveLocation(placeName);
        }

      } catch (err) {
        console.error('Failed to load/fetch current location:', err);
      }
    };

    initLocation();
  }, []);

  const rides = ridesData || [];
  const myRides = myRidesData || { upcoming: [] };
  const buddies = buddiesData || [];
  const loading = statsLoading && ridesLoading && myRidesLoading && buddiesLoading && !stats && !ridesData && !myRidesData && !buddiesData;

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
      await Promise.all([refreshStats(), refreshRides(), refreshMyRides(), refreshBuddies(), refreshSavedPlaces()]);
    } catch { } finally {
      setRefreshing(false);
    }
  }, [refreshStats, refreshRides, refreshMyRides, refreshBuddies, refreshSavedPlaces]);

  useFocusEffect(
    useCallback(() => {
      refreshSavedPlaces().catch(() => {});
      
      AsyncStorage.getItem('@active_location').then((active) => {
        if (active) {
          setActiveLocation(active);
        } else {
          AsyncStorage.getItem('@current_location').then((current) => {
            if (current) {
              setActiveLocation(current);
            }
          });
        }
      }).catch((err) => console.error('Failed to load active location:', err));

      if (hasInitialFetched.current) {
        refreshStats().catch(() => { });
        refreshRides().catch(() => { });
        refreshMyRides().catch(() => { });
        refreshBuddies().catch(() => { });
      } else {
        hasInitialFetched.current = true;
      }
    }, [refreshStats, refreshRides, refreshMyRides, refreshBuddies, refreshSavedPlaces])
  );

  const upcomingRides = (myRides.upcoming || []).slice(0, 3);
  const requestedRides = (myRides.requested || []).slice(0, 3);
  const nearbyRides = (rides || []).slice(0, 3);
  const buddiesList = (buddies || []).slice(0, 3);

  const { width: screenWidth } = Dimensions.get('window');
  const containerWidth = screenWidth - spacing.lg * 2;

  const hasMultipleUpcoming = upcomingRides.length > 1;
  const upcomingCardWidth = hasMultipleUpcoming ? containerWidth * 0.95 : containerWidth;

  const hasMultipleRequested = requestedRides.length > 1;
  const requestedCardWidth = hasMultipleRequested ? containerWidth * 0.95 : containerWidth;

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
    router.push(`/buddy/${buddy.id}` as any);
  };

  const services = [
    {
      label: 'Cab Buddy',
      icon: cabBuddyIconImg,
      onPress: () => router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'buddy', hideTabs: 'true' } }),
    },
    {
      label: 'Car Pooling',
      icon: carpoolIconImg,
      onPress: () => router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'carpool', hideTabs: 'true' } }),
    },
    {
      label: 'Public Transport',
      icon: publicTransportIconImg,
      onPress: () => router.push('/commute/public-transport' as any),
    },
    {
      label: 'Offer Ride',
      icon: offerRideIconImg,
      onPress: handleOfferRide,
    },
  ];

  const isDark = false;

  const showEmptyState = !loading && upcomingRides.length === 0 && nearbyRides.length === 0 && buddies.length === 0;

  const promoCards = [
    {
      title: 'Cab Buddy',
      description: 'Matches two strangers going to the same route so they can book a cab and split the fare.',
      image: cabBuddyPromoImg,
      buttonLabel: 'Find Cab Buddy',
      onPress: () => {
        router.push({ pathname: '/commute/search' as any, params: { mode: 'find', feature: 'buddy', hideTabs: 'true' } });
      },
    },
    {
      title: 'Car Pooling',
      description: 'Going to some place with a vacant seat? Let your acquaintances pool in to save money, energy, and make better bonds.',
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
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: 24 }}
        refreshControl={Platform.OS !== 'web' ? <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.textPrimary} /> : undefined}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Location Selector */}
        <View style={{ marginBottom: spacing.md, zIndex: 100 }}>
          <TouchableOpacity
            testID="location-selector"
            onPress={() => {
              tap();
              router.push('/commute/saved-places' as any);
            }}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
            }}
          >
            <MapPin size={16} color={t.primary} style={{ marginRight: spacing.xs }} />
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: t.textPrimary,
                marginRight: spacing.xs,
                width: screenWidth * 0.4,
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {activeLocation}
            </Text>
            <ChevronDown size={14} color={t.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Greeting & Header Sync for Web */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greet, { color: t.textSecondary }]}>{greeting}</Text>
            <Text style={[styles.title, { color: t.textPrimary, marginBottom: 0 }]}>Where to today?</Text>
          </View>
          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              activeOpacity={0.7}
              style={{
                padding: 10,
                borderRadius: 20,
                backgroundColor: t.muted,
                borderColor: t.border,
                borderWidth: 1,
                justifyContent: 'center',
                alignItems: 'center',
                width: 40,
                height: 40,
              }}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color={t.primary} />
              ) : (
                <RefreshCw color={t.textPrimary} size={16} />
              )}
            </TouchableOpacity>
          )}
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


        {/* Upcoming ride */}
        {upcomingRides.length > 0 && (
          <>
            <SectionHeader t={t} title="Upcoming Rides" actionLabel="See all" onAction={() => router.push('/commute/rides')} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={upcomingCardWidth + 12}
              snapToAlignment="start"
              style={{ marginHorizontal: -spacing.lg }}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
            >
              {upcomingRides.map((rideItem: any) => (
                <UpcomingRideCard
                  key={rideItem.id}
                  ride={rideItem}
                  t={t}
                  testID={`home-upcoming-${rideItem.id}`}
                  onPress={() => { tap(); router.push(`/ride/${rideItem.id}` as any); }}
                  style={{ width: upcomingCardWidth }}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* My Requested rides */}
        {(loading || (requestedRides && requestedRides.length > 0)) && (
          <>
            <SectionHeader t={t} title="My Requested Rides" actionLabel="See all" onAction={() => router.push('/commute/rides?tab=requested')} />
            {loading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              >
                <Shimmer style={{ width: requestedCardWidth, height: 150, borderRadius: radius.lg }} />
                <Shimmer style={{ width: requestedCardWidth, height: 150, borderRadius: radius.lg }} />
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                snapToInterval={requestedCardWidth + 12}
                snapToAlignment="start"
                style={{ marginHorizontal: -spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: 12 }}
              >
                {requestedRides.map((r: any) => (
                  <RequestedRideCard
                    key={r.id}
                    ride={r}
                    t={t}
                    testID={`home-requested-${r.id}`}
                    onPress={() => {
                      tap();
                      if (r.isBuddyRequest) {
                        router.push(`/buddy/${r.id}` as any);
                      } else {
                        router.push(`/ride/${r.id}` as any);
                      }
                    }}
                    style={{ width: requestedCardWidth }}
                  />
                ))}
              </ScrollView>
            )}
          </>
        )}

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
                    onPress={() => { tap(); router.push(`/ride/${r.id}` as any); }}
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
            snapToInterval={containerWidth * 0.85 + 16}
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
                    width: containerWidth * 0.85,
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
});
