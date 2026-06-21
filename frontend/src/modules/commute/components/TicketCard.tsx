import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Image, StyleSheet } from 'react-native';
import { MapPin, Calendar, Clock, Info, Sparkles, AlertCircle } from 'lucide-react-native';

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

interface MyBooking {
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
}

interface TicketCardProps {
  bk: MyBooking;
  t: any;
  onPress: () => void;
}

export function TicketCard({ bk, t, onPress }: TicketCardProps) {
  const isAccepted = bk.status === 'ACCEPTED';
  const isRequested = bk.status === 'REQUESTED';
  const isRejected = bk.status === 'REJECTED';
  const isExpired = bk.status === 'EXPIRED';

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
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.ticketPassCard, { backgroundColor: t.surface, borderColor: isExpired ? t.error : t.border }]}
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
        ) : isExpired ? (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <AlertCircle size={20} color={t.textSecondary} style={{ marginBottom: 4 }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: t.textSecondary, textAlign: 'center' }}>
              This booking has expired
            </Text>
            <Text style={{ fontSize: 10, color: t.textTertiary, textAlign: 'center', marginTop: 2 }}>
              The slot time has passed. Please select another slot.
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
}

const styles = StyleSheet.create({
  ticketPassCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
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
    padding: 16,
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
    gap: 12,
    marginTop: 12,
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
});
