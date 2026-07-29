import React, { useRef, useEffect, useState } from 'react'
import { View, StyleSheet, ActivityIndicator, Text, Platform } from 'react-native'

let WebViewComponent = null
try {
  WebViewComponent = require('react-native-webview').WebView
} catch (e) {
  console.log('react-native-webview native module not available:', e)
}

let MapViewComponent = null
let MarkerComponent = null
try {
  const RNMaps = require('react-native-maps')
  MapViewComponent = RNMaps.default
  MarkerComponent = RNMaps.Marker
} catch (e) {
  console.log('react-native-maps not available:', e)
}

export default function OSMMapPicker({
  latitude = 3.8480,
  longitude = 11.5021,
  onLocationSelect,
  style,
  zoom = 15,
}) {
  const webViewRef = useRef(null)
  const [hasWebViewError, setHasWebViewError] = useState(false)

  useEffect(() => {
    if (webViewRef.current && !hasWebViewError) {
      const script = `
        if (window.setMarkerLocation) {
          window.setMarkerLocation(${latitude}, ${longitude});
        }
      `
      webViewRef.current.injectJavaScript(script)
    }
  }, [latitude, longitude, hasWebViewError])

  const leafletHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .leaflet-touch .leaflet-bar a {
            width: 34px;
            height: 34px;
            line-height: 34px;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var lat = ${latitude};
          var lng = ${longitude};
          
          var map = L.map('map', {
            zoomControl: true,
            attributionControl: false
          }).setView([lat, lng], ${zoom});

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          var icon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });

          var marker = L.marker([lat, lng], { draggable: true, icon: icon }).addTo(map);

          function sendCoords(newLat, newLng) {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                latitude: newLat,
                longitude: newLng
              }));
            }
          }

          marker.on('dragend', function(e) {
            var position = marker.getLatLng();
            sendCoords(position.lat, position.lng);
          });

          map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            sendCoords(e.latlng.lat, e.latlng.lng);
          });

          window.setMarkerLocation = function(newLat, newLng) {
            marker.setLatLng([newLat, newLng]);
            map.panTo([newLat, newLng]);
          };
        </script>
      </body>
    </html>
  `

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data && data.latitude && data.longitude && onLocationSelect) {
        onLocationSelect({
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
        })
      }
    } catch (e) {
      console.log('Error parsing leaflet map message:', e)
    }
  }

  // If WebView module is available and no runtime error, render WebView Leaflet map
  if (WebViewComponent && !hasWebViewError) {
    return (
      <View style={[styles.container, style]}>
        <WebViewComponent
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: leafletHtml }}
          onMessage={handleMessage}
          onError={() => setHasWebViewError(true)}
          style={styles.webView}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      </View>
    )
  }

  // Fallback: Use MapView from react-native-maps if WebView fails or is not available
  if (MapViewComponent) {
    return (
      <View style={[styles.container, style]}>
        <MapViewComponent
          style={styles.webView}
          region={{
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={(e) => {
            if (e.nativeEvent && e.nativeEvent.coordinate && onLocationSelect) {
              onLocationSelect(e.nativeEvent.coordinate)
            }
          }}
        >
          {MarkerComponent && (
            <MarkerComponent
              coordinate={{ latitude, longitude }}
              draggable
              onDragEnd={(e) => {
                if (e.nativeEvent && e.nativeEvent.coordinate && onLocationSelect) {
                  onLocationSelect(e.nativeEvent.coordinate)
                }
              }}
            />
          )}
        </MapViewComponent>
      </View>
    )
  }

  return (
    <View style={[styles.container, styles.loadingContainer, style]}>
      <Text style={{ color: '#6B7280' }}>Carte indisponible</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
})
