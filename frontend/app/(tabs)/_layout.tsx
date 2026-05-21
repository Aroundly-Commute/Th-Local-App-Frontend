import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, Alert } from 'react-native';
import { Home, Search, Car, User, MapPin, ShoppingBag, Compass } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../../src/theme';
import { tap } from '../../src/haptics';
import { wsUrl, api } from '../../src/api';
import { useAuth } from '../../src/auth';

export default function TabsLayout() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;
    const ws = new WebSocket(wsUrl('').replace('/chat/', '/notifications/') + user.id);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === 'new_ride_request') {
          Alert.alert(
            "New Ride Request",
            `${msg.payload.riderName} requested a seat.`,
            [
              { text: "Reject", style: "cancel", onPress: () => {
                  api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'REJECTED' }).catch(()=>{})
              } },
              { text: "Accept", onPress: () => {
                  api.patch(`/matchmaking/requests/${msg.payload.id}`, { status: 'ACCEPTED' }).catch(()=>{})
              } }
            ]
          );
        }
      } catch (e) {}
    };
    return () => { try { ws.close(); } catch {} };
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
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
      screenListeners={{ tabPress: () => tap() }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="market" options={{ title: 'Explore', tabBarIcon: ({ color, size }) => <Compass color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="rides" options={{ href: null }} />
      <Tabs.Screen name="parking" options={{ href: null }} />
    </Tabs>
  );
}
