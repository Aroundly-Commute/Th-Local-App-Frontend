import React from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommuteDashboard from '../../src/modules/commute/screens/CommuteDashboard';
import { lightTheme, darkTheme } from '../../src/core/theme/theme';

export default function Home() {
  const cs = useColorScheme();
  const t = cs === 'dark' ? darkTheme : lightTheme;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: t.background }}>
      <CommuteDashboard />
    </SafeAreaView>
  );
}
