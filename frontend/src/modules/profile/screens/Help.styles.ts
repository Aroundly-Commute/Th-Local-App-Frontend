import { StyleSheet } from 'react-native';
import { spacing, radius } from '../../../core/theme/theme';

export const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  sectionDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  faqList: {
    gap: spacing.sm,
  },
  faqItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: spacing.sm,
  },
  faqAnswerContainer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
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
  messageWrapper: {
    height: 110,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  messageInputField: {
    height: 90,
    textAlignVertical: 'top',
    paddingTop: 0,
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
  directChannels: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  channelTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  channelValue: {
    fontSize: 14,
    fontWeight: '600',
  },
});
