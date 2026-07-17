import React, { useEffect, useState } from 'react';
import { Stack, useRouter, usePathname } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/core/auth/auth';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});
import { BackHandler, LogBox, View, TouchableOpacity, StyleSheet, Platform, PermissionsAndroid, ActivityIndicator } from 'react-native';
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

function isPublicRoute(pathname: string): boolean {
  if (!pathname) return true;
  const p = pathname.toLowerCase();

  // Root landing page
  if (p === '/' || p === '/index') return true;

  // Auth routes
  if (
    p === '/login' ||
    p === '/signup' ||
    p === '/phone-login' ||
    p.startsWith('/(auth)') ||
    p.startsWith('/login') ||
    p.startsWith('/signup') ||
    p.startsWith('/phone-login')
  ) {
    return true;
  }

  // Intro screen
  if (p === '/intro' || p.startsWith('/(onboarding)/intro') || p === '/(onboarding)/intro') {
    return true;
  }

  // Public legal & help pages
  if (
    p.includes('privacy-policy') ||
    p.includes('/privacy') ||
    p.includes('/help')
  ) {
    return true;
  }

  return false;
}

function AppNavigationWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const [logsVisible, setLogsVisible] = useState(false);
  const { enableInAppLogs } = useFeatureFlags();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loading]);

  useEffect(() => {
    if (loading) return;

    const isPublic = isPublicRoute(pathname);

    if (!user && !isPublic) {
      console.log(`[AUTH GUARD] Direct access to protected route "${pathname}" blocked. Redirecting to login.`);
      router.replace('/(auth)/login');
    } else if (user && (pathname.startsWith('/(auth)') || pathname === '/login' || pathname === '/signup' || pathname === '/phone-login')) {
      console.log(`[AUTH GUARD] Authenticated user on auth screen "${pathname}". Redirecting to dashboard.`);
      router.replace('/(tabs)');
    }
  }, [user, loading, pathname, router]);

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

    // Attach global unhandled exception and promise rejection listeners
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebError = (event: ErrorEvent) => {
        AnalyticsService.trackError(event.message || 'Uncaught Web Exception', true, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }).catch(() => {});
      };
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason?.message || String(event.reason || 'Unhandled Promise Rejection');
        AnalyticsService.trackError(`Unhandled Promise Rejection: ${reason}`, true, {
          reason: String(event.reason),
        }).catch(() => {});
      };
      window.addEventListener('error', handleWebError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    } else if (Platform.OS !== 'web' && (global as any).ErrorUtils) {
      const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
      (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
        AnalyticsService.trackError(error?.message || 'Uncaught Native Exception', !!isFatal, {
          stack: error?.stack,
        }).catch(() => {});
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }

    // Request notification permission on app mount
    if (Platform.OS !== 'web') {
      (async () => {
        try {
          // On Android 13+ (SDK 33+), check and request POST_NOTIFICATIONS runtime permission
          if (Platform.OS === 'android') {
            const sdkInt = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version, 10);
            if (sdkInt >= 33) {
              const hasPermission = await PermissionsAndroid.check('android.permission.POST_NOTIFICATIONS');
              if (!hasPermission) {
                await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS');
              }
            }
          }

          // Request Firebase messaging permission
          const { default: messaging } = require('@react-native-firebase/messaging');
          await messaging().requestPermission().catch(() => {});
        } catch (err) {
          console.warn('[NOTIFICATION PERMISSION] Failed to request permission:', err);
        }
      })();
    }
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

  if (loading && !isPublicRoute(pathname)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

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
