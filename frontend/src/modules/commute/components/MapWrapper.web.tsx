import React from 'react';
import { View, StyleSheet } from 'react-native';

const WebMap = React.forwardRef<any, any>((props, _ref) => {
  const markers: any[] = [];
  const polylines: any[] = [];

  // Parse custom Map children (Markers and Polylines)
  React.Children.forEach(props.children, (child) => {
    if (!React.isValidElement(child)) return;

    const childProps = child.props as any;
    if (childProps.coordinate) {
      markers.push({
        lat: childProps.coordinate.latitude,
        lng: childProps.coordinate.longitude,
        title: childProps.title || 'Location',
        description: childProps.description || '',
        pinColor: childProps.pinColor || '#4CAF50',
      });
    } else if (childProps.coordinates) {
      polylines.push({
        points: childProps.coordinates.map((c: any) => [c.latitude, c.longitude]),
        strokeColor: childProps.strokeColor || '#4CAF50',
        strokeWidth: childProps.strokeWidth || 4,
      });
    }
  });

  const initialLat = props.initialRegion?.latitude || 20.5937;
  const initialLng = props.initialRegion?.longitude || 78.9629;
  const initialZoom = 12;

  // Build the high-fidelity dark-mode Leaflet Map document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #121212; }
        
        /* Sleek Premium Vector Dark Mode styling */
        .leaflet-tile {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        
        /* Modern Tooltip & Popups */
        .leaflet-popup-content-wrapper {
          background: #1E293B !important;
          color: #F8FAFC !important;
          border-radius: 12px !important;
          font-family: system-ui, -apple-system, sans-serif !important;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.6) !important;
          border: 1px solid #334155;
          padding: 4px;
        }
        .leaflet-popup-tip {
          background: #1E293B !important;
          border: 1px solid #334155;
        }
        .popup-title {
          font-weight: 700;
          color: #10B981;
          font-size: 14px;
          margin-bottom: 2px;
        }
        .popup-desc {
          color: #94A3B8;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Init Map
        const map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], ${initialZoom});
        
        // Load OpenStreetMap Tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
        }).addTo(map);

        const markersList = [];

        // Inject dynamic markers
        const markersData = ${JSON.stringify(markers)};
        markersData.forEach(m => {
          const marker = L.circleMarker([m.lat, m.lng], {
            color: m.pinColor,
            fillColor: m.pinColor,
            fillOpacity: 0.85,
            radius: 8,
            weight: 2
          }).addTo(map);

          if (m.title || m.description) {
            const popupHtml = '<div class="popup-title">' + m.title + '</div>' + 
                              (m.description ? '<div class="popup-desc">' + m.description + '</div>' : '');
            marker.bindPopup(popupHtml);
          }
          markersList.push(marker);
        });

        // Inject dynamic routes / polylines
        const polylinesData = ${JSON.stringify(polylines)};
        polylinesData.forEach(p => {
          L.polyline(p.points, {
            color: p.strokeColor,
            weight: p.strokeWidth,
            opacity: 0.85
          }).addTo(map);
        });

        // Auto-fit route bounds perfectly
        if (markersList.length > 0) {
          const group = new L.featureGroup(markersList);
          map.fitBounds(group.getBounds().pad(0.3));
        }
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, props.style]}>
      <iframe
        srcDoc={htmlContent}
        style={styles.iframe}
        title="Interactive Map"
      />
    </View>
  );
});
WebMap.displayName = 'WebMap';

export default WebMap;
export const Marker: React.FC<any> = () => null;
export const Polyline: React.FC<any> = () => null;
export const UrlTile: React.FC<any> = () => null;
export const PROVIDER_DEFAULT = undefined;
export const PROVIDER_GOOGLE = 'google' as const;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
});
