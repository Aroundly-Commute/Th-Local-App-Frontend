import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';

import { RouteMap } from '../../src/modules/commute/components/RouteMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Leaf, Users, Clock } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { formatISTDate, formatISTTime } from '../../src/core/utils/datetime';

function parseCoords(geoJson: any, latProp?: any, lngProp?: any, fallbackLatStr?: string, fallbackLngStr?: string) {
  let lat: number | undefined;
  let lng: number | undefined;
  if (geoJson) {
    try {
      const obj = typeof geoJson === 'string' ? JSON.parse(geoJson) : geoJson;
      if (obj && Array.isArray(obj.coordinates) && obj.coordinates.length >= 2) {
        lng = Number(obj.coordinates[0]);
        lat = Number(obj.coordinates[1]);
      }
    } catch {}
  }
  if ((lat === undefined || isNaN(lat)) && latProp !== undefined) lat = Number(latProp);
  if ((lng === undefined || isNaN(lng)) && lngProp !== undefined) lng = Number(lngProp);
  if ((lat === undefined || isNaN(lat)) && fallbackLatStr) lat = parseFloat(fallbackLatStr);
  if ((lng === undefined || isNaN(lng)) && fallbackLngStr) lng = parseFloat(fallbackLngStr);

  return { lat: (lat && !isNaN(lat)) ? lat : undefined, lng: (lng && !isNaN(lng)) ? lng : undefined };
}

