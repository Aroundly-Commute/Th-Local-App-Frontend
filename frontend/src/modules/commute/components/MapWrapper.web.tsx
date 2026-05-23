import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WebMap = React.forwardRef<any, any>((props, _ref) => (
  <View style={[styles.box, props.style]} pointerEvents="none">
    <Text style={styles.txt}>Interactive Map</Text>
    <Text style={styles.sub}>Open on mobile (Expo Go) to see the live map.</Text>
  </View>
));
WebMap.displayName = 'WebMap';

export default WebMap;
export const Marker: React.FC<any> = () => null;
export const Polyline: React.FC<any> = () => null;
export const UrlTile: React.FC<any> = () => null;
export const PROVIDER_DEFAULT = undefined;
export const PROVIDER_GOOGLE = 'google' as const;

const styles = StyleSheet.create({
  box: { backgroundColor: '#1B5E20', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  txt: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#B5DDB7', fontSize: 12, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
});
