import React, { useEffect } from 'react';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useColorScheme, Platform, AppState, AppStateStatus, NativeModules, Vibration } from 'react-native';
import { Home, Search, Car, User, MapPin, ShoppingBag, Users, MessageCircle, Compass, Inbox } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../../src/core/theme/theme';
import { tap } from '../../src/core/utils/haptics';
import { wsUrl, api } from '../../src/core/api/api';
import { useAuth } from '../../src/core/auth/auth';
import { useFeatureFlags } from '../../src/services/feature-flag/FeatureFlagContext';
import { Alert } from '../../src/core/components/CustomAlert';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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
  const [hasUnread, setHasUnread] = React.useState(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Fetch Sent Requests
  const { data: sentRequests } = useQuery({
    queryKey: ['requests', 'sent'],
    queryFn: async () => {
      const { data } = await api.get('/matchmaking/requests');
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Fetch Received Requests
  const { data: receivedRequests } = useQuery({
    queryKey: ['requests', 'received'],
    queryFn: async () => {
      const { data } = await api.get('/matchmaking/requests/received');
      return data;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  const hasPendingSent = (sentRequests || []).some((r: any) => r.status === 'REQUESTED');
  const hasPendingReceived = (receivedRequests || []).some((r: any) => r.status === 'REQUESTED');
  const hasPendingRequests = hasPendingSent || hasPendingReceived;

  // Handle FCM Notification click (tap) interactions
  useEffect(() => {
    if (Platform.OS === 'web') return;

    try {
      const messaging = require('@react-native-firebase/messaging').default;

      // 1. App in background state
      const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage: any) => {
        console.log('[FCM] Notification opened app from background state:', remoteMessage);
        if (remoteMessage?.data?.chatId) {
          const name = remoteMessage.notification?.title?.replace('Message from ', '') || 'Chat';
          router.push(`/chat/${encodeURIComponent(remoteMessage.data.chatId)}?name=${encodeURIComponent(name)}` as any);
        }
      });

      // 2. App was in killed state
      messaging().getInitialNotification().then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('[FCM] Notification opened app from killed state:', remoteMessage);
          if (remoteMessage?.data?.chatId) {
            const name = remoteMessage.notification?.title?.replace('Message from ', '') || 'Chat';
            setTimeout(() => {
              router.push(`/chat/${encodeURIComponent(remoteMessage.data.chatId)}?name=${encodeURIComponent(name)}` as any);
            }, 1000);
          }
        }
      });

      return () => {
        unsubscribeNotificationOpened();
      };
    } catch (err) {
      console.warn('[FCM] Failed to initialize notification click listeners:', err);
    }
  }, []);

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
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            Alert.alert(
              "New Ride Request",
              `${msg.payload.riderName} requested a seat.`,
              [
                { text: "Reject", style: "cancel", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'REJECTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                        queryClient.invalidateQueries({ queryKey: ['requests'] });
                      })
                      .catch(()=>{})
                } },
                { text: "Accept", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'ACCEPTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                        queryClient.invalidateQueries({ queryKey: ['requests'] });
                      })
                      .catch(()=>{})
                } }
              ]
            );
          } else if (msg.type === 'new_ride_invite') {
            queryClient.invalidateQueries({ queryKey: ['ride'] });
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            Alert.alert(
              "New Ride Invite",
              `A driver has invited you to join their ride.`,
              [
                { text: "Reject", style: "cancel", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'REJECTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                        queryClient.invalidateQueries({ queryKey: ['requests'] });
                      })
                      .catch(()=>{})
                } },
                { text: "Accept", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'ACCEPTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                        queryClient.invalidateQueries({ queryKey: ['requests'] });
                      })
                      .catch(()=>{})
                } }
              ]
            );
          } else if (msg.type === 'new_buddy_request') {
            queryClient.invalidateQueries({ queryKey: ['ride'] });
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            Alert.alert(
              "New Cab Buddy Request",
              "A user wants to book a cab with you.",
              [
                { text: "Reject", style: "cancel", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'REJECTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                        queryClient.invalidateQueries({ queryKey: ['requests'] });
                      })
                      .catch(()=>{})
                } },
                { text: "Accept", onPress: () => {
                    api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'ACCEPTED' })
                      .then(() => {
                        queryClient.invalidateQueries({ queryKey: ['ride'] });
                        queryClient.invalidateQueries({ queryKey: ['rides'] });
                        queryClient.invalidateQueries({ queryKey: ['requests'] });
                      })
                      .catch(()=>{})
                } }
              ]
            );
          } else if (msg.type === 'ride_request_updated') {
            queryClient.invalidateQueries({ queryKey: ['ride'] });
            queryClient.invalidateQueries({ queryKey: ['rides'] });
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            queryClient.invalidateQueries({ queryKey: ['sustainability'] });
            
            let messageTitle = "Ride Request Status";
            let messageText = `Your ride request status has been updated to ${msg.payload.status.toLowerCase()}.`;
            
            if (msg.payload.isInvitation) {
              if (msg.payload.status === 'CANCELLED') {
                messageTitle = "Ride Invite Withdrawn";
                messageText = "The driver has withdrawn their ride invite.";
              } else {
                messageTitle = `Ride Invite ${msg.payload.status === 'ACCEPTED' ? 'Accepted' : 'Declined'}`;
                messageText = `The passenger has ${msg.payload.status.toLowerCase()} your ride invitation.`;
              }
            } else {
              if (msg.payload.status === 'CANCELLED') {
                messageTitle = "Booking Cancelled";
                messageText = "A passenger has cancelled their booking.";
              } else {
                messageText = `Your request has been ${msg.payload.status.toLowerCase()} by the driver.`;
              }
            }

            Alert.alert(messageTitle, messageText);
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
            queryClient.invalidateQueries({ queryKey: ['chat', msg.payload.chat_id] });
            queryClient.invalidateQueries({ queryKey: ['chats'] });

            const inThisChat = pathnameRef.current.includes(msg.payload.chat_id);
            if (!inThisChat) {
              setHasUnread(true);

              if (Platform.OS === 'web') {
                try {
                  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav');
                  audio.play().catch(() => {});
                } catch {}
              } else {
                try {
                  const hasExponentAV = !!NativeModules.ExponentAV;
                  if (hasExponentAV) {
                    const { Audio: ExpoAudio } = require('expo-av');
                    ExpoAudio.Sound.createAsync(
                      { uri: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-600.wav' }
                    ).then(({ sound }: any) => {
                      sound.playAsync().then(() => {
                        sound.setOnPlaybackStatusUpdate((status: any) => {
                          if (status.isLoaded && status.didJustFinish) {
                            sound.unloadAsync().catch(() => {});
                          }
                        });
                      }).catch(() => {});
                    }).catch(() => {});
                  } else {
                    Vibration.vibrate(100);
                  }
                } catch (e) {
                  console.warn('[AUDIO] Failed to play native message sound:', e);
                }
              }
            }
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
        tabBarActiveTintColor: t.textTertiary,
        tabBarInactiveTintColor: t.textPrimary,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPadding,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
      screenListeners={{
        tabPress: (e) => {
          tap();
          const routeName = e.target?.split('-')[0];
          if (routeName === 'messages') {
            setHasUnread(false);
          }
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen
        name="rides"
        options={{
          title: 'My Ride',
          tabBarBadge: hasPendingRequests ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            minWidth: 8,
            height: 8,
            borderRadius: 4,
            marginTop: Platform.OS === 'ios' ? -2 : 0,
          },
          tabBarIcon: ({ color, size }) => <Car color={color} size={size - 2} strokeWidth={2} />
        }}
      />
      <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Compass color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chat',
          tabBarBadge: hasUnread ? '' : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            minWidth: 8,
            height: 8,
            borderRadius: 4,
            marginTop: Platform.OS === 'ios' ? -2 : 0,
          },
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size - 2} strokeWidth={2} />
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Me', 
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={2} /> 
        }} 
      />
    </Tabs>
  );
}
