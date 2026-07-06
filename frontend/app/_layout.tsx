import React, { useEffect, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/core/auth/auth';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});
import { BackHandler, LogBox, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '../src/core/components/ErrorBoundary';
export { ErrorBoundary };
import { Terminal } from 'lucide-react-native';
import { LogViewerModal } from '../src/core/components/LogViewerModal';
import '../src/services/logger'; // Boot up console interception immediately
import { FeatureFlagProvider, useFeatureFlags } from '../src/services/feature-flag/FeatureFlagContext';
import { CustomAlertProvider } from '../src/core/components/CustomAlert';
import { AnalyticsService } from '../src/core/services/analytics';

// Ignore framework-level Expo DevTools fragment style prop warnings to prevent log lag and overlay popups
LogBox.ignoreLogs([
  'Invalid prop `style` supplied to `React.Fragment`',
]);

function AppNavigationWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const [logsVisible, setLogsVisible] = useState(false);
  const { enableInAppLogs } = useFeatureFlags();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleEl = document.getElementById('prevent-landing-flash');
      if (styleEl) {
        styleEl.remove();
      }
    }
  }, [pathname]);

  useEffect(() => {
    // Initialize Google Analytics on app boot
    AnalyticsService.initialize().catch(() => {});
  }, []);

  useEffect(() => {
    // Automatically track screen changes in GA4
    if (pathname) {
      AnalyticsService.trackScreen(pathname).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    const onBackPress = () => {
      // If we are on the dashboard/index pages, let the system exit the app (return false)
      const isDashboard = 
        pathname === '/' || 
        pathname === '/index' || 
        pathname === '/intro' || 
        pathname === '/(tabs)' || 
        pathname === '/(tabs)/home' || 
        pathname === '/home' ||
        pathname === '/onboarding' ||
        pathname === '/login' ||
        pathname === '/(auth)/login';

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
        <Stack.Screen name="ride/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="chat/[chatId]" />
      </Stack>

      {/* Floating Subtle In-App Log Viewer Trigger */}
      {enableInAppLogs && (
        <TouchableOpacity
          activeOpacity={0.6}
          onPress={() => setLogsVisible(true)}
          style={styles.floatingDebugBtn}
        >
          <Terminal color="#FFFFFF" size={14} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <LogViewerModal visible={logsVisible} onClose={() => setLogsVisible(false)} />
    </View>
  );
}

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
              <FeatureFlagProvider>
                <StatusBar style="dark" />
                <AppNavigationWrapper />
                <CustomAlertProvider />
              </FeatureFlagProvider>
            </AuthProvider>
          </GestureHandlerRootView>
        </ErrorBoundary>
      </SafeAreaProvider>
    </QueryClientProvider>
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
