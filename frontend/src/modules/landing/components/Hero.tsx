import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Smartphone, Shield, CheckCircle } from 'lucide-react-native';

const googlePlayBadgeImg = require('../../../../assets/images/get-it-on-google-play-badge.png');
import { verdexColors } from '../../../core/theme/theme';
import { CabBuddySimulator } from './CabBuddySimulator';

interface HeroProps {
  isDesktop: boolean;
}

export function Hero({ isDesktop }: HeroProps) {
  const router = useRouter();

  return (
    <View style={styles.heroSection}>
      <View style={[styles.heroContent, isDesktop ? styles.row : styles.column]}>

        {/* Hero Left: Title and CTAs */}
        <View style={[styles.heroLeft, isDesktop ? { width: '55%', paddingRight: 40 } : { width: '100%', marginBottom: 40 }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚡ India's Smart Commuter App</Text>
          </View>
          <Text style={styles.heroTitle}>
            Smart Commutes.{"\n"}
            <Text style={{ color: verdexColors.lime }}>Shared Rides.</Text>{"\n"}
            Together.
          </Text>
          <Text style={styles.heroSubtitle}>
            Aroundly connects you with nearby verified travelers. Share routes via carpooling, navigate local public transit, or match with a <Text style={{ fontWeight: '700', color: verdexColors.lime }}>Cab Buddy</Text> to split your daily taxi and cab fares in half.
          </Text>

          <View style={[styles.heroActions, isDesktop ? styles.row : styles.column]}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={[styles.ctaPrimary, { backgroundColor: verdexColors.lime }]}
            >
              <Text style={styles.ctaPrimaryText}>Get Started</Text>
              <ArrowRight size={18} color="#0A1628" strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.bpandey690.frontend')}
              activeOpacity={0.8}
              style={{ justifyContent: 'center', alignItems: 'center' }}
            >
              <Image
                source={googlePlayBadgeImg}
                style={{ width: 175, height: 52 }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.heroTrust}>
            <View style={styles.trustItem}>
              <Shield size={16} color={verdexColors.lime} />
              <Text style={styles.trustText}>100% Verified Profiles</Text>
            </View>
            <View style={styles.trustItem}>
              <CheckCircle size={16} color={verdexColors.lime} />
              <Text style={styles.trustText}>Smart Fare Splitting</Text>
            </View>
          </View>
        </View>

        {/* Hero Right: Interactive Cab Buddy Simulator */}
        <View style={[styles.heroRight, isDesktop ? { width: '45%' } : { width: '100%' }]}>
          <CabBuddySimulator />
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
  heroSection: {
    backgroundColor: '#0A1628',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#142E58',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  badgeText: {
    color: '#00E5CC',
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 56,
    marginBottom: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#A0B2C6',
    lineHeight: 26,
    marginBottom: 36,
  },
  heroActions: {
    gap: 16,
    marginBottom: 40,
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  ctaPrimaryText: {
    color: '#0A1628',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderColor: '#1A4070',
    borderWidth: 1.5,
  },
  ctaSecondaryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  heroTrust: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    color: '#A0B2C6',
    fontSize: 13,
    fontWeight: '500',
  },
  heroRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
