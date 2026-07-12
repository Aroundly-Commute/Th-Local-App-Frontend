import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useAuth } from '../src/core/auth/auth';
import { lightTheme, darkTheme } from '../src/core/theme/theme';
import { useColorScheme } from 'react-native';

// Imported modular components
import { Header } from '../src/modules/landing/components/Header';
import { Hero } from '../src/modules/landing/components/Hero';
import { Features } from '../src/modules/landing/components/Features';
import { ConceptShowcase } from '../src/modules/landing/components/ConceptShowcase';
import { SeoText } from '../src/modules/landing/components/SeoText';
import { FaqSection } from '../src/modules/landing/components/FaqSection';
import { Footer } from '../src/modules/landing/components/Footer';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isDesktop = width > 800;

  // 1. Manage Location & Notification permissions inside index
  useEffect(() => {
    // Only request permission if we are on mobile, or if we are web but logged in
    if (Platform.OS === 'web' && !user) return;

    (async () => {
      try {
        const hasRequested = await AsyncStorage.getItem('permissions_requested');
        if (!hasRequested) {
          // Request Location Permission first
          await Location.requestForegroundPermissionsAsync().catch(() => { });

          // Introduce a 2-second delay to prevent OS stacking/suppression bugs
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Request Notification Permission second
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

    const handleRedirects = async () => {
      // If we are on mobile, check if the one-time intro is completed first
      if (Platform.OS !== 'web') {
        const introCompleted = await AsyncStorage.getItem('intro_completed');
        if (introCompleted !== 'true') {
          router.replace('/intro');
          return;
        }
      }

      if (user) {
        const val = await AsyncStorage.getItem(`onboarded_${user.id}`);
        const nameIsValid = user.name && !user.name.startsWith('Aroundler') && !/^\+?\d+$/.test(user.name.trim());
        const isAlreadyConfigured = nameIsValid && user.phoneNumber;
        if (val === 'true' || isAlreadyConfigured) {
          if (isAlreadyConfigured) {
            await AsyncStorage.setItem(`onboarded_${user.id}`, 'true').catch(() => { });
          }
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        // Redirect mobile users to login screen
        if (Platform.OS !== 'web') {
          router.replace('/(auth)/login');
        }
      }
    };

    handleRedirects().catch(err => console.error('[INDEX] Redirect error:', err));
  }, [user, loading]);

  const scrollToSection = (id: string) => {
    if (Platform.OS === 'web') {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Loader logic:
  // 1. On mobile (iOS/Android): show loader while auth is loading or if we don't have a user session (to redirect to login/intro)
  // 2. On web client: only show loader if the user is logged in (to redirect to the dashboard/(tabs))
  // 3. During server-side rendering / static export: user is null, so it will NOT show loader and instead export the full landing page content
  // Always render loader/spinner on mobile to allow routing redirect to complete
  if (Platform.OS !== 'web') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    );
  }

  // Loader logic for Web:
  // Show loader if the user is logged in (to redirect to the dashboard/(tabs))
  const showLoader = user !== null;

  if (showLoader) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
        <ActivityIndicator color={t.primary} size="large" />
      </View>
    );
  }

  // Render Web Landing Page (Web Guest View)
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {Platform.OS === 'web' && (
        <Head>
          <link rel="canonical" href="https://www.aroundly.in/" />
          <meta property="og:url" content="https://www.aroundly.in/" />
          <meta property="twitter:url" content="https://www.aroundly.in/" />
        </Head>
      )}
      <Header t={t} isDesktop={isDesktop} scrollToSection={scrollToSection} />
      <Hero isDesktop={isDesktop} />
      <Features t={t} isDesktop={isDesktop} />
      <ConceptShowcase isDesktop={isDesktop} />
      <SeoText t={t} />
      <FaqSection t={t} />
      <Footer isDesktop={isDesktop} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
