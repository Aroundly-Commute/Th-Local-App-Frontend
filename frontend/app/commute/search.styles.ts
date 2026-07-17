import { StyleSheet } from 'react-native';
import { spacing, radius, shadowStyle } from '../../src/core/theme/theme';

export const styles = StyleSheet.create({
  tabBar: { flexDirection: 'row', padding: 4, borderRadius: radius.md, gap: 2 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radius.sm + 2 },
  tabBtnText: { fontSize: 14 },
  dot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  filters: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 9,
    borderWidth: 1, borderRadius: 9999,
    overflow: 'hidden',
  },
  filterChipText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
  cta: { height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700' },
  section: { fontSize: 17, fontWeight: '700', marginBottom: spacing.md, letterSpacing: -0.3 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius.md, borderWidth: 1 },
  recentIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  recentText: { flex: 1, fontSize: 13 },
  popularWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  popularChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 9999, borderWidth: 1 },
  popularText: { fontSize: 12, fontWeight: '600' },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  resultsCount: { fontSize: 15, fontWeight: '600' },
  iconBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, borderWidth: 1 },
  iconBtnText: { fontSize: 12, fontWeight: '600' },
  fakeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    gap: 8,
  },
  fakeInputText: {
    flex: 1,
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '500',
  },
  inputCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadowStyle('#000', { width: 0, height: 2 }, 0.05, 8, 3),
  },
  dropdownsContainer: {
    position: 'relative',
    gap: 0,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.xs,
    gap: 12,
  },
  dropdownLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  swapButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 99,
    ...shadowStyle('#000', { width: 0, height: 2 }, 0.15, 4, 4),
    color: '#ef4444',
  },
});

export default function StyleRoute() {
  return null;
}
