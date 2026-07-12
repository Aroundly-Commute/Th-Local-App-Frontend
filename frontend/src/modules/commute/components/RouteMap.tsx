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

/** A co-passenger's boarding segment to overlay on the map */
export interface PassengerRoute {
  origin: Point;
  destination: Point;
  /** Display label, e.g. passenger name */
  label?: string;
  /** Polyline color — defaults to amber '#f59e0b' */
  color?: string;
}

interface Props {
  origin: Point;
  destination: Point;
  t: Theme;
  style?: any;
  /** Optional passenger boarding segments drawn over the main route */
  passengerRoutes?: PassengerRoute[];
}

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Passenger route colors (cycling palette)
const PASSENGER_COLORS = ['#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4'];

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

async function fetchRouteCoords(
  origin: Point,
  destination: Point,
): Promise<{ latitude: number; longitude: number }[]> {
  if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) return [];
  const resp = await api.get(
    `/locations/directions?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}`
  );
  const data = resp.data;
  if (data.routes && data.routes.length > 0) {
    return decodePolyline(data.routes[0].overview_polyline.points);
  }
  return [];
}

export const RouteMap: React.FC<Props> = ({ origin, destination, t, style, passengerRoutes = [] }) => {
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [passengerCoords, setPassengerCoords] = useState<
    { coords: { latitude: number; longitude: number }[]; color: string; label?: string }[]
  >([]);

  // Fetch main driver route
  useEffect(() => {
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) return;
    fetchRouteCoords(origin, destination)
      .then(setRouteCoords)
      .catch((e) => console.error('Failed to fetch driver route', e));
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // Fetch each passenger segment
  useEffect(() => {
    if (!passengerRoutes.length) {
      setPassengerCoords([]);
      return;
    }
    Promise.all(
      passengerRoutes.map(async (pr, i) => {
        const coords = await fetchRouteCoords(pr.origin, pr.destination).catch(() => []);
        return {
          coords,
          color: pr.color || PASSENGER_COLORS[i % PASSENGER_COLORS.length],
          label: pr.label,
        };
      })
    ).then(setPassengerCoords);
  }, [JSON.stringify(passengerRoutes)]);

  if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
    return (
      <View style={[styles.container, style, { backgroundColor: t.muted, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: t.textSecondary }}>Map not available (missing coordinates)</Text>
      </View>
    );
  }

  // Compute bounding region that fits driver route + all passenger segments
  const allPoints = [origin, destination, ...passengerRoutes.map(p => p.origin), ...passengerRoutes.map(p => p.destination)].filter(p => p.lat && p.lng);
  const lats = allPoints.map(p => p.lat);
  const lngs = allPoints.map(p => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const initialRegion = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.abs(maxLat - minLat) * 1.5 + 0.05,
    longitudeDelta: Math.abs(maxLng - minLng) * 1.5 + 0.05,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
      >
        {/* ── Driver's full route ────────────────────────────────────── */}
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          title="Driver Start"
          description={origin.name}
          pinColor={t.primary}
        />
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          title="Driver End"
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

        {/* ── Co-passenger boarding segments ────────────────────────── */}
        {passengerCoords.map((pr, i) => {
          const pRoute = passengerRoutes[i];
          if (!pRoute) return null;
          return (
            <React.Fragment key={i}>
              {/* Boarding start marker */}
              {pRoute.origin.lat && pRoute.origin.lng && (
                <Marker
                  coordinate={{ latitude: pRoute.origin.lat, longitude: pRoute.origin.lng }}
                  title={`${pr.label ? pr.label + ' ' : ''}Pickup`}
                  description={pRoute.origin.name}
                  pinColor={pr.color}
                />
              )}
              {/* Boarding end marker */}
              {pRoute.destination.lat && pRoute.destination.lng && (
                <Marker
                  coordinate={{ latitude: pRoute.destination.lat, longitude: pRoute.destination.lng }}
                  title={`${pr.label ? pr.label + ' ' : ''}Drop-off`}
                  description={pRoute.destination.name}
                  pinColor={pr.color}
                />
              )}
              {/* Passenger segment polyline — thinner, dashed-look via opacity */}
              {pr.coords.length > 0 && (
                <Polyline
                  coordinates={pr.coords}
                  strokeColor={pr.color}
                  strokeWidth={3}
                  lineDashPattern={[8, 4]}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapView>

      {!GOOGLE_MAPS_API_KEY && (
        <View style={[styles.warningOverlay, { backgroundColor: t.surface }]}>
          <Text style={{ color: t.warning }}>Google Maps API Key missing. Route cannot be drawn.</Text>
        </View>
      )}

      {/* Legend — only shown when there are passenger segments */}
      {passengerCoords.length > 0 && (
        <View style={[styles.legend, { backgroundColor: t.surface + 'ee' }]}>
          <View style={styles.legendRow}>
            <View style={[styles.legendLine, { backgroundColor: t.primary }]} />
            <Text style={[styles.legendText, { color: t.textSecondary }]}>Your Route</Text>
          </View>
          {passengerCoords.map((pr, i) => (
            <View key={i} style={styles.legendRow}>
              <View style={[styles.legendLine, { backgroundColor: pr.color, borderStyle: 'dashed', borderWidth: 1, borderColor: pr.color }]} />
              <Text style={[styles.legendText, { color: t.textSecondary }]} numberOfLines={1}>
                {pr.label || `Passenger ${i + 1}`}
              </Text>
            </View>
          ))}
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
  },
  legend: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendLine: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 100,
  },
});
