import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform, View } from 'react-native';
import { Home, Grid3X3, Bookmark, User } from 'lucide-react-native';
import { lightTheme, darkTheme } from '../../src/theme';
import { tap } from '../../src/haptics';

export default function MarketTabsLayout() {
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
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarIcon: ({ color, size }) => <Grid3X3 color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved', tabBarIcon: ({ color, size }) => <Bookmark color={color} size={size - 2} strokeWidth={2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} strokeWidth={2} /> }} />
    </Tabs>
  );
}
