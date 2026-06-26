import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { BadgeCheck } from 'lucide-react-native';
import { Theme, radius, spacing } from '../theme/theme';

export const VerifiedAvatar: React.FC<{ uri?: string; size?: number; name?: string; verified?: boolean; t: Theme }> = ({
  uri,
  size = 48,
  name = '?',
  verified,
  t,
}) => {
  const [hasError, setHasError] = useState(false);
  const [prevUri, setPrevUri] = useState(uri);

  // Reset error state if the URI changes
  if (uri !== prevUri) {
    setPrevUri(uri);
    setHasError(false);
  }

  return (
    <View style={{ width: size, height: size }}>
      {uri && !hasError ? (
        <Image 
          source={{ uri }} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
          contentFit="cover"
          onError={(err) => {
            console.warn(`[VerifiedAvatar] Failed to load avatar from URL "${uri}":`, err.error);
            setHasError(true);
          }}
        />
      ) : (
        <View style={[s.placeholder, { width: size, height: size, borderRadius: size / 2, backgroundColor: t.muted }]}>
          <Text style={{ color: t.textPrimary, fontWeight: '700', fontSize: size * 0.38 }}>
            {(name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      {verified ? (
        <View style={[s.badge, { backgroundColor: t.background }]}>
          <BadgeCheck color={t.success} size={size * 0.34} fill={t.background} />
        </View>
      ) : null}
    </View>
  );
};

export const Chip: React.FC<{ label: string; t: Theme; variant?: 'default' | 'success' | 'accent' | 'warning' }> = ({
  label,
  t,
  variant = 'default',
}) => {
  const bg =
    variant === 'success' ? t.successBg :
    variant === 'accent' ? t.accentBg :
    variant === 'warning' ? t.warningBg : t.muted;
  const fg =
    variant === 'success' ? t.success :
    variant === 'accent' ? t.accent :
    variant === 'warning' ? t.warning : t.textSecondary;
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      <Text style={[s.chipText, { color: fg }]}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', right: -2, bottom: -2, borderRadius: 9999 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  chipText: { fontSize: 11, fontWeight: '600' },
});
