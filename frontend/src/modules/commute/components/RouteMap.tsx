import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from './MapWrapper';
import { Theme } from '../../../core/theme/theme';
import { api } from '../../../core/api/api';

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

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

function decodePolyline(encoded: string) {
  const points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5
    });
  }
  return points;
}

export const RouteMap: React.FC<Props> = ({ origin, destination, t }) => {
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);

  useEffect(() => {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) return;

    const fetchRoute = async () => {
      try {
        const resp = await api.get(`/locations/directions?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`);
        const data = resp.data;
        
        if (data.routes && data.routes.length > 0) {
          const encodedPoints = data.routes[0].overview_polyline.points;
          const decoded = decodePolyline(encodedPoints);
          setRouteCoords(decoded);
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
        provider={PROVIDER_GOOGLE}
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
      
      {!GOOGLE_MAPS_API_KEY && (
        <View style={[styles.warningOverlay, { backgroundColor: t.surface }]}>
          <Text style={{ color: t.warning }}>Google Maps API Key missing. Route cannot be drawn.</Text>
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
