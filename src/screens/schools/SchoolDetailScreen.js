import { useTheme } from '../../context/ThemeContext'
import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { getSchoolById, createEnrollment } from '../../services/services'
import { useAuth } from '../../context/AuthContext'
import { formatPrice } from '../../utils/formatters'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderLight,
  },
  backBtn: { padding: 8 },
  appBarTitle: { ...Typography.h4, color: themeColors.textPrimary },
  heroImage: { width: '100%', height: 220, resizeMode: 'cover' },
  infoContainer: {
    padding: Spacing.lg,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderLight,
  },
  schoolName: { ...Typography.h2, color: themeColors.textPrimary, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  infoText: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginLeft: 8 },
  description: { ...Typography.bodyMedium, color: themeColors.textPrimary, marginTop: 16, lineHeight: 22 },
  offersContainer: { padding: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: themeColors.textPrimary, marginBottom: 16 },
  offerCard: {
    backgroundColor: themeColors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  offerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  offerName: { ...Typography.h4, color: themeColors.textPrimary, flex: 1, marginRight: 8 },
  offerPrice: { ...Typography.h3, color: themeColors.primary },
  offerDesc: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginBottom: 12 },
  offerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  badgeText: { fontSize: 12, fontWeight: '700' },
  enrollBtn: {
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  enrollBtnText: { color: themeColors.textOnPrimary, fontSize: 15, fontWeight: '700' },
  emptyText: { color: themeColors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 20 },
  
  // Modal styles
  modalSubtitle: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginBottom: 16 },
  fieldRow: { flexDirection: 'row', marginBottom: 12 },
  input: {
    backgroundColor: themeColors.background,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.background,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
  },
  errorText: { color: themeColors.error, fontSize: 13, marginBottom: 8 },
  loginLink: { marginTop: 16, alignItems: 'center' },
  loginLinkText: { color: themeColors.textSecondary, fontSize: 14 },
  loginLinkBold: { color: themeColors.primary, fontWeight: '700' },
})

