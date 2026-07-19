import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, useColorScheme, Animated } from 'react-native';
import { lightTheme, darkTheme, shadowStyle } from '../theme/theme';
import { tap } from '../utils/haptics';
import { VerifiedAvatar } from './VerifiedAvatar';
import { Star, MapPin, Eye, CheckCircle2, XCircle, ArrowRight } from 'lucide-react-native';

export type RideRequestModalData = {
  id: string;
  rideId: string;
  title?: string;
  type?: 'new_ride_request' | 'new_ride_invite' | 'new_buddy_request';
  riderName?: string;
  driverName?: string;
  riderStartName?: string;
  riderEndName?: string;
  fareAmount?: number;
  fareCents?: number;
  peerRole?: 'SEEKER' | 'OFFERER' | 'CAB_BUDDY';
  isInvitation?: boolean;
  peerUser?: {
    id?: string;
    name?: string;
    profilePic?: string;
    rating?: number;
  };
};

interface RideRequestModalProps {
  visible: boolean;
  data: RideRequestModalData | null;
  onAccept: (data: RideRequestModalData) => void;
  onReject: (data: RideRequestModalData) => void;
  onViewDetail: (data: RideRequestModalData) => void;
  onClose: () => void;
}

export const RideRequestModal: React.FC<RideRequestModalProps> = ({
  visible,
  data,
  onAccept,
  onReject,
  onViewDetail,
  onClose
}) => {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.92)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 50, useNativeDriver: true })
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
    }
  }, [visible]);

  if (!visible || !data) return null;

  // Resolve peer co-passenger details
  const name = data.peerUser?.name || data.riderName || data.driverName || 'Co-passenger';
  const profilePic = data.peerUser?.profilePic;
  const rating = data.peerUser?.rating || 4.8;

  // Resolve fare calculation
  const fare = data.fareAmount ?? (data.fareCents ? Math.round(data.fareCents / 100) : 150);

  // Modal Title & Context
  let modalTitle = "New Ride Request";
  if (data.type === 'new_ride_invite' || data.isInvitation) {
    modalTitle = "New Ride Invitation";
  } else if (data.type === 'new_buddy_request') {
    modalTitle = "New Cab Buddy Request";
  }

  // Financial role context
  const isOfferer = data.peerRole === 'SEEKER'; // Peer is seeker => current user is Offerer/Driver => Driver GETS money
  const isSeeker = data.peerRole === 'OFFERER'; // Peer is offerer => current user is Seeker/Rider => Rider PAYS money
  const isCabShare = data.peerRole === 'CAB_BUDDY' || data.type === 'new_buddy_request';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.backdrop,
            { backgroundColor: t.isDark ? 'rgba(5, 11, 20, 0.75)' : 'rgba(10, 22, 40, 0.65)' },
            { opacity: fadeAnim }
          ]}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            { backgroundColor: t.surface, borderColor: t.border },
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          {/* Header Title */}
          <Text style={[styles.title, { color: t.textPrimary }]}>{modalTitle}</Text>
          <Text style={[styles.subtitle, { color: t.textSecondary }]}>
            {isOfferer
              ? 'A rider would like to join your trip'
              : isSeeker
              ? 'A driver has offered you a seat'
              : 'A buddy wants to share a cab with you'}
          </Text>

          {/* Co-Passenger Profile Card */}
          <View style={[styles.passengerCard, { backgroundColor: t.isDark ? 'rgba(255,255,255,0.05)' : '#F4F7FC' }]}>
            <VerifiedAvatar
              uri={profilePic}
              name={name}
              size={54}
              verified={true}
              t={t}
            />
            <View style={styles.passengerInfo}>
              <Text style={[styles.passengerName, { color: t.textPrimary }]} numberOfLines={1}>
                {name}
              </Text>

              <View style={styles.badgeRow}>
                <View style={[styles.ratingBadge, { backgroundColor: t.warningBg }]}>
                  <Star size={13} color={t.warning} fill={t.warning} />
                  <Text style={[styles.ratingText, { color: t.warning }]}>{Number(rating).toFixed(1)}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: t.isDark ? '#1E293B' : '#E0E7FF' }]}>
                  <Text style={[styles.roleText, { color: t.isDark ? '#93C5FD' : '#3B82F6' }]}>
                    {isOfferer ? 'Rider Seeker' : isSeeker ? 'Ride Host' : 'Cab Buddy'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Route Snippet */}
          {(data.riderStartName || data.riderEndName) ? (
            <View style={[styles.routeBox, { borderColor: t.border }]}>
              <MapPin size={15} color="#00D4BC" />
              <Text style={[styles.routeText, { color: t.textPrimary }]} numberOfLines={1}>
                {data.riderStartName || 'Pickup'}
              </Text>
              <ArrowRight size={13} color={t.textSecondary} />
              <Text style={[styles.routeText, { color: t.textPrimary }]} numberOfLines={1}>
                {data.riderEndName || 'Drop-off'}
              </Text>
            </View>
          ) : null}

          {/* Financial / Money Badge */}
          {!isCabShare && (
            <View
              style={[
                styles.fareCard,
                {
                  backgroundColor: isOfferer
                    ? (t.isDark ? 'rgba(16, 185, 129, 0.15)' : t.mintBg)
                    : (t.isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF'),
                  borderColor: isOfferer
                    ? t.success
                    : '#3B82F6'
                }
              ]}
            >
              <Text
                style={[
                  styles.fareLabel,
                  {
                    color: isOfferer
                      ? t.success
                      : '#2563EB'
                  }
                ]}
              >
                {isOfferer ? "YOU WILL RECEIVE" : "YOU WILL PAY"}
              </Text>
              <Text
                style={[
                  styles.fareAmount,
                  {
                    color: isOfferer
                      ? t.success
                      : '#1D4ED8'
                  }
                ]}
              >
                ₹{fare}
              </Text>
            </View>
          )}

          {/* Action Buttons: 2 rows layout */}
          <View style={styles.actionSection}>
            {/* Top Row: Accept & Reject */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.actionBtn, { backgroundColor: t.errorBg, borderWidth: 1, borderColor: t.error }]}
                onPress={() => {
                  tap();
                  onReject(data);
                }}
              >
                <XCircle size={17} color={t.error} />
                <Text style={[styles.rejectBtnText, { color: t.error }]}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.actionBtn, { backgroundColor: t.success }]}
                onPress={() => {
                  tap();
                  onAccept(data);
                }}
              >
                <CheckCircle2 size={17} color="#FFFFFF" />
                <Text style={[styles.acceptBtnText, { color: '#FFFFFF' }]}>Accept</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Row: View Detail */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.viewDetailBtn, { borderColor: t.border, backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : '#FAFBFD' }]}
              onPress={() => {
                tap();
                onViewDetail(data);
              }}
            >
              <Eye size={16} color={t.isDark ? '#00D4BC' : '#0A1628'} />
              <Text style={[styles.viewDetailText, { color: t.isDark ? '#00D4BC' : '#0A1628' }]}>
                View Full Details
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    alignItems: 'center',
    ...shadowStyle('#000', { width: 0, height: 10 }, 0.25, 20, 12),
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  passengerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    padding: 12,
    borderRadius: 16,
    gap: 12,
  },
  passengerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  routeText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  fareCard: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  fareLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  actionSection: {
    width: '100%',
    marginTop: 18,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  rejectBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },
  viewDetailBtn: {
    width: '100%',
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewDetailText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
