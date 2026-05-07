import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const cs = useColorScheme();
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <StatusBar style={cs === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="ride/[id]" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="chat/[chatId]" />
          </Stack>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
