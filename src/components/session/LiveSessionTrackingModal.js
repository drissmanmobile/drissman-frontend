import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import {
  fetchLiveSessionLocation,
  fetchSessionTrail,
  startInstructorSessionTracking,
  stopInstructorSessionTracking,
} from '../../services/sessionTrackingService'

export default function LiveSessionTrackingModal({ visible, onClose, session, isInstructor }) {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const mapRef = useRef(null)

  const [currentLocation, setCurrentLocation] = useState(null)
  const [trail, setTrail] = useState([])
  const [isTrackingActive, setIsTrackingActive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let intervalId = null

    if (visible && session?.id) {
      loadData()
      // Polling de la position toutes les 5 secondes pour l'élève ou le moniteur
      intervalId = setInterval(loadData, 5000)
    } else {
      stopInstructorSessionTracking()
      setIsTrackingActive(false)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [visible, session])

  const loadData = async () => {
    if (!session?.id) return
    try {
      const [latest, trailData] = await Promise.all([
        fetchLiveSessionLocation(session.id).catch(() => null),
        fetchSessionTrail(session.id).catch(() => []),
      ])

      if (latest && latest.latitude && latest.longitude) {
        setCurrentLocation(latest)
      }

      if (Array.isArray(trailData) && trailData.length > 0) {
        const coords = trailData.map(pt => ({
          latitude: pt.latitude,
          longitude: pt.longitude,
        }))
        setTrail(coords)
      }
    } catch (e) {
      console.log('Erreur chargement suivi GPS:', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleInstructorTracking = async () => {
    if (isTrackingActive) {
      stopInstructorSessionTracking()
      setIsTrackingActive(false)
    } else {
      const watcher = await startInstructorSessionTracking(session.id, (err) => alert(err))
      if (watcher) {
        setIsTrackingActive(true)
        loadData()
      }
    }
  }

  const initialRegion = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }
    : {
        latitude: 3.8480, // Yaoundé centre par défaut
        longitude: 11.5021,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Suivi GPS en Temps Réel</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {session?.title || session?.offerName || 'Séance de conduite'}
            </Text>
          </View>
          {currentLocation?.speed != null && (
            <View style={styles.speedBadge}>
              <Text style={styles.speedText}>{Math.round(currentLocation.speed)} km/h</Text>
            </View>
          )}
        </View>

        {/* Map View */}
        <View style={styles.mapContainer}>
          {loading && !currentLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={styles.loadingText}>Chargement de la position GPS...</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsCompass={true}
              >
                {/* Polyline Route Trail */}
                {trail.length > 1 && (
                  <Polyline
                    coordinates={trail}
                    strokeColor={themeColors.primary}
                    strokeWidth={4}
                  />
                )}

                {/* Current Vehicle Position Marker */}
                {currentLocation && (
                  <Marker
                    coordinate={{
                      latitude: currentLocation.latitude,
                      longitude: currentLocation.longitude,
                    }}
                    title="Véhicule de conduite"
                    description={`Vitesse: ${Math.round(currentLocation.speed || 0)} km/h`}
                    rotation={currentLocation.heading || 0}
                  >
                    <View style={styles.markerContainer}>
                      <Ionicons name="car" size={26} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}
              </MapView>

              {/* Notice when GPS signal is not active yet */}
              {!currentLocation && (
                <View style={styles.noGpsBanner}>
                  <Ionicons name="location-outline" size={20} color="#D97706" style={{ marginRight: 8 }} />
                  <Text style={styles.noGpsText}>
                    Signal GPS en attente. Le moniteur n'a pas encore démarré la transmission GPS pour ce cours.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer Info Card */}
        <View style={styles.footerCard}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color={themeColors.primary} />
            <Text style={styles.infoText}>
              Point de RDV: {session?.meetingPoint || 'Non renseigné'}
            </Text>
          </View>

          {isInstructor && (
            <TouchableOpacity
              style={[styles.actionBtn, isTrackingActive ? styles.stopBtn : styles.startBtn]}
              onPress={toggleInstructorTracking}
            >
              <Ionicons
                name={isTrackingActive ? 'stop-circle-outline' : 'play-circle-outline'}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.actionBtnText}>
                {isTrackingActive ? 'Arrêter la transmission GPS' : 'Démarrer la transmission GPS'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  )
}

const getStyles = (themeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 48,
      paddingHorizontal: Spacing.md,
      paddingBottom: Spacing.md,
      backgroundColor: themeColors.surface,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.borderLight,
      ...Shadows.sm,
    },
    closeBtn: { padding: Spacing.xs, marginRight: Spacing.sm },
    headerTitleContainer: { flex: 1 },
    headerTitle: { ...Typography.h3, color: themeColors.textPrimary },
    headerSub: { ...Typography.caption, color: themeColors.textSecondary },
    speedBadge: {
      backgroundColor: themeColors.primary,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    speedText: { ...Typography.caption, color: themeColors.textOnPrimary, fontWeight: '700' },
    mapContainer: { flex: 1 },
    map: { width: '100%', height: '100%' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: Spacing.md, color: themeColors.textSecondary },
    markerContainer: {
      backgroundColor: themeColors.primary,
      padding: 6,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...Shadows.md,
    },
    footerCard: {
      padding: Spacing.lg,
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      ...Shadows.lg,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
    infoText: { ...Typography.bodyMedium, color: themeColors.textPrimary, marginLeft: Spacing.sm, flex: 1 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      gap: Spacing.sm,
    },
    startBtn: { backgroundColor: '#10B981' },
    stopBtn: { backgroundColor: '#EF4444' },
    actionBtnText: { ...Typography.button, color: '#FFFFFF' },
    noGpsBanner: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      ...Shadows.md,
    },
    noGpsText: {
      flex: 1,
      fontSize: 13,
      color: '#92400E',
      fontWeight: '500',
    },
  })
