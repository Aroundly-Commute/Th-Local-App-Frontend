import React, { useEffect, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/auth';
import { CartProvider } from '../src/contexts/CartContext';
import { OrderProvider } from '../src/market/OrderContext';
import { MarketDataProvider } from '../src/contexts/MarketDataContext';
import { useColorScheme, BackHandler, LogBox, View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { Terminal } from 'lucide-react-native';
import { LogViewerModal } from '../src/components/common/LogViewerModal';
import '../src/services/logger'; // Boot up console interception immediately
import { FeatureFlagProvider } from '../src/services/feature-flag/FeatureFlagContext';

// Ignore framework-level Expo DevTools fragment style prop warnings to prevent log lag and overlay popups
LogBox.ignoreLogs([
  'Invalid prop `style` supplied to `React.Fragment`',
]);

function AppNavigationWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const [logsVisible, setLogsVisible] = useState(false);

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
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(market)" />
        <Stack.Screen name="shop/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="ride/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="chat/[chatId]" />
      </Stack>

      {/* Floating Subtle In-App Log Viewer Trigger */}
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() => setLogsVisible(true)}
        style={styles.floatingDebugBtn}
      >
        <Terminal color="#FFFFFF" size={14} strokeWidth={2.5} />
      </TouchableOpacity>

      <LogViewerModal visible={logsVisible} onClose={() => setLogsVisible(false)} />
    </View>
  );
}

export default function RootLayout() {
  const cs = useColorScheme();
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <FeatureFlagProvider>
              <MarketDataProvider>
                <CartProvider>
                  <OrderProvider>
                    <StatusBar style={cs === 'dark' ? 'light' : 'dark'} />
                    <AppNavigationWrapper />
                  </OrderProvider>
                </CartProvider>
              </MarketDataProvider>
            </FeatureFlagProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  floatingDebugBtn: {
    position: 'absolute',
    top: 50,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    opacity: 0.35,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
});
