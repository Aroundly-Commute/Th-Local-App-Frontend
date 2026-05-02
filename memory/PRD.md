# EcoRide — Product Requirements Document

## Vision
A high-performance React Native (Expo) carpooling app with an **Eco-Green aesthetic** that emphasizes sustainability, verified community, and a fluid native feel.

## Tech Stack
- **Frontend**: Expo SDK 54 (React Native 0.81), Expo Router (file-based), react-native-maps (native only), lucide-react-native, expo-haptics, expo-linear-gradient, expo-image, react-native-reanimated (custom shimmer), AsyncStorage.
- **Backend**: FastAPI + Motor (MongoDB) + PyJWT + bcrypt; WebSocket at `/api/ws/chat/{chat_id}`.
- **Auth**: JWT Bearer tokens stored in AsyncStorage.

## Palette
Deep Forest Green `#1B5E20` · Sage Green `#81C784` · Soft Gray `#F5F5F5`. Dark mode uses Midnight Green (`#0B1411` / `#121F1A`) — not pure black.

## Core Features (shipped)
1. **Auth**: Login + Signup (role selector: driver / passenger) with JWT persistence.
2. **Dashboard** with **Sustainability Header** — money saved, CO₂ avoided, tree-equivalent, ride count.
3. **Search (Map)** — native map + OSM tiles on Android, bottom sheet with ride cards, polyline route preview, pin markers.
4. **Ride detail & Booking** — driver card with verified badge, vehicle info, eco impact, notes, CTA to book.
5. **Real-time Chat** — chat list + conversation screen, WebSocket-backed instant delivery, bubble UI.
6. **Profile** — verified badge, rating, stats (saved $, CO₂ kg, rides), vehicle details for drivers, logout.

## UI Polish
- Rounded card layouts (border-radius 16–32).
- Haptic feedback (light/medium/success) on every interaction.
- Shimmer placeholders during data loads.
- Cached images via `expo-image`.
- Dark mode adapts via `useColorScheme`.

## Seed Data
4 driver/passenger accounts + 4 open rides (SF Bay Area) so the demo works immediately.

## Business Enhancement
Added **Verified "Eco Hero" badge** surfaced in profile + driver cards → increases trust and creates a reputation flywheel. Drivers are more motivated to keep their rating high, which fuels a premium P2P marketplace and opens a path to a paid "Trusted Circle" tier (corporate-email verification as the next step).

## Out of Scope (future)
- Google Places Autocomplete (paid)
- Redux Persist offline cache
- Redux Toolkit (kept lightweight with Context API)
- WebSocket auth hardening
