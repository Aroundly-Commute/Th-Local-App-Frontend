import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FeatureFlags = {
  enableMarketplace: boolean;
  enableRideSharing: boolean;
  enableParking: boolean;
  enableYourBadges: boolean;
  enableEcoStarter: boolean;
  enablePopularRoutes: boolean;
};

type FeatureFlagContextType = FeatureFlags & {
  loading: boolean;
  toggleFeature: (key: keyof FeatureFlags) => Promise<void>;
};

const FeatureFlagContext = createContext<FeatureFlagContextType | null>(null);

const STORAGE_KEY = '@app_feature_flags';

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<FeatureFlags>({
    enableMarketplace: true,
    enableRideSharing: true,
    enableParking: true,
    enableYourBadges: true,
    enableEcoStarter: true,
    enablePopularRoutes: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setFlags((prev) => ({ ...prev, ...parsed }));
        }
      } catch (err) {
        console.error('[FeatureFlag] Failed to load flags:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFeature = async (key: keyof FeatureFlags) => {
    try {
      const updated = {
        ...flags,
        [key]: !flags[key],
      };
      setFlags(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log(`[FeatureFlag] Toggled ${key} to ${updated[key]}`);
    } catch (err) {
      console.error(`[FeatureFlag] Failed to toggle ${key}:`, err);
    }
  };

  return (
    <FeatureFlagContext.Provider value={{ ...flags, loading, toggleFeature }}>
      {children}
    </FeatureFlagContext.Provider>
  );
};

export const useFeatureFlags = () => {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
};
