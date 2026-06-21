import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
  Linking
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useAuth } from '../src/core/auth/auth';
import { lightTheme, darkTheme, spacing, radius, verdexColors } from '../src/core/theme/theme';
import { useColorScheme } from 'react-native';
import {
  Car,
  MapPin,
  Users,
  DollarSign,
  ChevronRight,
  Shield,
  Clock,
  ArrowRight,
  Info,
  Smartphone,
  Navigation,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Award
} from 'lucide-react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isDesktop = width > 800;
  const isTablet = width > 500 && width <= 800;

  // State for interactive Cab Buddy Demo
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(true);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // FAQ Expand state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // 1. Manage Location & Notification permissions inside index
  useEffect(() => {
    // Only request permission if we are on mobile, or if we are web but logged in
    if (Platform.OS === 'web' && !user) return;

    (async () => {
      try {
        const hasRequested = await AsyncStorage.getItem('permissions_requested');
        if (!hasRequested) {
          // Request Location Permission
          await Location.requestForegroundPermissionsAsync().catch(() => { });

          // Request Notification Permission
          if (Platform.OS !== 'web') {
            try {
              const { default: messaging } = require('@react-native-firebase/messaging');
              await messaging().requestPermission().catch(() => { });
            } catch (err) {
              console.warn('[PERMISSIONS] Messaging import fail:', err);
            }
          }
          await AsyncStorage.setItem('permissions_requested', 'true');
        }
      } catch (err) {
        console.warn('[PERMISSIONS] Error asking permissions:', err);
      }
    })();
  }, [user]);

  // 2. Auth checking & redirects
  useEffect(() => {
    if (loading) return;
    if (user) {
      AsyncStorage.getItem(`onboarded_${user.id}`).then((val) => {
        const isAlreadyConfigured = user.name && !user.name.startsWith('Aroundler') && user.phoneNumber;
        if (val === 'true' || isAlreadyConfigured) {
          if (isAlreadyConfigured) {
            AsyncStorage.setItem(`onboarded_${user.id}`, 'true').catch(() => { });
          }
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      });
    } else {
      // Redirect mobile users to login screen
      if (Platform.OS !== 'web') {
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading]);

  // 3. Cab Buddy interactive simulator autoplay
  useEffect(() => {
    if (isDemoPlaying) {
      demoIntervalRef.current = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 3);
      }, 3500);
    }
    return () => {
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, [isDemoPlaying]);

  const selectDemoStep = (step: number) => {
    setIsDemoPlaying(false);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    setDemoStep(step);
  };

  const scrollToSection = (id: string) => {
    if (Platform.OS === 'web') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // If loading or we are on mobile, show loader (redirection in progress)
  if (loading || (Platform.OS !== 'web' && !user)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    );
  }

  // If user is logged in, show loader (redirection in progress)
  if (user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    );
  }

  // Render Web Landing Page (Web Guest View)
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header / Navigation Bar */}
      <View style={[styles.header, { borderBottomColor: t.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/app_Icon_less_padding.png')}
              style={styles.logoImage}
            />
          </View>

          {isDesktop && (
            <View style={styles.navLinks}>
              <TouchableOpacity
                disabled={true}
                style={[styles.navLink, Platform.OS === 'web' && { cursor: 'default' }]}
              >
                <Text style={[styles.navLinkText, { color: t.textPrimary, fontWeight: '700' }]}>Features</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollToSection('cab-buddy')} style={styles.navLink}>
                <Text style={[styles.navLinkText, { color: t.textSecondary }]}>Cab Buddy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => scrollToSection('faq')} style={styles.navLink}>
                <Text style={[styles.navLinkText, { color: t.textSecondary }]}>FAQs</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/privacy')} style={styles.navLink}>
                <Text style={[styles.navLinkText, { color: t.textSecondary }]}>Privacy Policy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/help')} style={styles.navLink}>
                <Text style={[styles.navLinkText, { color: t.textSecondary }]}>Help Support</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={[styles.loginBtn, { backgroundColor: t.primary }]}
            >
              <Text style={[styles.loginBtnText, { color: t.primaryContrast }]}>Open App / Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. Hero Section (Premium Dark Navy Theme) */}
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
                onPress={() => Linking.openURL('https://play.google.com/store')}
                style={styles.ctaSecondary}
              >
                <Smartphone size={18} color="#FFFFFF" />
                <Text style={styles.ctaSecondaryText}>Download Android App</Text>
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
            <View style={styles.simulatorCard}>
              <View style={styles.simHeader}>
                <View style={styles.redDot} />
                <View style={styles.yellowDot} />
                <View style={styles.greenDot} />
                <Text style={styles.simTitle}>Cab Buddy Matcher Simulator</Text>
              </View>

              {/* Demo view based on step */}
              <View style={styles.simBody}>
                {demoStep === 0 && (
                  <View style={styles.stepContainer}>
                    <Text style={styles.stepTitle}>Step 1: Searching route matches...</Text>
                    <View style={styles.matchingBox}>
                      <View style={styles.avatarRow}>
                        <View style={styles.demoAvatarContainer}>
                          <Text style={styles.avatarInitial}>A</Text>
                          <Text style={styles.avatarLabel}>Ayaan</Text>
                        </View>
                        <View style={styles.radarPulse}>
                          <ActivityIndicator color={verdexColors.lime} size="small" />
                          <Text style={styles.radarText}>Scanning...</Text>
                        </View>
                        <View style={styles.demoAvatarContainer}>
                          <Text style={styles.avatarInitial}>A</Text>
                          <Text style={styles.avatarLabel}>Anaya</Text>
                        </View>
                      </View>
                      <View style={styles.routeDetails}>
                        <MapPin size={14} color={verdexColors.lime} />
                        <Text style={styles.routeText}>Dest: Cyber City, Gurgaon</Text>
                      </View>
                    </View>
                  </View>
                )}

                {demoStep === 1 && (
                  <View style={styles.stepContainer}>
                    <Text style={[styles.stepTitle, { color: verdexColors.lime }]}>🎉 Step 2: Cab Buddy Match Found!</Text>
                    <View style={styles.matchedBox}>
                      <View style={styles.matchStats}>
                        <Text style={styles.matchPercent}>94% Overlap</Text>
                        <Text style={styles.matchSub}>Highly compatible commuter route</Text>
                      </View>
                      <View style={styles.ridePathCard}>
                        <View style={styles.pathNode}>
                          <View style={styles.nodePoint} />
                          <Text style={styles.nodeText}>Start: Sector 62 / Sector 63</Text>
                        </View>
                        <View style={styles.pathLine} />
                        <View style={styles.pathNode}>
                          <View style={[styles.nodePoint, { backgroundColor: verdexColors.lime }]} />
                          <Text style={styles.nodeText}>End: Cyber City</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}

                {demoStep === 2 && (
                  <View style={styles.stepContainer}>
                    <Text style={[styles.stepTitle, { color: '#4DE8D8' }]}>💰 Step 3: Fare Split & Save!</Text>
                    <View style={styles.splitBox}>
                      <View style={styles.fareComparison}>
                        <View style={styles.fareBarSingle}>
                          <Text style={styles.fareBarLabel}>Solo ride cost</Text>
                          <View style={styles.barSolo} />
                          <Text style={styles.fareCost}>₹360</Text>
                        </View>
                        <View style={styles.fareBarShared}>
                          <Text style={styles.fareBarLabel}>With Cab Buddy</Text>
                          <View style={styles.barShared} />
                          <Text style={[styles.fareCost, { color: verdexColors.lime }]}>₹180 each</Text>
                        </View>
                      </View>
                      <View style={styles.savingsTag}>
                        <Text style={styles.savingsText}>You saved 50% on your travel cost!</Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Step indicator controls */}
              <View style={styles.simControls}>
                {[0, 1, 2].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => selectDemoStep(s)}
                    style={[
                      styles.indicatorDot,
                      demoStep === s ? styles.indicatorActive : styles.indicatorInactive
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.simHint}>Demo loops automatically. Click dots to control.</Text>
            </View>
          </View>

        </View>
      </View>

      {/* 3. Features Section */}
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

      {/* 4. Detailed "Cab Buddy" Concept Showcase */}
      <View id="cab-buddy" style={[styles.conceptSection, { backgroundColor: '#0F2240' }]}>
        <View style={[styles.conceptContent, isDesktop ? styles.row : styles.column]}>
          <View style={[styles.conceptLeft, isDesktop ? { width: '45%' } : { width: '100%', marginBottom: 30 }]}>
            <Image
              source={require('../assets/images/app-image.jpg')}
              style={styles.conceptImage}
            />
          </View>
          <View style={[styles.conceptRight, isDesktop ? { width: '55%', paddingLeft: 40 } : { width: '100%' }]}>
            <Text style={styles.conceptPreTitle}>THE CAB BUDDY CONCEPT</Text>
            <Text style={styles.conceptTitle}>How two random strangers save ₹10,000+ monthly</Text>
            <Text style={styles.conceptDesc}>
              Cab Buddy is a revolutionary taxi-sharing system designed for commuters in high-traffic Indian metro areas. When you want to travel to a destination, instead of booking an expensive single-passenger cab, Aroundly scans your neighborhood for matches.
            </Text>

            <View style={styles.stepsList}>
              <View style={styles.stepListItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepItemTitle}>Enter Your Destination</Text>
                  <Text style={styles.stepItemDesc}>Type where you want to go. The app instantly begins locating users on similar trajectories.</Text>
                </View>
              </View>

              <View style={styles.stepListItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepItemTitle}>Get Paired & Chat</Text>
                  <Text style={styles.stepItemDesc}>Connect with your verified Cab Buddy via in-app chat. Filter matches by rating, company, or gender.</Text>
                </View>
              </View>

              <View style={styles.stepListItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepItemTitle}>Ride & Split Fares</Text>
                  <Text style={styles.stepItemDesc}>Book your cab (Ola, Uber, or local taxi), ride together safely, and split the final bill 50/50 instantly.</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 5. SEO Text Blocks & Keywords (Perfect Search Console Indexing) */}
      <View style={[styles.seoCopySection, { backgroundColor: t.surfaceElevated }]}>
        <View style={styles.seoContent}>
          <Text style={[styles.seoH2, { color: t.textPrimary }]}>Aroundly: India's Premium Carpool & Split Fare Cab Sharing Platform</Text>
          <Text style={[styles.seoParagraph, { color: t.textSecondary }]}>
            In today's urban commute environment across major Indian metropolises like Bengaluru, Delhi, Mumbai, Pune, and Gurgaon, travel expenses are skyrocketing. Aroundly offers an integrated commuting software app designed to tackle these cost and environment concerns. By combining **corporate carpooling, daily car sharing, bus-metro public transport timing**, and our signature **Cab Buddy split fare matching**, we empower users to commute smarter.
          </Text>
          <Text style={[styles.seoParagraph, { color: t.textSecondary }]}>
            When two random people search for a ride to cyber hubs or office sectors, Aroundly matches them to share the fare. Searching for a **carpool near me**, **cab sharing app Bangalore**, or **taxi split bill app India**? Aroundly is your all-in-one answer. Sign in today using Google or your phone number to find a verified buddy, share cab rides, and start saving!
          </Text>
        </View>
      </View>

      {/* 6. FAQ Section */}
      <View id="faq" style={[styles.section, { backgroundColor: t.background }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionPreTitle, { color: t.textSecondary }]}>QUESTIONS & ANSWERS</Text>
          <Text style={[styles.sectionTitleText, { color: t.textPrimary }]}>Frequently Asked Questions</Text>
        </View>

        <View style={styles.faqList}>
          {[
            {
              q: "What is a 'Cab Buddy'?",
              a: "Cab Buddy is a smart ride-sharing matching algorithm. If you want to travel to a destination (e.g. from Sector 62 to Cyber City) and do not want to bear full cab fares alone, Cab Buddy pairs you with another verified traveler heading on the exact same route. You can coordinate, book a cab, and split the final bill."
            },
            {
              q: "Is it safe to ride with random people?",
              a: "Safety is our priority. Every user on Aroundly must verify their email, mobile phone number, and Google profile. We offer safety filters (like 'Same Gender Matches Only' and corporate company verification) so you only share rides with people you feel comfortable with."
            },
            {
              q: "How are payments split?",
              a: "Aroundly computes the overlapping mileage and provides a direct split-fare recommendation. Once you reach your destination, you can split the payment using in-app wallet settlements or peer-to-peer UPI transfers instantly."
            }
          ].map((faq, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setExpandedFaq(expandedFaq === index ? null : index)}
              style={[styles.faqItem, { borderColor: t.border }]}
              activeOpacity={0.85}
            >
              <View style={styles.faqQuestionRow}>
                <Text style={[styles.faqQuestion, { color: t.textPrimary }]}>{faq.q}</Text>
                <HelpCircle size={18} color={t.textTertiary} />
              </View>
              {expandedFaq === index && (
                <Text style={[styles.faqAnswer, { color: t.textSecondary }]}>{faq.a}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 7. Footer */}
      <View style={styles.footer}>
        <View style={[styles.footerContent, isDesktop ? styles.row : styles.column]}>
          <View style={[styles.footerLeft, isDesktop ? { width: '40%' } : { width: '100%', marginBottom: 30 }]}>
            <Image
              source={require('../assets/images/app_Icon.png')}
              style={{ 
                width: 50, 
                height: 50, 
                resizeMode: 'contain', 
                backgroundColor: '#FFFFFF', 
                borderRadius: 10,
                padding: 4,
                marginBottom: 16 
              }}
            />
            <Text style={styles.footerText}>
              Aroundly is India's leading commuter ride-sharing and split-fare matching application. Travel smarter, reduce emissions, and split bills seamlessly.
            </Text>
          </View>
          <View style={[styles.footerRight, isDesktop ? { width: '60%' } : { width: '100%' }]}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Company</Text>
              <TouchableOpacity onPress={() => router.push('/privacy')}><Text style={styles.footerLink}>Privacy Policy</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/help')}><Text style={styles.footerLink}>Help & Support</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/coming-soon')}><Text style={styles.footerLink}>About Us</Text></TouchableOpacity>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Legal & SEO</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://aroundly.in/robots.txt')}><Text style={styles.footerLink}>Robots.txt</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://aroundly.in/sitemap.xml')}><Text style={styles.footerLink}>Sitemap.xml</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/delete-account')}><Text style={styles.footerLink}>Delete Account</Text></TouchableOpacity>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Support</Text>
              <Text style={styles.footerLink}>support@aroundly.in</Text>
              <Text style={styles.footerLink}>Gurgaon, Haryana, India</Text>
            </View>
          </View>
        </View>
        <View style={styles.footerBottom}>
          <Text style={styles.copyright}>© 2026 Aroundly India. All rights reserved. Built for smarter, green commutes.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  column: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  // Header styles
  header: {
    height: 70,
    borderBottomWidth: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 24,
    zIndex: 100,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'between',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 68,
    height: 54,
    resizeMode: 'contain',
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 32,
    flex: 1,
  },
  navLink: {
    marginHorizontal: 14,
    paddingVertical: 8,
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Hero section styles
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
  // Hero Right (Simulator)
  heroRight: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  simulatorCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F2240',
    borderRadius: 16,
    borderColor: '#1A4070',
    borderWidth: 1.5,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#142E58',
    paddingBottom: 12,
    marginBottom: 16,
  },
  redDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FF5F56', marginRight: 6 },
  yellowDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFBD2E', marginRight: 6 },
  greenDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#27C93F', marginRight: 10 },
  simTitle: { color: '#889EB5', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  simBody: {
    minHeight: 180,
    justifyContent: 'center',
  },
  stepContainer: {
    alignItems: 'stretch',
  },
  stepTitle: {
    color: '#A0B2C6',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  matchingBox: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#142E58',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  demoAvatarContainer: {
    alignItems: 'center',
  },
  avatarInitial: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E40af',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 48,
    fontSize: 18,
    fontWeight: '700',
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  radarPulse: {
    alignItems: 'center',
  },
  radarText: {
    color: '#00E5CC',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '600',
  },
  routeDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  routeText: {
    color: '#A0B2C6',
    fontSize: 12,
  },
  matchedBox: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#00B5A0',
  },
  matchStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  matchPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00E5CC',
  },
  matchSub: {
    fontSize: 11,
    color: '#889EB5',
    marginTop: 2,
  },
  ridePathCard: {
    gap: 2,
  },
  pathNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nodePoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  nodeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pathLine: {
    width: 2,
    height: 16,
    backgroundColor: '#142E58',
    marginLeft: 3,
  },
  splitBox: {
    backgroundColor: '#0A1628',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4DE8D8',
  },
  fareComparison: {
    gap: 12,
    marginBottom: 16,
  },
  fareBarSingle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareBarShared: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fareBarLabel: {
    color: '#A0B2C6',
    fontSize: 11,
    width: 90,
  },
  barSolo: {
    flex: 1,
    height: 8,
    backgroundColor: '#ef4444',
    borderRadius: 4,
    marginHorizontal: 10,
  },
  barShared: {
    flex: 1,
    height: 8,
    backgroundColor: '#00E5CC',
    borderRadius: 4,
    marginHorizontal: 10,
    width: '50%',
  },
  fareCost: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    width: 70,
    textAlign: 'right',
  },
  savingsTag: {
    backgroundColor: '#0F2240',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  savingsText: {
    color: '#4DE8D8',
    fontSize: 11,
    fontWeight: '700',
  },
  simControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 14,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorActive: {
    backgroundColor: '#00E5CC',
    width: 18,
  },
  indicatorInactive: {
    backgroundColor: '#1A4070',
  },
  simHint: {
    color: '#889EB5',
    fontSize: 10,
    textAlign: 'center',
  },
  // Features section styles
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
  // Cab Buddy detailed section
  conceptSection: {
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  conceptContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  conceptLeft: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptImage: {
    width: '100%',
    maxWidth: 320,
    height: 380,
    resizeMode: 'contain',
  },
  conceptRight: {
    justifyContent: 'center',
  },
  conceptPreTitle: {
    color: '#00E5CC',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  conceptTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 18,
  },
  conceptDesc: {
    color: '#A0B2C6',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 30,
  },
  stepsList: {
    gap: 20,
  },
  stepListItem: {
    flexDirection: 'row',
    alignItems: 'start',
    gap: 16,
  },
  stepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#142E58',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepNumber: {
    color: '#00E5CC',
    fontWeight: '700',
    fontSize: 14,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepItemTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepItemDesc: {
    color: '#A0B2C6',
    fontSize: 13,
    lineHeight: 20,
  },
  // SEO Copy section
  seoCopySection: {
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  seoContent: {
    maxWidth: 1000,
    alignSelf: 'center',
  },
  seoH2: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  seoParagraph: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  // FAQ section
  faqList: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  faqItem: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    paddingRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  // Footer styles
  footer: {
    backgroundColor: '#0A1628',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  footerContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#142E58',
    paddingBottom: 40,
    marginBottom: 24,
  },
  footerLeft: {
    paddingRight: 20,
  },
  footerLogo: {
    width: 120,
    height: 36,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  footerText: {
    color: '#889EB5',
    fontSize: 13,
    lineHeight: 20,
  },
  footerRight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 30,
  },
  footerCol: {
    minWidth: 120,
  },
  footerColTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  footerLink: {
    color: '#889EB5',
    fontSize: 13,
    marginBottom: 10,
  },
  footerBottom: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  copyright: {
    color: '#556A80',
    fontSize: 11,
    textAlign: 'center',
  },
});


