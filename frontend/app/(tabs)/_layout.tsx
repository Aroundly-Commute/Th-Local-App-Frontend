import React, { useEffect } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useColorScheme, Platform, AppState, AppStateStatus } from 'react-native';
import { Home, Search, Car, User, MapPin, ShoppingBag, Users } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../../src/core/theme/theme';
import { tap } from '../../src/core/utils/haptics';
import { wsUrl, api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { useFeatureFlags } from '../../src/services/feature-flag/FeatureFlagContext';
import { Alert } from '../../src/core/components/CustomAlert';
import { useQueryClient } from '@tanstack/react-query';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;
  const baseHeight = Platform.OS === 'ios' ? 52 : 58;
  const tabBarHeight = baseHeight + bottomPadding;

  const queryClient = useQueryClient();
  const cs = useColorScheme();
  const t = lightTheme;
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = React.useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!user?.id) return;

    let ws: WebSocket | null = null;
    let appState = AppState.currentState;
    let isInitialConnect = true;

    const connect = () => {
      if (ws) return;
      console.log('[WS] Connecting for user:', user.id);
      ws = new WebSocket(wsUrl('').replace('/chat/', '/notifications/') + user.id);
      
      ws.onopen = () => {
        console.log('[WS] Connected successfully.');
        // Pull latest updates upon reconnect/active state
        if (!isInitialConnect) {
          queryClient.invalidateQueries();
        }
        isInitialConnect = false;
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          console.log('[WS MESSAGE] Received:', msg);
          
          if (msg.type === 'new_ride_request') {
            queryClient.invalidateQueries({ queryKey: ['ride'] });
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            Alert.alert(
              "New Ride Request",
              `${msg.payload.riderName} requested a seat.`,
              [
                { text: "Reject", style: "cancel", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'REJECTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                      })
                      .catch(()=>{})
                } },
                { text: "Accept", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'ACCEPTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                      })
                      .catch(()=>{})
                } }
              ]
            );
          } else if (msg.type === 'ride_request_updated') {
            queryClient.invalidateQueries({ queryKey: ['ride'] });
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            queryClient.invalidateQueries({ queryKey: ['sustainability'] });
            Alert.alert(
              "Ride Request Status",
              `Your request has been ${msg.payload.status.toLowerCase()} by the driver.`
            );
          } else if (msg.type === 'new_parking_booking_request') {
            queryClient.invalidateQueries({ queryKey: ['parking'] });
            Alert.alert(
              "New Parking Booking",
              `${msg.payload.visitorName} requested spot ${msg.payload.spotName} on ${msg.payload.date}.`,
              [
                { text: "Reject", style: "cancel", onPress: () => {
                    api.patch(`/parking/bookings/${msg.payload.id}/status`, { status: 'REJECTED' })
                      .then(() => queryClient.invalidateQueries({ queryKey: ['parking'] }))
                      .catch(()=>{})
                } },
                { text: "Accept", onPress: () => {
                    api.patch(`/parking/bookings/${msg.payload.id}/status`, { status: 'ACCEPTED' })
                      .then(() => queryClient.invalidateQueries({ queryKey: ['parking'] }))
                      .catch(()=>{})
                } }
              ]
            );
          } else if (msg.type === 'parking_booking_status_updated') {
            queryClient.invalidateQueries({ queryKey: ['parking'] });
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            Alert.alert(
              "Parking Booking Status",
              `Your booking request for spot ${msg.payload.spotName} has been ${msg.payload.status.toLowerCase()} by the owner.`
            );
          } else if (msg.type === 'new_chat_message') {
            // No alert for chats as requested, but still invalidate caches to keep lists/badges updated
            queryClient.invalidateQueries({ queryKey: ['chat', msg.payload.chat_id] });
            queryClient.invalidateQueries({ queryKey: ['chats'] });
          }
        } catch (err) {
          console.error('[WS ERROR] onmessage failed:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS ERROR] connection error:', err);
      };

      ws.onclose = (e) => {
        console.log('[WS] Connection closed:', e.reason);
        ws = null;
      };
    };

    const disconnect = () => {
      if (ws) {
        console.log('[WS] Disconnecting WebSocket.');
        try {
          ws.close();
        } catch {}
        ws = null;
      }
    };

    // Connect initially
    connect();

    // AppState change listener
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[WS] App has come to foreground. Reconnecting...');
        connect();
      } else if (nextAppState.match(/inactive|background/)) {
        console.log('[WS] App has gone to background. Closing connection...');
        disconnect();
      }
      appState = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      disconnect();
    };
  }, [user?.id]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.textPrimary,
        tabBarInactiveTintColor: t.textTertiary,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
      screenListeners={{ tabPress: () => tap() }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="community" options={{ title: 'Community', tabBarIcon: ({ color, size }) => <Users color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={2} /> }} />
    </Tabs>
  );
}
