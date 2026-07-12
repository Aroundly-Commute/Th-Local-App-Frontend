import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Image,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '../../../core/auth/auth';
import { lightTheme, darkTheme, spacing, radius } from '../../../core/theme/theme';
import { tap } from '../../../core/utils/haptics';

const cabBuddyPromoImg = require('../../../../assets/images/cab_buddy_promo.webp');
const carpoolPromoImg = require('../../../../assets/images/carpool_promo.webp');
const offerRidePromoImg = require('../../../../assets/images/offer_ride_promo.webp');

export default function IntroScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const t = lightTheme;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const { width: screenWidth } = Dimensions.get('window');

  // Prevent web users from accessing the intro screen
  useEffect(() => {
    if (Platform.OS === 'web') {
      router.replace('/');
    }
  }, []);

  const slides = [
    {
      title: 'Ride Sharing App',
      description: 'Ride Together, Save Together',
      image: require('../../../../assets/images/app_Icon_less_padding.png'),
      isLogo: true,
    },
    {
      title: 'Share a Cab',
      description: 'Matches two people going to the same route, so that they can book a cab and split the fare.',
      image: cabBuddyPromoImg,
    },
    {
      title: 'Car Pooling',
      description: 'Going to some place? Request nearby, pool in with your neighbour going on the same route.',
      image: carpoolPromoImg,
    },
    {
      title: 'Offer a Ride',
      description: 'Share your journey by registering your vehicle and offering rides. Help the environment and share fuel costs.',
      image: offerRidePromoImg,
    },
  ];

  const handleFinishIntro = async () => {
    tap();
    try {
      await AsyncStorage.setItem('intro_completed', 'true');
      if (user) {
        const onboarded = await AsyncStorage.getItem(`onboarded_${user.id}`);
        const nameIsValid = user.name && !user.name.startsWith('Aroundler') && !/^\+?\d+$/.test(user.name.trim());
        const isAlreadyConfigured = nameIsValid && user.phoneNumber;
        if (onboarded === 'true' || isAlreadyConfigured) {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err) {
      console.error('[INTRO] Failed to complete intro:', err);
      // Fallback
      router.replace('/(auth)/login');
    }
  };

  const handleNext = () => {
    tap();
    if (activeIndex < slides.length - 1) {
      scrollViewRef.current?.scrollTo({
        x: (activeIndex + 1) * screenWidth,
        animated: true,
      });
      setActiveIndex(activeIndex + 1);
    } else {
      handleFinishIntro();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / screenWidth);
    if (index !== activeIndex && index >= 0 && index < slides.length) {
      setActiveIndex(index);
    }
  };

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.background }]}>
      {/* Skip Button Top Right */}
      <View style={styles.header}>
        {activeIndex < slides.length - 1 ? (
          <TouchableOpacity
            testID="intro-skip-btn"
            onPress={handleFinishIntro}
            activeOpacity={0.7}
            style={[styles.skipButton, { backgroundColor: t.muted }]}
          >
            <Text style={[styles.skipText, { color: t.textSecondary }]}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipPlaceholder} />
        )}
      </View>

      {/* Slide Carousels */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {slides.map((slide, index) => (
          <View key={index} style={[styles.slide, { width: screenWidth }]}>
            <View style={styles.imageContainer}>
              <Image
                source={slide.image}
                style={slide.isLogo ? { width: 220, height: 180 } : styles.image}
                resizeMode={slide.isLogo ? 'contain' : 'cover'}
              />
            </View>
            <View style={styles.content}>
              {slide.title ? (
                <Text style={[styles.title, { color: t.textPrimary }]}>{slide.title}</Text>
              ) : null}
              <Text style={[styles.description, { color: t.textSecondary }]}>
                {slide.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Footer Section */}
      <View style={styles.footer}>
        {/* Dot Indicators */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: activeIndex === index ? t.primary : t.border,
                  width: activeIndex === index ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA Button */}
        {activeIndex === slides.length - 1 ? (
          <TouchableOpacity
            testID="intro-next-btn"
            onPress={handleNext}
            activeOpacity={0.85}
            style={[styles.ctaButton, { backgroundColor: t.primary }]}
          >
            <Text style={[styles.ctaText, { color: t.primaryContrast }]}>
              Let's Go Aroundly
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.ctaButton, { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 }]} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  skipPlaceholder: {
    height: 36,
  },
  carousel: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  imageContainer: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  image: {
    width: '90%',
    height: '90%',
    borderRadius: radius.lg,
  },
  content: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    width: '100%',
    paddingTop: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    flexDirection: 'row',
    height: 54,
    borderRadius: radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
