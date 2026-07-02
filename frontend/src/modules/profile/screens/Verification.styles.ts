import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../../core/theme/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  // Verified State UI
  verifiedCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    gap: spacing.md,
    marginTop: spacing.md,
  },
  verifiedTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  verifiedDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginVertical: spacing.xs,
  },
  emailBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoBanner: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },

  // Wizard Card styling
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Step Form Items
  inputGroup: {
    gap: 8,
    marginVertical: spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 52,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
  },
  
  // OTP row inputs
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
    gap: 8,
  },
  otpBox: {
    flex: 1,
    height: 52,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  otpText: {
    fontSize: 20,
    fontWeight: '800',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: 52,
  },

  // CTA buttons
  cta: {
    height: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.sm,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  
  // Secondary / links
  secondaryAction: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Expiry Timer
  timerText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  
  errorMsg: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  successMsg: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
