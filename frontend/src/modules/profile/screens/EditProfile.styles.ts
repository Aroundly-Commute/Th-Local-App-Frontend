import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../../core/theme/theme';

export const styles = StyleSheet.create({
  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    gap: 12,
  },
  avatarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.xs,
  },
  avatarGridItem: {
    width: 66,
    height: 66,
    borderRadius: 33,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gridAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
  bioWrapper: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
  },
  bioInputField: {
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 0,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
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
