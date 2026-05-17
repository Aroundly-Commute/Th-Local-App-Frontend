import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from './MapWrapper';
import { Theme } from './theme';

interface Point {
  lat: number;
  lng: number;
  name?: string;
}

interface Props {
  origin: Point;
  destination: Point;
  t: Theme;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export const RouteMap: React.FC<Props> = ({ origin, destination, t }) => {
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || !origin.lat || !origin.lng || !destination.lat || !destination.lng) return;

    const fetchRoute = async () => {
      try {
        const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
        const resp = await fetch(url);
        const data = await resp.json();
        
        if (data.routes && data.routes.length > 0) {
          const geometry = data.routes[0].geometry.coordinates;
          const mapped = geometry.map((c: number[]) => ({
            latitude: c[1],
            longitude: c[0]
          }));
          setRouteCoords(mapped);
        }
      } catch (e) {
        console.error('Failed to fetch route', e);
      }
    };

    fetchRoute();
  }, [origin, destination]);

  if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
    return (
      <View style={[styles.container, { backgroundColor: t.muted, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.textSecondary }}>Map not available (missing coordinates)</Text>
      </View>
    );
  }

  const initialRegion = {
    latitude: (origin.lat + destination.lat) / 2,
    longitude: (origin.lng + destination.lng) / 2,
    latitudeDelta: Math.abs(origin.lat - destination.lat) * 1.5 + 0.05,
    longitudeDelta: Math.abs(origin.lng - destination.lng) * 1.5 + 0.05,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
      >
        <Marker 
          coordinate={{ latitude: origin.lat, longitude: origin.lng }} 
          title="Origin"
          description={origin.name}
          pinColor={t.primary} 
        />
        <Marker 
          coordinate={{ latitude: destination.lat, longitude: destination.lng }} 
          title="Destination"
          description={destination.name}
          pinColor={t.accent} 
        />
        
        {routeCoords.length > 0 && (
          <Polyline 
            coordinates={routeCoords} 
            strokeColor={t.primary} 
            strokeWidth={4} 
          />
        )}
      </MapView>
      
      {!MAPBOX_TOKEN && (
        <View style={[styles.warningOverlay, { backgroundColor: t.surface }]}>
          <Text style={{ color: t.warning }}>Mapbox token missing. Route cannot be drawn.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  warningOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    padding: 8,
    borderRadius: 8,
    opacity: 0.9,
    alignItems: 'center',
  }
});
