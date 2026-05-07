import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Home, Search, Car, User, MapPin } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../../src/theme';
import { tap } from '../../src/haptics';

export default function TabsLayout() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;
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
      <Tabs.Screen name="search" options={{ title: 'Search', tabBarIcon: ({ color, size }) => <Search color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="rides" options={{ title: 'My Rides', tabBarIcon: ({ color, size }) => <Car color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="parking" options={{ title: 'Parking', tabBarIcon: ({ color, size }) => <MapPin color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={2} /> }} />
    </Tabs>
  );
}
