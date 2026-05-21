/**
 * (market)/_layout.tsx
 * Plain Stack layout — navigation chrome is handled inside index.tsx
 * (our custom MarketBottomNav + top pill tabs).
 */
import { Stack } from 'expo-router';
export default function MarketLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="merchant" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}
