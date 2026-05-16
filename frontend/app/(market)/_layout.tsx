/**
 * (market)/_layout.tsx
 * Plain Stack layout — navigation chrome is handled inside index.tsx
 * (our custom MarketBottomNav + top pill tabs).
 */
import { Stack } from 'expo-router';
import { CartProvider } from '../../src/market/CartContext';

export default function MarketLayout() {
  return (
    <CartProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
      </Stack>
    </CartProvider>
  );
}
