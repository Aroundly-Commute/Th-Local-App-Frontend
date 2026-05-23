import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/core/auth/auth';
import { lightTheme, darkTheme } from '../src/core/theme/theme';
import { useColorScheme } from 'react-native';
import { ModeSwitcher } from '../src/core/components/ModeSwitcher';

export default function Index() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    if (loading) return;
    if (user) router.replace('/(tabs)');
    else router.replace('/(auth)/login');
  }, [user, loading]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.background }}>
      <ActivityIndicator color={t.primary} size="large" />
    </View>
  );
}
