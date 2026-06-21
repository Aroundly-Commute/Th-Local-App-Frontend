import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../../core/theme/theme';

export const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: 6,
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
  genderContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
  },
  cta: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
