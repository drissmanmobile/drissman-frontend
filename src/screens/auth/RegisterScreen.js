// src/screens/auth/RegisterScreen.js
import { useTheme } from '../../context/ThemeContext'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
  Modal, ActivityIndicator, Linking,
} from 'react-native'
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../context/AuthContext'
import { Colors, Typography, Spacing, Radius } from '../../utils/theme'
import Button from '../../components/ui/Button'
import { Ionicons } from '@expo/vector-icons'
import OSMMapPicker from '../../components/ui/OSMMapPicker'



export default function RegisterScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { register } = useAuth()

  const schema = useMemo(() => z.object({
    firstName: z.string().min(2, t('register.err_firstname')),
    lastName: z.string().min(2, t('register.err_lastname')),
    username: z.string().optional(),
    email: z.string().email(t('register.err_email')),
    phone: z.string().min(9, t('register.err_phone')),
    password: z.string().min(6, t('register.err_password_len')),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'SCHOOL_ADMIN', 'MONITOR']),
    schoolName: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t('register.err_password_match'),
    path: ['confirmPassword'],
  }).refine((d) => d.role !== 'SCHOOL_ADMIN' || (d.schoolName && d.schoolName.length > 0), {
    message: t('register.err_school_req'),
    path: ['schoolName']
  }), [t])

  const ROLES = useMemo(() => [
    { value: 'STUDENT', label: t('register.role_student'), desc: t('register.role_student_desc') },
    { value: 'SCHOOL_ADMIN', label: t('register.role_admin'), desc: t('register.role_admin_desc') },
    { value: 'MONITOR', label: t('register.role_monitor'), desc: t('register.role_monitor_desc') },
  ], [t])
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSchoolInput, setShowSchoolInput] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [addressInfo, setAddressInfo] = useState('')
  const [tempCoords, setTempCoords] = useState({ latitude: 3.8480, longitude: 11.5021 })

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', username: '', email: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT', schoolName: '', latitude: null, longitude: null },
  })

  const selectedRole = watch('role')
  const currentLatitude = watch('latitude')
  const currentLongitude = watch('longitude')

  async function handleFetchAddressFromCoords(coords) {
    const target = coords || tempCoords
    setLoadingAddress(true)
    try {
      // Primary: OpenStreetMap Nominatim API (100% free, works on Android without Google Key)
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${target.latitude}&lon=${target.longitude}&addressdetails=1`
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'DrissmanAutoEcoleApp/1.0 (cm.drissman.app)',
          'Accept-Language': 'fr',
        },
      })
      const data = await res.json()
      if (data && data.display_name) {
        const addr = data.address || {}
        const mainRoad = addr.road || addr.pedestrian || addr.suburb || addr.neighbourhood || addr.quarter || ''
        const city = addr.city || addr.town || addr.village || addr.county || addr.state || ''
        const country = addr.country || ''
        const parts = [mainRoad, city, country].filter(Boolean)
        const formatted = parts.length > 0 ? parts.join(', ') : data.display_name
        setAddressInfo(formatted)
        setLoadingAddress(false)
        return
      }
    } catch (e) {
      console.log('OSM Nominatim reverse geocode error:', e)
    }

    // Fallback: Expo Location Geocoder
    try {
      const res = await Location.reverseGeocodeAsync({
        latitude: target.latitude,
        longitude: target.longitude,
      })
      if (res && res.length > 0) {
        const item = res[0]
        const parts = [
          item.name || item.street,
          item.district || item.subregion,
          item.city,
          item.country
        ].filter(Boolean)
        const formatted = parts.length > 0 ? parts.join(', ') : `${target.latitude.toFixed(4)}, ${target.longitude.toFixed(4)}`
        setAddressInfo(formatted)
      } else {
        setAddressInfo(`Lat: ${target.latitude.toFixed(5)}, Lng: ${target.longitude.toFixed(5)}`)
      }
    } catch (e) {
      console.log('Expo reverse geocode error:', e)
      setAddressInfo(`Lat: ${target.latitude.toFixed(5)}, Lng: ${target.longitude.toFixed(5)}`)
    } finally {
      setLoadingAddress(false)
    }
  }

  function handleOpenExternalMaps() {
    const label = encodeURIComponent(watch('schoolName') || 'Auto-École')
    const lat = tempCoords.latitude
    const lng = tempCoords.longitude
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    })
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`)
    })
  }

  async function handleFetchCurrentLocation() {
    setLoadingLocation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        alert('Permission de géolocalisation refusée. Vous pouvez déplacer le marqueur sur la carte.')
        setLoadingLocation(false)
        return
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const newCoords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      }
      setTempCoords(newCoords)
      handleFetchAddressFromCoords(newCoords)
    } catch (e) {
      console.log('Location fetch error:', e)
    } finally {
      setLoadingLocation(false)
    }
  }

  function handleConfirmLocation() {
    setValue('latitude', tempCoords.latitude)
    setValue('longitude', tempCoords.longitude)
    setShowMapModal(false)
  }

  async function onSubmit(data) {
    setServerError('')
    try {
      const { confirmPassword, ...payload } = data
      await register(payload)
    } catch (err) {
      setServerError(err.message || t('register.err_register'))
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.dark} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.logo}>Drissman</Text>
          <Text style={styles.heroTitle}>{t('register.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('register.subtitle')}</Text>
        </View>

        <View style={styles.form}>

          {/* Sélection du rôle */}
          <Text style={styles.sectionTitle}>{t('register.i_am')}</Text>
          <View style={styles.rolesRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setValue('role', r.value)}
                style={[styles.roleCard, selectedRole === r.value && styles.roleCardActive]}
              >
                <Text style={styles.roleEmoji}>{r.label.split(' ')[0]}</Text>
                <Text style={[styles.roleLabel, selectedRole === r.value && styles.roleLabelActive]}>
                  {r.label.split(' ')[1]}
                </Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nom de l'auto-école & Sélection de l'emplacement GPS (affiché uniquement si Gérant) */}
          {selectedRole === 'SCHOOL_ADMIN' && (
            <View style={styles.field}>
              {!showSchoolInput ? (
                <TouchableOpacity 
                  onPress={() => setShowSchoolInput(true)} 
                  style={{
                    backgroundColor: themeColors.primaryLight,
                    padding: 12,
                    borderRadius: Radius.md,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: themeColors.primary
                  }}
                >
                  <Text style={{ color: themeColors.primary, fontWeight: 'bold' }}>{t('register.create_school')}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.label}>{t('register.school_name')}</Text>
                  <Controller control={control} name="schoolName" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={[styles.input, errors.schoolName && styles.inputError]} placeholder={t('register.school_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} />
                  )} />
                  {errors.schoolName && <Text style={styles.error}>{errors.schoolName.message}</Text>}

                  {/* Bouton d'ouverture de la carte */}
                  <TouchableOpacity
                    onPress={() => {
                      if (currentLatitude && currentLongitude) {
                        setTempCoords({ latitude: currentLatitude, longitude: currentLongitude })
                      }
                      setShowMapModal(true)
                    }}
                    style={styles.mapPickerTriggerBtn}
                  >
                    <Ionicons name="map-outline" size={20} color={themeColors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.mapPickerTriggerText}>
                      {currentLatitude && currentLongitude
                        ? `Emplacement défini (${currentLatitude.toFixed(3)}, ${currentLongitude.toFixed(3)})`
                        : "Localiser l'auto-école sur la carte"}
                    </Text>
                  </TouchableOpacity>

                  {currentLatitude && currentLongitude ? (
                    <View style={styles.locationBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={styles.locationBadgeText}>Coordonnées GPS enregistrées</Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
          )}

          {/* Prénom & Nom */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t('register.firstname')}</Text>
              <Controller control={control} name="firstName" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={[styles.input, errors.firstName && styles.inputError]} placeholder={t('register.firstname_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} />
              )} />
              {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>{t('register.lastname')}</Text>
              <Controller control={control} name="lastName" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={[styles.input, errors.lastName && styles.inputError]} placeholder={t('register.lastname_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} />
              )} />
              {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}
            </View>
          </View>

          {/* Nom d'utilisateur (Optionnel) */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.username')}</Text>
            <Controller control={control} name="username" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.input, errors.username && styles.inputError]} placeholder={t('register.username_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} autoCapitalize="none" autoCorrect={false} />
            )} />
            {errors.username && <Text style={styles.error}>{errors.username.message}</Text>}
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.email')}</Text>
            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder={t('register.email_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} keyboardType="email-address" autoCapitalize="none" />
            )} />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>

          {/* Téléphone */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.phone')}</Text>
            <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.input, errors.phone && styles.inputError]} placeholder={t('register.phone_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} keyboardType="phone-pad" />
            )} />
            {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}
          </View>

          {/* Mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.password')}</Text>
            <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('register.password_placeholder')}
                  placeholderTextColor={themeColors.textMuted}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )} />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </View>

          {/* Confirmation */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.confirm_password')}</Text>
            <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('register.password_placeholder')}
                  placeholderTextColor={themeColors.textMuted}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )} />
            {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}
          </View>

          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth size="lg" style={{ marginTop: 8 }}>
            {t('register.submit')}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              {t('register.already_have_account')} <Text style={styles.loginLinkBold}>{t('register.login_link')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de sélection de position sur la carte */}
      <Modal visible={showMapModal} animationType="slide" onRequestClose={() => setShowMapModal(false)}>
        <View style={styles.mapModalContainer}>
          <View style={styles.mapModalHeader}>
            <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Position de l'auto-école</Text>

            <View style={styles.headerRightActions}>
              <TouchableOpacity onPress={handleOpenExternalMaps} style={styles.gmapsHeaderBtn} title="Ouvrir dans Google Maps">
                <Ionicons name="map-outline" size={20} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleFetchCurrentLocation} style={styles.gpsLocBtn} disabled={loadingLocation}>
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={themeColors.primary} />
                ) : (
                  <Ionicons name="locate" size={22} color={themeColors.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <OSMMapPicker
              latitude={tempCoords.latitude}
              longitude={tempCoords.longitude}
              onLocationSelect={(coords) => {
                setTempCoords(coords)
                handleFetchAddressFromCoords(coords)
              }}
              style={{ flex: 1 }}
            />

            {/* Banner avec informations d'adresse et boutons d'action */}
            <View style={styles.mapBannerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Ionicons name="location-sharp" size={18} color="#4F46E5" style={{ marginRight: 6 }} />
                <Text style={styles.mapAddressTitle}>Emplacement sélectionné :</Text>
              </View>

              <Text style={styles.mapBannerText}>
                {addressInfo ? addressInfo : `Lat: ${tempCoords.latitude.toFixed(5)}, Lng: ${tempCoords.longitude.toFixed(5)}`}
              </Text>

              <View style={styles.mapActionRow}>
                <TouchableOpacity
                  onPress={() => handleFetchAddressFromCoords(tempCoords)}
                  style={styles.fetchAddrBtn}
                  disabled={loadingAddress}
                >
                  {loadingAddress ? (
                    <ActivityIndicator size="small" color="#4F46E5" />
                  ) : (
                    <>
                      <Ionicons name="refresh-outline" size={16} color="#4F46E5" style={{ marginRight: 4 }} />
                      <Text style={styles.fetchAddrBtnText}>Récupérer l'adresse</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={handleOpenExternalMaps} style={styles.openGmapsBtn}>
                  <Ionicons name="navigate-outline" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.openGmapsBtnText}>Google Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.mapModalFooter}>
            <Button onPress={handleConfirmLocation} fullWidth size="lg">
              Confirmer cet emplacement
            </Button>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.dark },
  container: { flexGrow: 1 },
  hero: { backgroundColor: themeColors.dark, paddingTop: 60, paddingBottom: 32, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  logo: { fontSize: 22, fontWeight: '800', color: themeColors.primary, marginBottom: 16 },
  heroTitle: { ...Typography.h2, color: themeColors.textWhite, marginBottom: 6 },
  heroSubtitle: { ...Typography.body, color: '#9CA3AF', textAlign: 'center' },
  form: { flex: 1, backgroundColor: themeColors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.lg, paddingTop: 28 },
  sectionTitle: { ...Typography.h4, color: themeColors.textPrimary, marginBottom: 12 },
  rolesRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleCard: { flex: 1, padding: 12, borderRadius: Radius.md, borderWidth: 1.5, borderColor: themeColors.border, backgroundColor: themeColors.surface, alignItems: 'center' },
  roleCardActive: { borderColor: themeColors.primary, backgroundColor: '#FFFBEB' },
  roleEmoji: { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: themeColors.textSecondary },
  roleLabelActive: { color: themeColors.primary },
  roleDesc: { fontSize: 10, color: themeColors.textMuted, textAlign: 'center', marginTop: 2 },
  row: { flexDirection: 'row' },
  field: { marginBottom: 14 },
  label: { ...Typography.smallMedium, color: themeColors.textPrimary, marginBottom: 6 },
  input: { backgroundColor: themeColors.surface, borderWidth: 1.5, borderColor: themeColors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: themeColors.textPrimary },
  inputError: { borderColor: themeColors.error },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderWidth: 1.5,
    borderColor: themeColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  inputField: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: themeColors.textPrimary,
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
  error: { color: themeColors.error, fontSize: 11, marginTop: 3 },
  serverErrorBox: { backgroundColor: themeColors.errorLight, borderRadius: Radius.md, padding: 12, marginBottom: 12 },
  serverErrorText: { color: themeColors.error, fontSize: 13 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: themeColors.textSecondary, fontSize: 14 },
  loginLinkBold: { color: themeColors.primary, fontWeight: '700' },
  mapPickerTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.surface,
    borderWidth: 1.5,
    borderColor: themeColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  mapPickerTriggerText: {
    color: themeColors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  locationBadgeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '500',
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  mapModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  gpsLocBtn: {
    padding: 6,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gmapsHeaderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  mapMarkerContainer: {
    backgroundColor: themeColors.primary,
    padding: 10,
    borderRadius: 24,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  mapBannerInfo: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: Radius.md,
    padding: 12,
    flexDirection: 'column',
  },
  mapAddressTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#312E81',
  },
  mapBannerText: {
    color: '#3730A3',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  mapActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 8,
  },
  fetchAddrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  fetchAddrBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F46E5',
  },
  openGmapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
  },
  openGmapsBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapModalFooter: {
    padding: 16,
    backgroundColor: themeColors.surface,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
})
