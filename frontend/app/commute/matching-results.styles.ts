import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../src/core/theme/theme';

export const styles = StyleSheet.create({
  ridePanel: {
    marginHorizontal: spacing.lg,
    marginTop: 12,
    marginBottom: 8,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  matchCard: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
