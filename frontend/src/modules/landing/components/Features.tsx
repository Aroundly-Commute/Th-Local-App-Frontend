import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Car, Users, Navigation, CheckCircle } from 'lucide-react-native';
import { verdexColors } from '../../../core/theme/theme';

interface FeaturesProps {
  t: any;
  isDesktop: boolean;
}

export function Features({ t, isDesktop }: FeaturesProps) {
  return (
    <View id="features" style={[styles.section, { backgroundColor: t.background }]}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionPreTitle, { color: t.textSecondary }]}>CORE FEATURES</Text>
        <Text style={[styles.sectionTitleText, { color: t.textPrimary }]}>Better ways to commute daily</Text>
        <Text style={[styles.sectionDescText, { color: t.textSecondary }]}>
          Whether you want to drive, share a cab, split bills, or ride public transit, Aroundly provides the ultimate routing solutions in a single app.
        </Text>
      </View>

      <View style={[styles.featuresGrid, isDesktop ? styles.row : styles.column]}>
        {/* Feature 1: Carpooling */}
        <View style={[styles.featureCard, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: t.accentBg }]}>
            <Car size={24} color={t.accent} />
          </View>
          <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Smart Carpooling</Text>
          <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
            Match with colleagues and verified commuters going your way. Reduce traffic congestion, save fuel costs, and make your daily office commutes eco-friendly.
          </Text>
          <View style={styles.cardBulletRow}>
            <CheckCircle size={14} color={t.success} />
            <Text style={[styles.bulletText, { color: t.textSecondary }]}>Verified corporate profiles</Text>
          </View>
          <View style={styles.cardBulletRow}>
            <CheckCircle size={14} color={t.success} />
            <Text style={[styles.bulletText, { color: t.textSecondary }]}>Custom route matching algorithms</Text>
          </View>
        </View>

        {/* Feature 2: Cab Buddy (Highlight) */}
        <View style={[styles.featureCard, { backgroundColor: t.surfaceElevated, borderColor: verdexColors.g500, borderWidth: 1.5 }]}>
          <View style={styles.promoTag}>
            <Text style={styles.promoTagText}>POPULAR CONCEPT</Text>
          </View>
          <View style={[styles.iconWrapper, { backgroundColor: '#CCF7F3' }]}>
            <Users size={24} color={verdexColors.g500} />
          </View>
          <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Cab Buddy (Split Fares)</Text>
          <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
            Why pay for a whole cab solo? Search your destination to match with nearby random commuters going the same way. Book a cab together and split the bill automatically.
          </Text>
          <View style={styles.cardBulletRow}>
            <CheckCircle size={14} color={verdexColors.g500} />
            <Text style={[styles.bulletText, { color: t.textSecondary }]}>Instantly split cab costs 50/50</Text>
          </View>
          <View style={styles.cardBulletRow}>
            <CheckCircle size={14} color={verdexColors.g500} />
            <Text style={[styles.bulletText, { color: t.textSecondary }]}>Safe, gender-filtered matches</Text>
          </View>
        </View>

        {/* Feature 3: Public Transport */}
        <View style={[styles.featureCard, { backgroundColor: t.surfaceElevated, borderColor: t.border }]}>
          <View style={[styles.iconWrapper, { backgroundColor: t.accentBg }]}>
            <Navigation size={24} color={t.accent} />
          </View>
          <Text style={[styles.cardTitle, { color: t.textPrimary }]}>Public Transport</Text>
          <Text style={[styles.cardDesc, { color: t.textSecondary }]}>
            Navigate your city via local metro, trains, and buses with real-time timetables, transit routing, schedules, and integrated navigation support.
          </Text>
          <View style={styles.cardBulletRow}>
            <CheckCircle size={14} color={t.success} />
            <Text style={[styles.bulletText, { color: t.textSecondary }]}>Live metro & bus schedules</Text>
          </View>
          <View style={styles.cardBulletRow}>
            <CheckCircle size={14} color={t.success} />
            <Text style={[styles.bulletText, { color: t.textSecondary }]}>Multi-modal journey options</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  section: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    alignItems: 'center',
    maxWidth: 800,
    alignSelf: 'center',
    marginBottom: 60,
  },
  sectionPreTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  sectionTitleText: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
    textAlign: 'center',
  },
  sectionDescText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
  },
  featuresGrid: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    gap: 24,
    justifyContent: 'space-between',
  },
  featureCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  promoTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#CCF7F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promoTagText: {
    color: '#00B5A0',
    fontSize: 9,
    fontWeight: '700',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  cardBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  bulletText: {
    fontSize: 13,
  },
});
