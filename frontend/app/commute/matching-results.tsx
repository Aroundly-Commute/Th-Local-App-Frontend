import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  useColorScheme, KeyboardAvoidingView, Platform,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  MapPin, Clock, Users, Check, Send,
  AlertTriangle
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/core/api/api';
import { lightTheme, darkTheme, spacing, radius } from '../../src/core/theme/theme';
import { Shimmer } from '../../src/core/components/Shimmer';
import { tap, success, errorH } from '../../src/core/utils/haptics';
import { Alert } from '../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../src/core/components/ScreenHeader';
import { BuddyCard } from '../../src/modules/commute/components/BuddyCard';
import { styles } from './matching-results.styles';

export default function MatchingResults() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const rideId = params.rideId;

  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  // 1. Fetch Ride Details
  const { data: ride, isLoading: rideLoading, error: rideError } = useQuery({
    queryKey: ['ride', rideId],
    queryFn: async () => {
      if (!rideId) throw new Error('No Ride ID provided');
      const { data } = await api.get(`/rides/${rideId}`);
      return data;
    },
    enabled: !!rideId,
  });

  // 2. Fetch Matching Passenger Requests (dependant query)
  const {
    data: sections = [],
    isLoading: matchesLoading,
    refetch: refetchMatches,
    isRefetching
  } = useQuery({
    queryKey: ['ride-matches', rideId],
    queryFn: async () => {
      if (!ride || !ride.startPointGeoJson || !ride.endPointGeoJson) return [];
      const startPt = typeof ride.startPointGeoJson === 'string'
        ? JSON.parse(ride.startPointGeoJson)
        : ride.startPointGeoJson;
      const endPt = typeof ride.endPointGeoJson === 'string'
        ? JSON.parse(ride.endPointGeoJson)
        : ride.endPointGeoJson;

      const startCoords = { lng: startPt.coordinates[0], lat: startPt.coordinates[1] };
      const endCoords = { lng: endPt.coordinates[0], lat: endPt.coordinates[1] };

      const { data } = await api.post('/matchmaking/search', {
        start: startCoords,
        end: endCoords,
        startPlaceName: ride.startPlaceName,
        endPlaceName: ride.endPlaceName,
        startTime: ride.startTime,
        feature: 'offer',
      });

      const returnedSections = data.sections || [];
      return returnedSections.filter((sec: any) => sec.type !== 'offered' && sec.data?.length > 0);
    },
    enabled: !!ride && !!ride.startPointGeoJson && !!ride.endPointGeoJson,
  });

  const handleSendInvite = async (buddyRequestId: string) => {
    if (!rideId) return;
    tap();
    setInvitingId(buddyRequestId);

    try {
      await api.post('/matchmaking/invite', {
        rideId,
        buddyRequestId
      });
      success();
      setInvitedIds(prev => [...prev, buddyRequestId]);
      Alert.alert('Success', 'Your ride offer invitation has been sent successfully!');
    } catch (e: any) {
      errorH();
      Alert.alert('Error', e?.response?.data?.message || 'Failed to send ride offer invitation.');
    } finally {
      setInvitingId(null);
    }
  };

  const handleRefresh = async () => {
    tap();
    await refetchMatches();
  };

  const formatISTDate = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatISTTime = (isoStr: string) => {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  const loading = rideLoading || (matchesLoading && sections.length === 0);
  const errorMsg = rideError ? (rideError as any).message || 'Failed to load ride details' : null;
  const hasMatches = sections.some((sec: any) => sec.data && sec.data.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      <ScreenHeader
        title="Matching Passengers"
        onBack={() => router.push('/(tabs)')}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Ride Info Panel */}
        {ride && (
          <View style={[styles.ridePanel, { backgroundColor: t.surface, borderColor: t.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: t.primaryContrast, backgroundColor: t.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
                ACTIVE RIDE OFFER
              </Text>
              <Text style={{ fontSize: 12, color: t.textSecondary }}>
                Seats: {ride.seatsAvailable} available
              </Text>
            </View>

            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin color={t.primary} size={14} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary, flex: 1 }} numberOfLines={1}>
                  {ride.startPlaceName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MapPin color="#D81B60" size={14} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.textPrimary, flex: 1 }} numberOfLines={1}>
                  {ride.endPlaceName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Clock color={t.textSecondary} size={12} />
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>
                    {formatISTDate(ride.startTime)} at {formatISTTime(ride.startTime)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Content list */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 80 }}
          style={{ flex: 1 }}
          refreshControl={
            Platform.OS !== 'web' ? (
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
                tintColor={t.textPrimary}
              />
            ) : undefined
          }
        >
          {loading ? (
            <View style={{ marginTop: 24, gap: 16 }}>
              <Text style={{ fontSize: 14, color: t.textSecondary, textAlign: 'center' }}>Finding matching passenger requests...</Text>
              <Shimmer style={{ height: 160, borderRadius: radius.lg }} />
              <Shimmer style={{ height: 160, borderRadius: radius.lg }} />
            </View>
          ) : errorMsg ? (
            <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
              <AlertTriangle color={t.error} size={36} />
              <Text style={{ color: t.textPrimary, fontWeight: '600', textAlign: 'center' }}>{errorMsg}</Text>
            </View>
          ) : !hasMatches ? (
            <View style={{ padding: 48, alignItems: 'center', gap: 16 }}>
              <Users color={t.textTertiary} size={48} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: t.textPrimary, textAlign: 'center' }}>
                No Matching Passengers Found
              </Text>
              <Text style={{ fontSize: 13, color: t.textSecondary, textAlign: 'center', lineHeight: 18 }}>
                We couldn't find any passenger requests matching your route at this time. We will notify you when a match is posted.
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              {sections.map((section: any, sIdx: number) => (
                <View key={section.type || sIdx} style={{ marginBottom: 24 }}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: t.textPrimary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {section.title} ({section.data.length})
                  </Text>

                  <View style={{ gap: 14 }}>
                    {section.data.map((buddy: any) => {
                      const isInvited = invitedIds.includes(buddy.id);
                      const isInviting = invitingId === buddy.id;

                      return (
                        <View
                          key={buddy.id}
                          style={[styles.matchCard, { backgroundColor: t.surface, borderColor: t.border }]}
                        >
                          <BuddyCard
                            buddy={buddy}
                            t={t}
                            onPress={() => {
                              tap();
                              router.push({
                                pathname: `/buddy/${buddy.id}`,
                                params: {
                                  mode: 'offer',
                                  rideId: rideId
                                }
                              } as any);
                            }}
                            style={{ borderWidth: 0, padding: 0, backgroundColor: 'transparent' }}
                          />

                          {/* Action Button */}
                          <TouchableOpacity
                            disabled={isInvited || isInviting}
                            onPress={() => handleSendInvite(buddy.id)}
                            activeOpacity={0.8}
                            style={[
                              styles.inviteBtn,
                              {
                                backgroundColor: isInvited ? t.successBg : t.primary,
                                borderColor: isInvited ? t.success : t.primary,
                                marginTop: spacing.xs
                              }
                            ]}
                          >
                            {isInviting ? (
                              <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : isInvited ? (
                              <>
                                <Check size={14} color={t.success} />
                                <Text style={{ color: t.success, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                  Offer Sent
                                </Text>
                              </>
                            ) : (
                              <>
                                <Send size={13} color={t.primaryContrast} />
                                <Text style={{ color: t.primaryContrast, fontWeight: '700', fontSize: 13, marginLeft: 6 }}>
                                  Send Ride Offer
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


