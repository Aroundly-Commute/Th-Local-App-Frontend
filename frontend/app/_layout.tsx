import React, { useEffect } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth';
import { CartProvider } from '../src/contexts/CartContext';
import { OrderProvider } from '../src/market/OrderContext';
import { MarketDataProvider } from '../src/contexts/MarketDataContext';
import { useColorScheme, BackHandler, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

// Ignore framework-level Expo DevTools fragment style prop warnings to prevent log lag and overlay popups
LogBox.ignoreLogs([
  'Invalid prop `style` supplied to `React.Fragment`',
]);

function AppNavigationWrapper() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onBackPress = () => {
      // If we are on the dashboard/index pages, let the system exit the app (return false)
      const isDashboard = 
        pathname === '/' || 
        pathname === '/index' || 
        pathname === '/(tabs)' || 
        pathname === '/(tabs)/home' || 
        pathname === '/(market)' || 
        pathname === '/home';

      if (isDashboard) {
        return false;
      }

      // If we can go back in the routing tree, do so
      if (router.canGoBack()) {
        router.back();
        return true; // We handled the event, do not exit the app
      }

      // Fallback: Redirect to dashboard
      router.replace('/(tabs)');
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      subscription.remove();
    };
  }, [pathname, router]);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(market)" />
      <Stack.Screen name="shop/[id]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="ride/[id]" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="chat/[chatId]" />
    </Stack>
  );
}

export default function RootLayout() {
  const cs = useColorScheme();
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <MarketDataProvider>
              <CartProvider>
              <OrderProvider>
                <StatusBar style={cs === 'dark' ? 'light' : 'dark'} />
                <AppNavigationWrapper />
              </OrderProvider>
            </CartProvider>
          </MarketDataProvider>
        </AuthProvider>
      </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
