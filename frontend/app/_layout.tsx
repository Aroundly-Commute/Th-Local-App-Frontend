import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth';
import { CartProvider } from '../src/contexts/CartContext';
import { OrderProvider } from '../src/market/OrderContext';
import { MarketDataProvider } from '../src/contexts/MarketDataContext';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const cs = useColorScheme();
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <MarketDataProvider>
            <CartProvider>
              <OrderProvider>
                <StatusBar style={cs === 'dark' ? 'light' : 'dark'} />
                <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(market)" />
                  <Stack.Screen name="shop/[id]" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="ride/[id]" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="chat/[chatId]" />
                </Stack>
              </OrderProvider>
            </CartProvider>
          </MarketDataProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
