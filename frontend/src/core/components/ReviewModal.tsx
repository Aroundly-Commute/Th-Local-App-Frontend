import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Star, X } from 'lucide-react-native';
import { api } from '../api/api';
import { lightTheme, darkTheme, spacing, radius, shadowStyle } from '../theme/theme';
import { VerifiedAvatar } from './VerifiedAvatar';
import { Alert } from './CustomAlert';
import { tap, success, errorH } from '../utils/haptics';

type Props = {
  visible: boolean;
  onClose: () => void;
  peerName: string;
  peerAvatar: string | null;
  rideId: string;
  toUserId: string;
  onSubmitSuccess: (rating: number) => void;
};

export const ReviewModal: React.FC<Props> = ({
  visible,
  onClose,
  peerName,
  peerAvatar,
  rideId,
  toUserId,
  onSubmitSuccess,
}) => {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      errorH();
      Alert.alert('Selection Required', 'Please select a star rating (1 to 5) before submitting.');
      return;
    }

    tap();
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        rideId,
        toUserId,
        rating,
        comment: comment.trim() || undefined,
      });
      success();
      Alert.alert('Review Submitted', `Thank you for rating ${peerName}!`);
      onSubmitSuccess(rating);
      // Reset local state
      setRating(0);
      setComment('');
      onClose();
    } catch (err: any) {
      errorH();
      const msg = err?.response?.data?.message || 'Failed to submit review. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    tap();
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={[styles.content, { backgroundColor: t.surface, borderColor: t.border }]}>
              {/* Close Button */}
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X color={t.textSecondary} size={20} />
              </TouchableOpacity>

              {/* Header / Avatar */}
              <View style={styles.header}>
                <VerifiedAvatar uri={peerAvatar || undefined} name={peerName} verified={false} t={t} size={64} />
                <Text style={[styles.title, { color: t.textPrimary }]}>Rate Your Experience</Text>
                <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                  How was your commute with {peerName}?
                </Text>
              </View>

              {/* Star Rating Selector */}
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((i) => {
                  const isSelected = i <= rating;
                  return (
                    <TouchableOpacity
                      key={i}
                      activeOpacity={0.7}
                      onPress={() => {
                        tap();
                        setRating(i);
                      }}
                      style={styles.starTouch}
                    >
                      <Star
                        size={32}
                        color={isSelected ? '#f59e0b' : t.textTertiary}
                        fill={isSelected ? '#f59e0b' : 'transparent'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Comment Input */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: t.textSecondary }]}>
                  Optional Comment
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      color: t.textPrimary,
                      borderColor: t.border,
                      backgroundColor: t.muted,
                    },
                  ]}
                  placeholder="Share a details about the ride..."
                  placeholderTextColor={t.textTertiary}
                  multiline={true}
                  numberOfLines={4}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={250}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
                style={[styles.submitBtn, { backgroundColor: t.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator color={t.primaryContrast} />
                ) : (
                  <Text style={[styles.submitText, { color: t.primaryContrast }]}>
                    Submit Review
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  keyboardView: {
    width: '100%',
    maxWidth: 340,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
    ...shadowStyle('#000', { width: 0, height: 4 }, 0.1, 10, 5),
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginVertical: spacing.lg,
  },
  starTouch: {
    padding: 4,
  },
  inputContainer: {
    width: '100%',
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    height: 90,
    textAlignVertical: 'top',
    fontSize: 13,
  },
  submitBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
