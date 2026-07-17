import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Clock,
  Info,
  Share2,
  CheckCircle2,
  AlertCircle,
  QrCode,
} from 'lucide-react-native';
import { getTicketDeepLinkUrl, attemptNativeAppOpenOnWeb } from '../../../src/core/utils/deeplink';
import * as Sharing from 'expo-sharing';

let ViewShot: any = View;
let captureRef: any = () => Promise.resolve('');

if (Platform.OS !== 'web') {
  try {
    const ViewShotModule = require('react-native-view-shot');
    ViewShot = ViewShotModule.default;
    captureRef = ViewShotModule.captureRef;
  } catch (e) {
    // Graceful fallback
  }
}
import { api } from '../../../src/core/api/api';
import { lightTheme, darkTheme, spacing, radius } from '../../../src/core/theme/theme';
import { tap, success } from '../../../src/core/utils/haptics';
import { Alert } from '../../../src/core/components/CustomAlert';
import { ScreenHeader } from '../../../src/core/components/ScreenHeader';

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

const formatISTDateTime = (utcTimeStr: string): string => {
  if (!utcTimeStr) return 'N/A';
  const istDate = getISTDate(utcTimeStr);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = istDate.getUTCDate();
  const month = monthNames[istDate.getUTCMonth()];
  const hours = String(istDate.getUTCHours()).padStart(2, '0');
  const minutes = String(istDate.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month}, ${hours}:${minutes}`;
};

export default function TicketDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  const [booking, setBooking] = useState<MyBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const viewShotRef = useRef<any>(null);

  const loadTicket = async () => {
    try {
      setLoading(true);
      try {
        const { data } = await api.get(`/parking/ticket/${id}`);
        if (data) {
          setBooking(data);
          return;
        }
      } catch (e) {
        // Fallback to my-bookings
      }
      const { data } = await api.get('/parking/my-bookings');
      const found = data.find((bk: any) => bk.id === id);
      if (found) {
        setBooking(found);
      } else {
        Alert.alert('Ticket Not Found', 'The requested parking pass could not be retrieved.');
      }
    } catch (err) {
      console.error('[TICKET_DETAIL] Fetch failed:', err);
      Alert.alert('Error', 'Failed to retrieve ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  useEffect(() => {
    if (Platform.OS === 'web' && id) {
      attemptNativeAppOpenOnWeb(id as string, booking?.spot?.spotName);
    }
  }, [id, booking?.spot?.spotName]);

  const getQRCodeUrl = (text: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(text)}`;
  };

  const handleShareTicket = async () => {
    try {
      tap();
      if (Platform.OS === 'web') {
        Alert.alert('Info', 'To share your digital parking pass on the web, please take a screenshot or print this page.');
        return;
      }

      if (!viewShotRef.current) {
        Alert.alert('Error', 'Pass view is not fully rendered yet.');
        return;
      }

      // Capture high-fidelity PNG of the digital pass
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Aroundly Digital Parking Pass',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Sharing Unavailable', 'Native sharing is not supported on this environment.');
      }
    } catch (err) {
      console.error('[SHARE] Capture failed:', err);
      Alert.alert('Sharing Error', 'Failed to generate and share ticket pass image.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={t.primary} />
          <Text style={[styles.loadingTxt, { color: t.textSecondary }]}>Loading digital pass...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
        <ScreenHeader title="Parking Pass" />
        <View style={styles.center}>
          <AlertCircle size={40} color={t.error} />
          <Text style={[styles.errorTxt, { color: t.textPrimary }]}>Failed to load pass details.</Text>
          <TouchableOpacity onPress={() => router.back()} style={[styles.btn, { backgroundColor: t.primary }]}>
            <Text style={{ color: t.primaryContrast, fontWeight: '700' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isAccepted = booking.status === 'ACCEPTED';
  const isRequested = booking.status === 'REQUESTED';
  const isRejected = booking.status === 'REJECTED';
  const isExpired = booking.status === 'EXPIRED';

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
  } else if (isExpired) {
    statusColor = t.error;
    statusBg = t.errorBg;
  }

  const qrPayload = getTicketDeepLinkUrl(booking.id, booking.spot.spotName);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]} edges={['top']}>
      <ScreenHeader title="Aroundly Digital Ticket" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ticket Container for High Fidelity Capturing */}
        <ViewShot
          ref={viewShotRef}
          options={{ format: 'png', quality: 1.0 }}
          style={[styles.ticketPassCard, { backgroundColor: t.surface, borderColor: isExpired ? t.error : t.border }]}
        >
          {/* Left Cutout Circle overlay */}
          <View style={[styles.ticketCutoutLeft, { backgroundColor: t.background, borderColor: t.border }]} />
          {/* Right Cutout Circle overlay */}
          <View style={[styles.ticketCutoutRight, { backgroundColor: t.background, borderColor: t.border }]} />

          {/* Ticket Header branding */}
          <View style={[styles.ticketHeader, { borderBottomColor: t.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.ticketTitle, { color: t.textPrimary }]}>YOUR DIGITAL TICKET</Text>
            </View>
            <View style={[styles.ticketStatusBadge, { backgroundColor: statusBg }]}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor }}>{booking.status}</Text>
            </View>
          </View>

          {/* Main Stub info */}
          <View style={styles.ticketBody}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 11, fontWeight: '600', color: t.textTertiary }}>PARKING SPOT</Text>
                <Text style={[styles.ticketSpotCode, { color: t.textPrimary }]}>{booking.spot.spotName}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: t.textTertiary }}>BOOKING CHARGE</Text>
                <Text style={{ fontSize: 24, fontWeight: '800', color: t.textPrimary }}>₹{booking.price}</Text>
              </View>
            </View>

            {/* Grid metrics details */}
            <View style={styles.ticketDetailsGrid}>
              <View style={styles.ticketDetailCell}>
                <MapPin size={14} color={t.primary} />
                <View>
                  <Text style={styles.cellLabel}>LOCATION</Text>
                  <Text style={[styles.cellVal, { color: t.textSecondary }]} numberOfLines={1}>
                    Level {booking.spot.level} ({booking.spot.section})
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetailCell}>
                <Calendar size={14} color={t.primary} />
                <View>
                  <Text style={styles.cellLabel}>DATE</Text>
                  <Text style={[styles.cellVal, { color: t.textSecondary }]}>{booking.date}</Text>
                </View>
              </View>

              <View style={styles.ticketDetailCell}>
                <Clock size={14} color={t.primary} />
                <View>
                  <Text style={styles.cellLabel}>TIME & SLOT</Text>
                  <Text style={[styles.cellVal, { color: t.textSecondary }]} numberOfLines={1}>
                    {booking.slotType} ({formatISTTime(booking.startTime)})
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetailCell}>
                <Info size={14} color={t.primary} />
                <View>
                  <Text style={styles.cellLabel}>SPOT OWNER</Text>
                  <Text style={[styles.cellVal, { color: t.textSecondary }]} numberOfLines={1}>
                    {booking.spot.owner?.name || 'Campus Resident'}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetailCell}>
                <Clock size={14} color={t.success} />
                <View>
                  <Text style={styles.cellLabel}>VALID FROM</Text>
                  <Text style={[styles.cellVal, { color: t.textSecondary }]} numberOfLines={1}>
                    {formatISTDateTime(booking.startTime)}
                  </Text>
                </View>
              </View>

              <View style={styles.ticketDetailCell}>
                <Clock size={14} color={t.error} />
                <View>
                  <Text style={styles.cellLabel}>VALID TILL</Text>
                  <Text style={[styles.cellVal, { color: t.textSecondary }]} numberOfLines={1}>
                    {formatISTDateTime(booking.endTime)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Tear separation line */}
            <View style={[styles.ticketTearLine, { borderTopColor: t.border }]} />

            {/* QR Code Scannability block */}
            {isAccepted ? (
              <View style={{ alignItems: 'center', marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <CheckCircle2 size={16} color={t.success} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: t.success }}>
                    ✓ CONFIRMED RESERVATION PASS
                  </Text>
                </View>
                
                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: getQRCodeUrl(qrPayload) }}
                    style={styles.qrImage}
                  />
                </View>

                <Text style={{ fontSize: 9, color: t.textTertiary, letterSpacing: 2, marginTop: 10 }}>
                  ID: {booking.id.toUpperCase()}
                </Text>
              </View>
            ) : isRequested ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={t.warning} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.warning, textAlign: 'center' }}>
                  Awaiting Spot Owner Confirmation
                </Text>
                <Text style={{ fontSize: 11, color: t.textTertiary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                  The verification QR code and final gate access pass will unlock instantly once your request is accepted.
                </Text>
              </View>
            ) : isExpired ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <AlertCircle size={28} color={t.textSecondary} style={{ marginBottom: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.textSecondary, textAlign: 'center' }}>
                  Booking Request Expired
                </Text>
                <Text style={{ fontSize: 11, color: t.textTertiary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                  This booking has expired as the slot time has passed. Please select another slot.
                </Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <AlertCircle size={28} color={t.error} style={{ marginBottom: 10 }} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: t.error, textAlign: 'center' }}>
                  Booking Request Rejected
                </Text>
                <Text style={{ fontSize: 11, color: t.textTertiary, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
                  This request was declined by the spot owner. Please choose another green available slot on the hub map.
                </Text>
              </View>
            )}
          </View>
        </ViewShot>

        {/* Share Ticket CTA */}
        {isAccepted && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleShareTicket}
            style={[styles.shareBtn, { backgroundColor: t.primary }]}
          >
            <Share2 color={t.primaryContrast} size={20} />
            <Text style={[styles.shareBtnTxt, { color: t.primaryContrast }]}>
              Share Digital Pass
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingTxt: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorTxt: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: spacing.md,
  },
  btn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  ticketPassCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: spacing.lg,
  },
  ticketCutoutLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    position: 'absolute',
    left: -10,
    top: 56,
    zIndex: 10,
  },
  ticketCutoutRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    position: 'absolute',
    right: -10,
    top: 56,
    zIndex: 10,
  },
  ticketHeader: {
    padding: spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  ticketStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketBody: {
    padding: spacing.lg,
  },
  ticketSpotCode: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  ticketDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.sm,
    justifyContent: 'space-between',
  },
  ticketDetailCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '46%',
    marginBottom: spacing.xs,
  },
  cellLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8E8E93',
  },
  cellVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  ticketTearLine: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginVertical: 20,
  },
  qrContainer: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    marginTop: spacing.xs,
  },
  qrImage: {
    width: 160,
    height: 160,
    borderRadius: radius.md,
  },
  shareBtn: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  shareBtnTxt: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
