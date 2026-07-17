import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { X, ShieldAlert } from 'lucide-react-native';
import { lightTheme, darkTheme, spacing, radius, shadowStyle } from '../theme/theme';
import { tap } from '../utils/haptics';

interface WebPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export const WebPermissionModal: React.FC<WebPermissionModalProps> = ({
  visible,
  onClose,
  title = 'Browser Permissions Guide',
  description = 'To update site permissions (Location, Notifications, etc.) for this web app:',
}) => {
  const t = lightTheme;

  const handleClose = () => {
    tap();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: t.background }]}>
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldAlert color={t.warning} size={20} />
              <Text style={[styles.modalTitle, { color: t.textPrimary }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} style={styles.closeIcon}>
              <X color={t.textPrimary} size={18} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalText, { color: t.textSecondary }]}>
            {description}
          </Text>

          <View style={styles.modalSteps}>
            <View style={styles.stepRow}>
              <Text style={[styles.stepNumber, { color: t.primary, backgroundColor: t.surfaceElevated }]}>1</Text>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                Look at the address bar of your browser.
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={[styles.stepNumber, { color: t.primary, backgroundColor: t.surfaceElevated }]}>2</Text>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                Click on the lock (🔒) or settings icon next to the URL.
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={[styles.stepNumber, { color: t.primary, backgroundColor: t.surfaceElevated }]}>3</Text>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                Locate the permission toggles and select "Allow" or "Ask".
              </Text>
            </View>
            <View style={styles.stepRow}>
              <Text style={[styles.stepNumber, { color: t.primary, backgroundColor: t.surfaceElevated }]}>4</Text>
              <Text style={[styles.modalStep, { color: t.textPrimary }]}>
                Reload the page to apply the changes.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.modalCloseBtn, { backgroundColor: t.primary }]}
            onPress={handleClose}
          >
            <Text style={[styles.modalCloseBtnText, { color: t.primaryContrast }]}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadowStyle('#000', { width: 0, height: 4 }, 0.15, 10, 5),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeIcon: {
    padding: 4,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
    width: '100%',
  },
  modalSteps: {
    width: '100%',
    gap: 12,
    marginBottom: spacing.lg,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  modalStep: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  modalCloseBtn: {
    height: 46,
    borderRadius: radius.pill,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  modalCloseBtnText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
