import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Calendar, Clock, Info, BadgeCheck } from 'lucide-react-native';

interface BookingDrawerProps {
  selectedSpot: any;
  status: 'UNAVAILABLE' | 'MINE_CONFIRMED' | 'MINE_REQUESTED' | 'MINE_REJECTED' | 'OTHER_BOOKED' | 'OTHER_REQUESTED' | 'AVAILABLE';
  avail: any;
  proximityText: string;
  t: any;
  selectedSlotType: string;
  selectedDate: string;
  selectedHourlySlotLabel?: string;
  bookingInProgress: boolean;
  handleBookRequest: () => void;
  onDismiss: () => void;
  onViewTickets: () => void;
}

export function BookingDrawer({
  selectedSpot,
  status,
  avail,
  proximityText,
  t,
  selectedSlotType,
  selectedDate,
  selectedHourlySlotLabel,
  bookingInProgress,
  handleBookRequest,
  onDismiss,
  onViewTickets,
}: BookingDrawerProps) {
  if (!selectedSpot) return null;

  return (
    <View style={[styles.drawerSheet, { backgroundColor: t.background, borderTopColor: t.border }]}>
      {/* Drawer handle indicator */}
      <View style={styles.drawerHeaderHandle}>
        <View style={[styles.handleBar, { backgroundColor: t.border }]} />
      </View>

      <View>
        <View style={styles.drawerTitleRow}>
          <View>
            <Text style={[styles.drawerSpotName, { color: t.textPrimary }]}>
              Spot {selectedSpot.spotName}
            </Text>
            <Text style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>
              {proximityText}
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
              {selectedSlotType} {selectedSlotType === 'HOURLY' && selectedHourlySlotLabel && `(${selectedHourlySlotLabel})`}
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
            onPress={onDismiss}
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
              onPress={onViewTickets}
              style={[styles.drawerActionCta, { backgroundColor: t.accent }]}
            >
              <Text style={[styles.drawerActionCtaTxt, { color: t.primaryContrast }]}>
                View My Tickets
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1.5,
    padding: 16,
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
    marginBottom: 16,
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
    marginBottom: 16,
  },
  drawerSpotName: {
    fontSize: 20,
    fontWeight: '800',
  },
  drawerDetails: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 8,
    marginBottom: 16,
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
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginBottom: 16,
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
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
});
