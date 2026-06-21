import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../../core/theme/theme';

export const styles = StyleSheet.create({
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  menu: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginLeft: 58,
  },
  loadingWrap: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
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
    fontSize: 18,
    fontWeight: '800',
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  modalSteps: {
    width: '100%',
    gap: 10,
    marginBottom: spacing.lg,
  },
  modalStep: {
    fontSize: 13,
    lineHeight: 18,
  },
  modalCloseBtn: {
    height: 46,
    borderRadius: radius.pill,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    width: '100%',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
});