export default function SchoolDetailScreen({ route, navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { schoolId } = route.params || {}
  const { user, logout, register, login } = useAuth()
  
  const [school, setSchool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  // Fast Registration State
  const [fastRegVisible, setFastRegVisible] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [regLoading, setRegLoading] = useState(false)
  const [regError, setRegError] = useState('')

  useEffect(() => {
    if (!schoolId) {
      Alert.alert(t('schools.err_title'), t('schools.err_missing_id'))
      navigation.goBack()
      return
    }
    fetchSchoolDetails()
  }, [schoolId])

  async function fetchSchoolDetails() {
    try {
      setLoading(true)
      const data = await getSchoolById(schoolId)
      setSchool(data)
    } catch (error) {
      console.log('Error fetching school:', error)
      Alert.alert(t('schools.err_title'), t('schools.err_load_details'))
    } finally {
      setLoading(false)
    }
  }

  async function handleEnroll(offer) {
    if (!user) {
      setSelectedOffer(offer)
      setFastRegVisible(true)
      return
    }

    Alert.alert(
      t('schools.confirm_title'),
      `${t('schools.confirm_enroll')} "${offer.name}" ?`,
      [
        { text: t('schools.btn_cancel'), style: 'cancel' },
        {
          text: t('schools.btn_enroll'),
          style: 'default',
          onPress: async () => {
            try {
              setEnrolling(true)
              await createEnrollment({ offerId: offer.id })
              Alert.alert(t('schools.success_title'), t('schools.success_enroll'))
              // The backend might change user.role from VISITOR to STUDENT
              await logout()
              Alert.alert(t('schools.info_title'), t('schools.info_relogin'))
            } catch (error) {
              console.log('Enrollment error:', error)
              Alert.alert(t('schools.err_title'), error.response?.data?.message || t('schools.err_enroll'))
            } finally {
              setEnrolling(false)
            }
          }
        }
      ]
    )
  }

  async function handleFastRegistration() {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      setRegError(t('schools.err_fields_req'))
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setRegError(t('schools.err_pwd_match'))
      return
    }
    setRegError('')
    setRegLoading(true)
    try {
      // 1. Create account (VISITOR)
      await register({ ...formData, role: 'VISITOR' })
      
      // 2. Enroll to offer (Backend sets role to STUDENT and sets schoolId)
      await createEnrollment({ offerId: selectedOffer.id })
      
      // 3. Re-login to fetch new token with STUDENT role
      await login(formData.email, formData.password)
      
      setFastRegVisible(false)
      Alert.alert(t('schools.success_title'), t('schools.success_enroll_student'))
      // Navigation is automatically handled by AppNavigator
    } catch (err) {
      setRegError(err.response?.data?.message || err.message || t('schools.err_enroll'))
    } finally {
      setRegLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    )
  }

  if (!school) {
    return (
      <View style={styles.center}>
        <Text style={Typography.bodyLarge}>{t('schools.not_found')}</Text>
        <TouchableOpacity style={{ marginTop: 20 }} onPress={() => navigation.goBack()}>
          <Text style={{ color: themeColors.primary }}>{t('schools.btn_back')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const defaultImage = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=600&q=80'

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle} numberOfLines={1}>{t('schools.details_title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: Spacing.xl }}>
        <Image
          source={{ uri: school.imageUrl || defaultImage }}
          style={styles.heroImage}
        />
        
        <View style={styles.infoContainer}>
          <Text style={styles.schoolName}>{school.name}</Text>
          
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={themeColors.textSecondary} />
            <Text style={styles.infoText}>{school.address || t('schools.no_address')}, {school.city}</Text>
          </View>
          
          {(school.phone || school.email) && (
            <View style={[styles.row, { marginTop: 8 }]}>
              <Ionicons name="call-outline" size={18} color={themeColors.textSecondary} />
              <Text style={styles.infoText}>{school.phone || school.email}</Text>
            </View>
          )}

          <Text style={styles.description}>
            {school.description || t('schools.no_desc')}
          </Text>
        </View>

        <View style={styles.offersContainer}>
          <Text style={styles.sectionTitle}>{t('schools.offers_title')}</Text>
          
          {school.offers && school.offers.length > 0 ? (
            school.offers.map((offer) => (
              <View key={offer.id} style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <Text style={styles.offerName}>{offer.name}</Text>
                  <Text style={styles.offerPrice}>{formatPrice(offer.price)}</Text>
                </View>
                
                <Text style={styles.offerDesc}>{offer.description || t('schools.no_offer_desc')}</Text>
                
                <View style={styles.offerMeta}>
                  <Badge label={`${t('schools.permit')} ${offer.permitType || 'B'}`} color={themeColors.primary} />
                  <Badge label={`${offer.hours || 0}${t('schools.hours_driving')}`} color={themeColors.secondary} />
                </View>

                <TouchableOpacity 
                  style={[styles.enrollBtn, enrolling && { opacity: 0.7 }]} 
                  onPress={() => handleEnroll(offer)}
                  disabled={enrolling}
                >
                  <Text style={styles.enrollBtnText}>{t('schools.enroll_offer')}</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>{t('schools.no_offers')}</Text>
          )}
        </View>
      </ScrollView>

      {/* Fast Registration Modal */}
      <Modal 
        isVisible={fastRegVisible} 
        onClose={() => setFastRegVisible(false)}
        title={t('schools.fast_reg_title')}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Text style={styles.modalSubtitle}>
            {t('schools.fast_reg_subtitle')} \"{selectedOffer?.name}\".
          </Text>
          
          <View style={styles.fieldRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder={t('schools.fast_reg_firstname')}
              value={formData.firstName}
              onChangeText={(t) => setFormData({...formData, firstName: t})}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder={t('schools.fast_reg_lastname')}
              value={formData.lastName}
              onChangeText={(t) => setFormData({...formData, lastName: t})}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder={t('schools.fast_reg_email')}
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(t) => setFormData({...formData, email: t})}
          />
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('schools.fast_reg_pwd')}
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(t) => setFormData({...formData, password: t})}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder={t('schools.fast_reg_confirm_pwd')}
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(t) => setFormData({...formData, confirmPassword: t})}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {regError ? <Text style={styles.errorText}>{regError}</Text> : null}

          <Button 
            loading={regLoading} 
            onPress={handleFastRegistration}
            style={{ marginTop: 16 }}
            fullWidth
          >
            {t('schools.fast_reg_submit')}
          </Button>

          <TouchableOpacity onPress={() => {
            setFastRegVisible(false)
            navigation.navigate('Login')
          }} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>{t('schools.fast_reg_already')} <Text style={styles.loginLinkBold}>{t('schools.fast_reg_login')}</Text></Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  )
}

function Badge({ label, color }) {
  const { Colors: themeColors } = useTheme();
  const badgeStyles = getStyles(themeColors);
  return (
    <View style={[badgeStyles.badge, { backgroundColor: color + '20' }]}>
      <Text style={[badgeStyles.badgeText, { color }]}>{label}</Text>
    </View>
  )
}

