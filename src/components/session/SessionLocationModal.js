import React, { useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { formatDate } from '../../utils/formatters'

export default function SessionLocationModal({ visible, onClose, session }) {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const mapRef = useRef(null)

  if (!session) return null

  // Coordonnées par défaut (ex: Yaoundé / Douala ou coordonnées transmises par la séance)
  const latitude = session?.latitude || 3.8480
  const longitude = session?.longitude || 11.5021

  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  }

  const openNavigationApp = () => {
    const label = encodeURIComponent(session?.meetingPoint || 'Point de Rendez-vous')
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    })
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`)
    })
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
            <Text style={styles.headerTitle}>Lieu de la séance</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {session?.offerName || session?.title || 'Séance de conduite'}
            </Text>
          </View>
        </View>

        {/* Map View showing the meeting location */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_DEFAULT}
            initialRegion={region}
            showsUserLocation={true}
            showsCompass={true}
          >
            <Marker
              coordinate={{ latitude, longitude }}
              title="Point de RDV"
              description={session?.meetingPoint || 'Lieu prévu pour la séance'}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="location" size={26} color="#FFFFFF" />
              </View>
            </Marker>
          </MapView>

          <View style={styles.locationBadgeBanner}>
            <Ionicons name="information-circle-outline" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
            <Text style={styles.locationBadgeText}>
              Consultez ci-dessous l'emplacement prévu pour le début de votre séance de conduite.
            </Text>
          </View>
        </View>

        {/* Footer Info Card with Session details */}
        <View style={styles.footerCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="location-sharp" size={20} color={themeColors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Point de Rendez-vous</Text>
              <Text style={styles.infoTitle}>
                {session?.meetingPoint || 'Devant l\'agence centrale'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={themeColors.textSecondary} />
            <Text style={styles.detailText}>
              {formatDate(session?.date)} • {session?.startTime ? session.startTime.substring(0, 5) : '—'} - {session?.endTime ? session.endTime.substring(0, 5) : '—'}
            </Text>
          </View>

          {session?.schoolName && (
            <View style={styles.detailRow}>
              <Ionicons name="business-outline" size={16} color={themeColors.textSecondary} />
              <Text style={styles.detailText}>{session.schoolName}</Text>
            </View>
          )}

          {session?.monitorName && (
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color={themeColors.textSecondary} />
              <Text style={styles.detailText}>Moniteur: {session.monitorName}</Text>
            </View>
          )}

          {/* Action button to open GPS app */}
          <TouchableOpacity style={styles.navigateBtn} onPress={openNavigationApp} activeOpacity={0.85}>
            <Ionicons name="navigate-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.navigateBtnText}>Ouvrir dans Google Maps</Text>
          </TouchableOpacity>
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
    mapContainer: { flex: 1 },
    map: { width: '100%', height: '100%' },
    markerContainer: {
      backgroundColor: '#4F46E5',
      padding: 8,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      ...Shadows.md,
    },
    locationBadgeBanner: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      backgroundColor: '#EEF2FF',
      borderColor: '#C7D2FE',
      borderWidth: 1,
      borderRadius: Radius.md,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      ...Shadows.md,
    },
    locationBadgeText: {
      flex: 1,
      fontSize: 13,
      color: '#3730A3',
      fontWeight: '500',
    },
    footerCard: {
      padding: Spacing.lg,
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      ...Shadows.lg,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    infoLabel: {
      fontSize: 12,
      color: themeColors.textMuted,
      fontWeight: '500',
    },
    infoTitle: {
      fontSize: 16,
      color: themeColors.textPrimary,
      fontWeight: '700',
      marginTop: 2,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    detailText: {
      fontSize: 13,
      color: themeColors.textSecondary,
      fontWeight: '500',
    },
    navigateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4F46E5',
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      marginTop: Spacing.md,
      gap: Spacing.sm,
    },
    navigateBtnText: {
      ...Typography.button,
      color: '#FFFFFF',
    },
  })
