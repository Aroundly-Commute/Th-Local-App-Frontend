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
        pinColor: childProps.pinColor || '#EA4335', // Default Google Red
      });
    } else if (childProps.coordinates) {
      polylines.push({
        points: childProps.coordinates.map((c: any) => [c.latitude, c.longitude]),
        strokeColor: childProps.strokeColor || '#1A73E8', // Default Google Blue
        strokeWidth: childProps.strokeWidth || 4,
      });
    }
  });

  const initialLat = props.initialRegion?.latitude || 20.5937;
  const initialLng = props.initialRegion?.longitude || 78.9629;
  const initialZoom = 12;

  // Build the high-fidelity Google Maps Light Theme Leaflet Map document
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
      <style>
        html, body, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #F5F5F5; }
        
        /* Modern Classic Google Maps Tooltip & Popups */
        .leaflet-popup-content-wrapper {
          background: #FFFFFF !important;
          color: #202124 !important;
          border-radius: 8px !important;
          font-family: Roboto, Arial, sans-serif !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
          border: none !important;
          padding: 6px 10px;
        }
        .leaflet-popup-tip {
          background: #FFFFFF !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2) !important;
        }
        .popup-title {
          font-weight: 700;
          color: #1A73E8; /* Classic Google Maps Blue */
          font-size: 13px;
          margin-bottom: 2px;
        }
        .popup-desc {
          color: #5F6368; /* Standard Google Gray */
          font-size: 11px;
          line-height: 14px;
        }
        
        /* Google Pin Styling */
        .custom-google-pin {
          background: none !important;
          border: none !important;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        // Init Map
        const map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], ${initialZoom});
        
        // Load official Google Maps Road Map Tiles directly (lyrs=m is roadmap)
        L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
          maxZoom: 20,
          subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
          attribution: '&copy; Google Maps'
        }).addTo(map);

        const markersList = [];

        // Inject dynamic Google Maps tear-drop markers
        const markersData = ${JSON.stringify(markers)};
        markersData.forEach(m => {
          // Classic Google Maps SVG pin teardrop
          const googlePinSvg = \`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34">
              <path fill="\` + m.pinColor + \`" stroke="#FFFFFF" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          \`;

          const customIcon = L.divIcon({
            html: googlePinSvg,
            className: 'custom-google-pin',
            iconSize: [34, 34],
            iconAnchor: [17, 34],
            popupAnchor: [0, -30]
          });

          const marker = L.marker([m.lat, m.lng], { icon: customIcon }).addTo(map);

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
          map.fitBounds(group.getBounds().pad(0.35));
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
        title="Interactive Google Map"
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
