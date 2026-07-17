import { StyleSheet } from 'react-native';
import { spacing, radius, shadowStyle } from '../../src/core/theme/theme';

export const styles = StyleSheet.create({
  ridePanel: {
    marginHorizontal: spacing.lg,
    marginTop: 12,
    marginBottom: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    ...shadowStyle('#000', { width: 0, height: 1 }, 0.05, 3, 2),
  },
  matchCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: 10,
    ...shadowStyle('#000', { width: 0, height: 1 }, 0.05, 4, 2),
  },
  inviteBtn: {
    height: 40,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  }
});

export default function StyleRoute() {
  return null;
}
