import { StyleSheet } from 'react-native';
import { spacing } from '../../src/core/theme/theme';

export const styles = StyleSheet.create({
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    height: 48,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ticketsContainer: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  bookAnotherCta: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookAnotherCtaTxt: {
    fontSize: 15,
    fontWeight: '800',
  },
});
