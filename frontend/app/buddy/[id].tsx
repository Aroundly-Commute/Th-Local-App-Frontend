import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, Platform, Animated, PanResponder, Dimensions } from 'react-native';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { useQuery } from '@tanstack/react-query';

import { RouteMap } from '../../src/modules/commute/components/RouteMap';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, Leaf, MessageCircle, Users, Clock } from 'lucide-react-native';
import { api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { VerifiedAvatar } from '../../src/core/components/VerifiedAvatar';
import { tap, success, errorH } from '../../src/core/utils/haptics';

export default function BuddyDetail() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const { user } = useAuth();
  
  const params = useLocalSearchParams<{ id: string; rideId?: string; mode?: string }>();
  const id = params.id;
  const rideId = params.rideId;
  const viewMode = params.mode;

  const [updating, setUpdating] = useState(false);

  const { height: SCREEN_HEIGHT } = Dimensions.get('window');
  const SNAP_TOP = 80;
  const SNAP_MIDDLE = SCREEN_HEIGHT * 0.45;
  const SNAP_BOTTOM = SCREEN_HEIGHT - 160;

  const lastPosition = useRef(SNAP_MIDDLE);
  const translateY = useRef(new Animated.Value(SNAP_MIDDLE)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Drag vertically only, ignore small tremors or horizontal swipes
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderGrant: () => {
        translateY.setOffset(lastPosition.current);
        translateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        const nextValue = lastPosition.current + gestureState.dy;
        if (nextValue >= SNAP_TOP) {
          translateY.setValue(gestureState.dy);
        } else {
          // Clamp at SNAP_TOP
          translateY.setValue(SNAP_TOP - lastPosition.current);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateY.flattenOffset();
        const absolutePos = lastPosition.current + gestureState.dy;

        const distTop = Math.abs(absolutePos - SNAP_TOP);
        const distMiddle = Math.abs(absolutePos - SNAP_MIDDLE);
        const distBottom = Math.abs(absolutePos - SNAP_BOTTOM);

        let target = SNAP_MIDDLE;
        const minVal = Math.min(distTop, distMiddle, distBottom);
        if (minVal === distTop) target = SNAP_TOP;
        else if (minVal === distBottom) target = SNAP_BOTTOM;

        lastPosition.current = target;
        Animated.spring(translateY, {
          toValue: target,
          useNativeDriver: true,
          damping: 20,
          stiffness: 150,
          mass: 0.6,
        }).start();
      },
    })
  ).current;

  const { data: buddy, refetch: load } = useQuery({
    queryKey: ['buddy', id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/matchmaking/buddies/${id}`);
        return data;
      } catch (e: any) {
        errorH();
        throw e;
      }
    },
    enabled: !!id,
  });

  if (!buddy) return (
    <View style={{ flex: 1, backgroundColor: t.background, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={t.primary} />
    </View>
  );

  const riderName = buddy.rider?.name || 'Buddy';
  const riderAvatar = buddy.rider?.profilePic;
  const riderRating = buddy.rider_rating ?? buddy.rider?.rating ?? 5.0;
  const isOwnRequest = user?.id === buddy.riderId;

  const origin = buddy.startPlaceName || 'Unknown';
  const destination = buddy.endPlaceName || 'Unknown';
  const departureTime = buddy.startTime;
  const time = new Date(departureTime);

  const co2 = buddy.co2_saved_kg ?? 0;
  const dist = buddy.distance_km ?? 0;

  let origin_lat: number | undefined, origin_lng: number | undefined;
  let dest_lat: number | undefined, dest_lng: number | undefined;

  if (buddy.startPointGeoJson) {
    try {
      const p = typeof buddy.startPointGeoJson === 'string' ? JSON.parse(buddy.startPointGeoJson) : buddy.startPointGeoJson;
      origin_lng = p.coordinates[0];
      origin_lat = p.coordinates[1];
    } catch {}
  }
  if (buddy.endPointGeoJson) {
    try {
      const p = typeof buddy.endPointGeoJson === 'string' ? JSON.parse(buddy.endPointGeoJson) : buddy.endPointGeoJson;
      dest_lng = p.coordinates[0];
      dest_lat = p.coordinates[1];
    } catch {}
  }

  const handleWithdrawRequest = () => {
    tap();
    Alert.alert(
      'Withdraw Buddy Request',
      'Are you sure you want to withdraw this buddy request?',
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
              Alert.alert('Withdrawn', 'Your buddy request has been withdrawn.');
              load();
            } catch (err: any) {
              errorH();
              Alert.alert('Error', err?.response?.data?.message || 'Failed to withdraw request');
            } finally {
              setUpdating(false);
            }
          }
        }
      ]
    );
  };

  const handleChat = () => {
    tap();
    const sorted = [buddy.riderId, user?.id || ''].sort();
    const chatId = `chat_${sorted[0]}_${sorted[1]}`;
    router.push(`/chat/${encodeURIComponent(chatId)}?name=${encodeURIComponent(riderName)}` as any);
  };

  const handleOfferRide = () => {
    tap();
    router.push({
      pathname: '/commute/search' as any,
      params: {
        mode: 'offer',
        vehicleType: 'CAR',
        from: buddy.startPlaceName,
        to: buddy.endPlaceName,
        hideTabs: 'true',
      },
    });
  };

  const handleOfferCab = async () => {
    if (!buddy?.riderId || !user?.id) return;
    tap();
    setUpdating(true);
    try {
      await api.post('/matchmaking/buddies/request', { buddyRequestId: id });
      success();
      Alert.alert(
        'Request Sent',
        `Your request to book a cab with ${riderName} has been successfully sent. You can track this request on your Requests page.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/(tabs)/rides' as any);
            }
          }
        ]
      );
    } catch (err: any) {
      errorH();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to send cab match request.');
    } finally {
      setUpdating(false);
    }
  };

  const handleInviteBuddy = async () => {
    if (!rideId) return;
    tap();
    setUpdating(true);
    try {
      await api.post('/matchmaking/invite', { rideId, buddyRequestId: id });
      success();
      Alert.alert(
        'Success',
        'Your ride offer has been successfully sent to the passenger!',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push('/(tabs)');
            }
          }
        ]
      );
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Failed to add passenger to ride.');
    } finally {
      setUpdating(false);
    }
  };

  const fabContent = () => {
    if (buddy.status === 'CANCELLED') {
      return (
        <View style={[styles.cta, { backgroundColor: t.muted, width: '100%' }]}>
          <Text style={{ color: t.textSecondary, fontSize: 16, fontWeight: '700' }}>Request Withdrawn</Text>
        </View>
      );
    }

    if (isOwnRequest) {
      return (
        <TouchableOpacity
          onPress={handleWithdrawRequest}
          disabled={updating}
          activeOpacity={0.85}
          style={[styles.cta, { backgroundColor: '#ffffff', borderColor: '#ef4444', borderWidth: 1, width: '100%' }]}
        >
          {updating ? <ActivityIndicator color="#ef4444" /> : (
            <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: '700' }}>Withdraw Buddy Request</Text>
          )}
        </TouchableOpacity>
      );
    }

    if (rideId) {
      return (
        <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
          <TouchableOpacity
            onPress={handleInviteBuddy}
            disabled={updating}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary, width: '100%' }]}
          >
            {updating ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Send Ride Offer</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    const showOfferRide = viewMode !== 'find';
    const showOfferCab = buddy.type === 'buddy' && viewMode !== 'offer';

    if (showOfferRide && showOfferCab) {
      return (
        <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={handleChat}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: t.primary }]}
            >
              <MessageCircle color={t.primaryContrast} size={18} />
              <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleOfferRide}
              activeOpacity={0.85}
              style={[styles.cta, { backgroundColor: t.primary }]}
            >
              <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Offer a Ride</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleOfferCab}
            disabled={updating}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary, marginTop: 8, width: '100%' }]}
          >
            {updating ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Offer to Book Cab Together</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (showOfferRide) {
      return (
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <TouchableOpacity
            onPress={handleChat}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary }]}
          >
            <MessageCircle color={t.primaryContrast} size={18} />
            <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOfferRide}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary }]}
          >
            <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Offer a Ride</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (showOfferCab) {
      return (
        <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
          <TouchableOpacity
            onPress={handleChat}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary }]}
          >
            <MessageCircle color={t.primaryContrast} size={18} />
            <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOfferCab}
            disabled={updating}
            activeOpacity={0.85}
            style={[styles.cta, { backgroundColor: t.primary }]}
          >
            {updating ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700' }}>Offer to Book Cab Together</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        onPress={handleChat}
        activeOpacity={0.85}
        style={[styles.cta, { backgroundColor: t.primary, width: '100%' }]}
      >
        <MessageCircle color={t.primaryContrast} size={18} />
        <Text style={{ color: t.primaryContrast, fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Chat</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader title={isOwnRequest ? "Requested Ride Detail" : "Buddy Request Details"} />

      {/* Absolute Map Background */}
      <View style={[StyleSheet.absoluteFillObject, { top: Platform.OS === 'ios' ? 90 : 60 }]}>
        <RouteMap
          origin={{ lat: origin_lat ?? 0, lng: origin_lng ?? 0, name: origin }}
          destination={{ lat: dest_lat ?? 0, lng: dest_lng ?? 0, name: destination }}
          t={t}
          style={{ height: '100%', borderRadius: 0 }}
        />
      </View>

      {/* Draggable Bottom Sheet */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sheet,
          {
            backgroundColor: t.background,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Drag Handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: t.border }]} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Passenger card */}
          <View style={[styles.card, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => {
                  tap();
                  router.push(`/user/${buddy.riderId}` as any);
                }}
                activeOpacity={0.8}
                style={{ borderRadius: 9999, borderWidth: 2, borderColor: '#E5E7EB' }}
              >
                <VerifiedAvatar uri={riderAvatar} name={riderName} verified={false} t={t} size={40} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: t.textPrimary }} numberOfLines={1}>
                    {riderName}
                  </Text>
                  {buddy.rider?.gender && (
                    <Text style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>
                      ({buddy.rider.gender})
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Star color="#FBBF24" size={11} fill="#FBBF24" />
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>{riderRating % 1 === 0 ? riderRating.toFixed(0) : riderRating.toFixed(1)}</Text>
                  <Text style={{ fontSize: 12, color: t.textTertiary }}>·</Text>
                  <Users color={t.textSecondary} size={11} style={{ marginRight: -2 }} />
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>
                    {buddy.seatsNeeded} {buddy.seatsNeeded === 1 ? 'seat' : 'seats'} needed
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: t.textPrimary }}>
                  {isNaN(time.getTime()) ? '' : time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <Clock color={t.textSecondary} size={10} />
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>
                    {isNaN(time.getTime()) ? '--:--' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Route card */}
          <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border, marginTop: spacing.md }]}>
            <View style={{ flexDirection: 'row', gap: 14 }}>
              <View style={{ alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 }}>
                <View style={[styles.dot, { backgroundColor: t.primary }]} />
                <View style={{ width: 2, flex: 1, backgroundColor: t.border, marginVertical: 4 }} />
                <View style={[styles.dot, { backgroundColor: t.error }]} />
              </View>
              <View style={{ flex: 1, gap: 18 }}>
                <View>
                  <Text style={[styles.label, { color: t.textSecondary }]}>PICKUP</Text>
                  <Text style={[styles.loc, { color: t.textPrimary }]}>{origin}</Text>
                  <Text style={[styles.time, { color: t.textSecondary }]}>
                    {isNaN(time.getTime()) ? '???' : time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' })}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.label, { color: t.textSecondary }]}>DROPOFF</Text>
                  <Text style={[styles.loc, { color: t.textPrimary }]}>{destination}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Eco badge */}
          <View style={[styles.eco, { backgroundColor: t.isDark ? '#0f1f17' : '#EAF5EC' }]}>
            <Leaf color={t.primary} size={18} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: t.primary, fontWeight: '800', fontSize: 14 }}>Eco impact</Text>
              <Text style={{ color: t.primary, fontSize: 12, marginTop: 2 }}>
                {(co2 || 0).toFixed(1)} kg CO₂ avoided · {(dist || 0).toFixed(0)} km route
              </Text>
            </View>
          </View>

          {/* Inline FAB Area */}
          {fabContent() !== null && (
            <View style={{ marginTop: spacing.md, width: '100%', paddingBottom: 20 }}>
              {fabContent()}
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  handleContainer: {
    width: '100%',
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
  },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  eco: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md, borderRadius: radius.lg, marginTop: spacing.md },
  driver: { fontSize: 18, fontWeight: '800' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  loc: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  time: { fontSize: 13, marginTop: 2 },
  section: { fontSize: 16, fontWeight: '700' },
  sheetFab: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
  },
  cta: { flex: 1, height: 54, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
