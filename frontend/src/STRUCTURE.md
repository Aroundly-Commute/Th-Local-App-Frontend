# Frontend Modular Structure

## Directory Layout

```
src/
├── components/
│   ├── common/          ← Shared UI: LocationSearch, Shimmer, ModeSwitcher
│   ├── marketplace/     ← Market-specific: MarketBottomNav, Ticker, primitives
│   └── carpooling/      ← Carpool-specific: RouteMap, MapWrapper
│
├── screens/
│   ├── marketplace/     ← MarketHome.tsx, ShopDetail.tsx, data.ts
│   └── carpooling/      ← (future: RideDashboard, etc.)
│
├── contexts/
│   └── CartContext.tsx  ← Global cart state (source of truth)
│
├── services/
│   ├── api.ts           ← Axios instance + interceptors
│   └── haptics.ts       ← Haptic feedback helpers
│
├── auth.tsx             ← Auth context (Firebase/JWT)
├── theme.ts             ← Design tokens (verdexColors, lightTheme, darkTheme)
└── marketData.ts        ← (legacy mock data)

app/                     ← Expo Router screens (thin wrappers)
├── (auth)/              ← Login, Signup
├── (tabs)/              ← Carpooling tabs: Home, Rides, Search, Parking, Profile
├── (market)/            ← Marketplace tabs: index, search, cart, categories
├── shop/[id].tsx        ← Shop detail page
└── _layout.tsx          ← Root layout with CartProvider + AuthProvider
```

## Import Paths

### New canonical paths:
```ts
import { useCart, CartProvider } from '../src/contexts/CartContext';
import { MarketBottomNav, Toast } from '../src/components/marketplace';
import { LocationSearch, Shimmer } from '../src/components/common';
import { RouteMap } from '../src/components/carpooling';
import { api } from '../src/services/api';
import { tap, success } from '../src/services/haptics';
```

### Legacy shims (still work):
- `src/market/CartContext.tsx` → re-exports from `src/contexts/CartContext.tsx`
- `src/haptics.ts` → re-exports from `src/services/haptics.ts`
- `src/api.ts` → re-exports from `src/services/api.ts`
