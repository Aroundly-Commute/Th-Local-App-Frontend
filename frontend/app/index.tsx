import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/core/auth/auth';
import { lightTheme, darkTheme } from '../src/core/theme/theme';
import { useColorScheme } from 'react-native';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    if (loading) return;
    if (user) {
      // Check if user has completed onboarding process, or already has both name and phone configured (so they aren't brand-new)
      AsyncStorage.getItem(`onboarded_${user.id}`).then((val) => {
        const isAlreadyConfigured = user.name && !user.name.startsWith('GoPooler') && user.phoneNumber;
        if (val === 'true' || isAlreadyConfigured) {
          if (isAlreadyConfigured) {
            AsyncStorage.setItem(`onboarded_${user.id}`, 'true').catch(() => {});
          }
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      });
    } else {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
      <ActivityIndicator color={t.primary} size="large" />
    </View>
  );
}