export default function BuddyDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{ id: string; rideId?: string; mode?: string }>();
  const id = params.id;
  const rideId = params.rideId;
  const viewMode = params.mode;

  const [updating, setUpdating] = useState(false);

  const { data: buddy, isLoading } = useQuery({
    queryKey: ['buddy', id],
    queryFn: async () => {
      const { data } = await api.get(`/matchmaking/buddies/${id}`);
      return data;
    },
    enabled: Boolean(id),
  });

  if (isLoading || !buddy) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={t.primary} size="large" />
      </SafeAreaView>
    );
  }

  const riderName = buddy.rider?.name || 'Passenger';
  const riderAvatar = buddy.rider?.profilePic;
  const riderRating = buddy.rider_rating ?? buddy.riderRating ?? buddy.rider?.rating ?? 5.0;
  const origin = buddy.startPlaceName || 'Unknown';
  const destination = buddy.endPlaceName || 'Unknown';
  const isOwnRequest = user?.id === buddy.riderId;
  const time = new Date(buddy.startTime);

  const startCoords = parseCoords(buddy.startPointGeoJson, (buddy as any).startLat || (buddy as any).start_lat, (buddy as any).startLng || (buddy as any).start_lng);
  const endCoords = parseCoords(buddy.endPointGeoJson, (buddy as any).endLat || (buddy as any).end_lat, (buddy as any).endLng || (buddy as any).end_lng);
  const origin_lat = startCoords.lat;
  const origin_lng = startCoords.lng;
  const dest_lat = endCoords.lat;
  const dest_lng = endCoords.lng;

  const dist = buddy.distance_km ?? 0;
  const co2 = buddy.co2_saved_kg ?? 0;

  const handleWithdrawRequest = async () => {
    tap();
    Alert.alert(
      'Withdraw Request',
      'Are you sure you want to withdraw your ride request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Withdraw',
          style: 'destructive',
          onPress: async () => {
            tap();
            setUpdating(true);
            try {
              await api.patch(`/matchmaking/buddies/${id}`, { status: 'CANCELLED' });
              success();
              Alert.alert('Withdrawn', 'Your request has been withdrawn.');
              router.push('/(tabs)/rides' as any);
            } catch (err: any) {
              errorH();
              Alert.alert('Error', err?.response?.data?.message || 'Failed to withdraw request.');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleOfferRide = async () => {
    if (!buddy?.riderId || !user?.id || updating) return;
    tap();
    setUpdating(true);
    try {
      // 1. Check vehicle registration
      let vehicleData: any = null;
      try {
        const { data } = await api.get('/auth/vehicle');
        vehicleData = data;
      } catch {}

      if (!vehicleData || !vehicleData.vehicleNumber || !vehicleData.vehicleNumber.trim()) {
        errorH();
        setUpdating(false);
        Alert.alert(
          'Vehicle Registration Required',
          'Please register your vehicle details before offering a ride to passengers.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Register Vehicle',
              onPress: () => router.push(`/commute/vehicles?redirectAfter=/buddy/${id}` as any),
            },
          ]
        );
        return;
      }

      // 2. Check if driver has an existing active ride, or create a new ride offer with registered vehicle
      let targetRideId: string | null = null;
      try {
        const { data: myRidesData } = await api.get('/rides/my?page=1&limit=10');
        const activeOfferedRide = (myRidesData?.upcoming || []).find((r: any) => (r.role === 'driver' || r.driverId === user?.id) && r.status === 'OPEN');
        if (activeOfferedRide) {
          targetRideId = activeOfferedRide.id;
        }
      } catch {}

      if (!targetRideId) {
        const rawDate = buddy.startTime || buddy.riderStartTime || (buddy as any).start_time;
        const parsedDate = rawDate ? new Date(rawDate) : new Date(Date.now() + 15 * 60 * 1000);
        const validDate = (parsedDate && !isNaN(parsedDate.getTime())) ? parsedDate : new Date(Date.now() + 15 * 60 * 1000);

        const dateStr = validDate.toISOString().split('T')[0];
        const hoursStr = String(validDate.getHours()).padStart(2, '0');
        const minsStr = String(validDate.getMinutes()).padStart(2, '0');
        const timeStr = `${hoursStr}:${minsStr}`;

        const sCoords = (origin_lng !== undefined && origin_lat !== undefined && !isNaN(origin_lng) && !isNaN(origin_lat))
          ? [origin_lng, origin_lat]
          : undefined;
        const eCoords = (dest_lng !== undefined && dest_lat !== undefined && !isNaN(dest_lng) && !isNaN(dest_lat))
          ? [dest_lng, dest_lat]
          : undefined;

        const newRidePayload = {
          startName: buddy.startPlaceName || 'Pickup Location',
          endName: buddy.endPlaceName || 'Dropoff Location',
          startPlaceName: buddy.startPlaceName || 'Pickup Location',
          endPlaceName: buddy.endPlaceName || 'Dropoff Location',
          startCoords: sCoords,
          endCoords: eCoords,
          date: dateStr,
          time: timeStr,
          startTime: validDate.toISOString(),
          endTime: new Date(validDate.getTime() + 60 * 60 * 1000).toISOString(),
          seatsAvailable: vehicleData.capacity ? Math.max(1, vehicleData.capacity - 1) : 3,
          chargeCents: 1000,
          vehicleType: vehicleData.type || 'CAR',
          vehicleCapacity: vehicleData.capacity || 5,
          fuelType: vehicleData.fuelType || 'Petrol',
          vehicleNumber: vehicleData.vehicleNumber,
          role: 'OFFERED',
        };
        const { data: newRide } = await api.post('/rides/offer', newRidePayload);
        targetRideId = newRide.id;
      }

      const sCoords = (origin_lng !== undefined && origin_lat !== undefined && !isNaN(origin_lng) && !isNaN(origin_lat)) ? [origin_lng, origin_lat] : undefined;
      const eCoords = (dest_lng !== undefined && dest_lat !== undefined && !isNaN(dest_lng) && !isNaN(dest_lat)) ? [dest_lng, dest_lat] : undefined;

      await api.post('/matchmaking/invite', {
        rideId: targetRideId,
        buddyRequestId: id,
        riderStartName: buddy.startPlaceName,
        riderEndName: buddy.endPlaceName,
        riderStartCoords: sCoords,
        riderEndCoords: eCoords,
      });
      success();
      Alert.alert(
        'Ride Offer Sent!',
        `Your ride offer has been successfully sent to ${riderName}. You can track this under your Requests page.`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)/rides' as any) }]
      );
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send ride offer.');
    } finally {
      setUpdating(false);
    }
  };

  const handleOfferCab = async () => {
    if (!buddy?.riderId || !user?.id || updating) return;
    tap();
    setUpdating(true);
    try {
      await api.post('/matchmaking/buddies/request', { buddyRequestId: id });
      success();
      Alert.alert(
        'Request Sent',
        `Your request to book a cab with ${riderName} has been successfully sent. You can track this request on your Requests page.`,
        [{ text: 'OK', onPress: () => router.push('/(tabs)/rides' as any) }]
      );
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send cab match request.');
    } finally {
      setUpdating(false);
    }
  };

  const handleInviteBuddy = async () => {
    if (!rideId || updating) return;
    tap();
    setUpdating(true);
    try {
      await api.post('/matchmaking/invite', { rideId, buddyRequestId: id });
      success();
      Alert.alert(
        'Success',
        'Your ride offer has been successfully sent to the passenger!',
        [{ text: 'OK', onPress: () => router.push('/(tabs)' as any) }]
      );
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add passenger to ride.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title={isOwnRequest ? "My Seeking Request" : "Seeking Ride Detail"} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Fixed Map */}
        <View style={{ height: 220, width: '100%', borderRadius: radius.lg, overflow: 'hidden', marginVertical: spacing.md, borderWidth: 1, borderColor: t.border }}>
          <RouteMap
            origin={{ lat: origin_lat ?? 0, lng: origin_lng ?? 0, name: origin }}
            destination={{ lat: dest_lat ?? 0, lng: dest_lng ?? 0, name: destination }}
            t={t}
            style={{ height: '100%', width: '100%' }}
          />
        </View>

        {/* Passenger Card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                tap();
                router.push(`/user/${buddy.riderId}` as any);
              }}
              activeOpacity={0.8}
              style={{ borderRadius: 9999, borderWidth: 2, borderColor: '#E5E7EB' }}
            >
              <VerifiedAvatar uri={riderAvatar} name={riderName} verified={false} t={t} size={44} />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary }} numberOfLines={1}>{riderName}</Text>
                {buddy.rider?.gender && (
                  <Text style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                    ({buddy.rider.gender})
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Star color="#FBBF24" size={12} fill="#FBBF24" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: t.textSecondary }}>{riderRating % 1 === 0 ? riderRating.toFixed(0) : riderRating.toFixed(1)}</Text>
                <Text style={{ fontSize: 12, color: t.textTertiary }}>·</Text>
                <Users color={t.textSecondary} size={12} style={{ marginRight: -2 }} />
                <Text style={{ fontSize: 13, color: t.textSecondary }}>
                  {buddy.seatsNeeded ?? 1} { (buddy.seatsNeeded ?? 1) === 1 ? 'seat' : 'seats' } needed
                </Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                {formatISTDate(buddy.startTime)}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Clock color={t.textSecondary} size={11} />
                <Text style={{ fontSize: 12, color: t.textSecondary }}>
                  {formatISTTime(buddy.startTime)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Route Card */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={{ alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
              <View style={[styles.dot, { backgroundColor: t.primary }]} />
              <View style={{ width: 2, flex: 1, backgroundColor: t.border, marginVertical: 4 }} />
              <View style={[styles.dot, { backgroundColor: t.error }]} />
            </View>
            <View style={{ flex: 1, gap: 16 }}>
              <View>
                <Text style={[styles.label, { color: t.textSecondary }]}>PICKUP</Text>
                <Text style={[styles.loc, { color: t.textPrimary }]}>{origin}</Text>
              </View>
              <View>
                <Text style={[styles.label, { color: t.textSecondary }]}>DROPOFF</Text>
                <Text style={[styles.loc, { color: t.textPrimary }]}>{destination}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Impact */}
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Leaf color={t.success} size={18} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary }}>CO₂ Savings</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: t.success }}>{(co2 || 0).toFixed(1)} kg</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: t.surface, borderColor: t.border, paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        {buddy.status === 'CANCELLED' ? (
          <View style={[styles.cta, { backgroundColor: t.muted, width: '100%' }]}>
            <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: '700' }}>Request Withdrawn</Text>
          </View>
        ) : isOwnRequest ? (
          <TouchableOpacity
            onPress={handleWithdrawRequest}
            disabled={updating}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: '#ffffff', borderColor: '#ef4444', borderWidth: 1, width: '100%', opacity: updating ? 0.6 : 1 }]}
          >
            {updating ? <ActivityIndicator color="#ef4444" /> : (
              <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700' }}>Withdraw Buddy Request</Text>
            )}
          </TouchableOpacity>
        ) : rideId ? (
          <TouchableOpacity
            onPress={handleInviteBuddy}
            disabled={updating}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary, width: '100%', opacity: updating ? 0.6 : 1 }]}
          >
            {updating ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Send Ride Offer</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'column', gap: 10, width: '100%' }}>
            <TouchableOpacity
              onPress={handleOfferRide}
              disabled={updating}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: t.primary, width: '100%', opacity: updating ? 0.6 : 1 }]}
            >
              {updating ? <ActivityIndicator color={t.primaryContrast} /> : (
                <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Offer a Ride</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOfferCab}
              disabled={updating}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: '#10B981', width: '100%', opacity: updating ? 0.6 : 1 }]}
            >
              {updating ? <ActivityIndicator color="#fff" /> : (
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Share Cab</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loc: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  cta: {
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
