// src/screens/admin/screens.js
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect, useCallback } from 'react'
import { Platform } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Linking,
  Image,
  Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import * as ImagePicker from 'expo-image-picker'
import { useAuth } from '../../context/AuthContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { useTranslation } from 'react-i18next'
import { useNavigation, useFocusEffect } from '@react-navigation/native'
import { updateProfile } from '../../services/auth.service'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { formatDate, formatTime, formatPrice } from '../../utils/formatters'
import { Badge, Modal, Button, EmptyState } from '../../components/ui/index'
import LiveSessionTrackingModal from '../../components/session/LiveSessionTrackingModal'
import {
  getAdminDashboard,
  getAdminOffers,
  createAdminOffer,
  updateAdminOffer,
  deleteAdminOffer,
  getAdminMonitors,
  createAdminMonitor,
  updateAdminMonitor,
  deleteAdminMonitor,
  getAdminAvailableOffers,
  getAdminAvailableEnrollments,
  getAdminEnrollments,
  updateAdminEnrollmentStatus,
  scheduleAdminSession,
  getAdminModules,
  getAdminSchoolProfile,
  updateAdminSchoolProfile,
  getSchoolDocuments,
  uploadDocument,
  uploadImage,
  getAdminVehicles,
} from '../../services/services'

function StatCard({ label, value, icon, color, onPress }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const cardColor = color || themeColors.primary;
  return (
    <TouchableOpacity 
      style={[styles.statCard, Shadows.sm]} 
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={{ marginBottom: 8 }}>{typeof icon === 'string' ? <Text style={styles.statIcon}>{icon}</Text> : icon}</View>
      <Text style={[styles.statValue, { color: cardColor }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

// =====================================================
// 1. DASHBOARD SCREEN
// =====================================================
export default function AdminDashboardScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openMenu } = useSideMenu()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trackingSession, setTrackingSession] = useState(null)
  
  // School Documents State
  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Students Modal State
  const [allStudentsModalVisible, setAllStudentsModalVisible] = useState(false)
  const [offersWithStudents, setOffersWithStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [expandedOffer, setExpandedOffer] = useState(null)

  // Pending Enrollments State
  const [pendingModalVisible, setPendingModalVisible] = useState(false)
  const [pendingEnrollments, setPendingEnrollments] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [updatingEnrollmentId, setUpdatingEnrollmentId] = useState(null)

  useFocusEffect(
    useCallback(() => {
      loadDashboard()
      if (user?.schoolId) {
        loadSchoolDocuments(user.schoolId)
      }
    }, [user])
  )

  async function loadDashboard() {
    try {
      setLoading(true)
      const data = await getAdminDashboard()
      setStats(data)
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_dashboard.err_stats'))
    } finally {
      setLoading(false)
    }
  }

  async function loadSchoolDocuments(schoolId) {
    try {
      setDocsLoading(true)
      const docs = await getSchoolDocuments(schoolId)
      setDocuments(docs)
    } catch (e) {
      console.log('Error fetching school docs', e)
    } finally {
      setDocsLoading(false)
    }
  }

  async function handleOpenAllStudents() {
    setAllStudentsModalVisible(true)
    setLoadingStudents(true)
    setExpandedOffer(null)
    try {
      const enrollments = await getAdminEnrollments()
      const offersMap = {}
      
      enrollments.forEach(e => {
        if (!offersMap[e.offerId]) {
          offersMap[e.offerId] = {
            id: e.offerId,
            name: e.offerName,
            students: []
          }
        }
        offersMap[e.offerId].students.push({
          studentId: e.studentId,
          studentName: e.studentName,
          status: e.status,
          hoursConsumed: e.hoursConsumed,
          hours: e.hours,
          enrolledAt: e.enrolledAt,
        })
      })
      
      setOffersWithStudents(Object.values(offersMap))
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_dashboard.err_students'))
    } finally {
      setLoadingStudents(false)
    }
  }

  async function handleOpenPendingEnrollments() {
    setPendingModalVisible(true)
    setLoadingPending(true)
    try {
      const enrollments = await getAdminEnrollments()
      const pending = enrollments.filter(e => e.status === 'PENDING')
      setPendingEnrollments(pending)
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), "Impossible de charger les inscriptions en attente")
    } finally {
      setLoadingPending(false)
    }
  }

  async function handleUpdateEnrollmentStatus(enrollmentId, newStatus) {
    try {
      setUpdatingEnrollmentId(enrollmentId)
      await updateAdminEnrollmentStatus(enrollmentId, newStatus)
      // Remove from list
      setPendingEnrollments(prev => prev.filter(e => e.id !== enrollmentId))
      // Refresh dashboard stats
      loadDashboard()
      Alert.alert(t('schools.success_title', 'Succès'), newStatus === 'ACTIVE' ? "Inscription acceptée" : "Inscription refusée")
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), err.message || "Une erreur est survenue")
    } finally {
      setUpdatingEnrollmentId(null)
    }
  }

  async function handleUploadDocument() {
    if (!user?.schoolId) return
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]
      Alert.alert(t('schools.info_title', 'Info'), t('admin_dashboard.uploading_info'))
      setUploading(true)
      
      const newDoc = await uploadDocument(
        file.uri,
        file.name,
        file.mimeType,
        user.id,
        null,
        null,
        user.schoolId
      )
      
      Alert.alert(t('schools.success_title', 'Succès'), t('admin_dashboard.success_upload'))
      setDocuments(prev => [...prev, newDoc])
    } catch (err) {
      console.log('Upload error', err)
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_dashboard.err_upload'))
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    )
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const ADMIN_TILES = [
    { id: 'offers', title: 'Offres', icon: 'cube-outline', bgColor: '#E0E7FF', iconColor: '#4F46E5', route: 'AdminOffers' },
    { id: 'monitors', title: 'Moniteurs', icon: 'people-outline', bgColor: '#DCFCE7', iconColor: '#16A34A', route: 'AdminInstructors' },
    { id: 'enrollments', title: 'Inscriptions', icon: 'school-outline', bgColor: '#FCE7F3', iconColor: '#DB2777', action: handleOpenPendingEnrollments },
    { id: 'planning', title: 'Planning', icon: 'calendar-outline', bgColor: '#FEF3C7', iconColor: '#D97706', route: 'AdminPlanning' },
    { id: 'modules', title: 'Modules', icon: 'book-outline', bgColor: '#F3E8FF', iconColor: '#9333EA', route: 'AdminModules' },
    { id: 'vehicles', title: 'Flotte auto', icon: 'car-outline', bgColor: '#FFEDD5', iconColor: '#EA580C', route: 'AdminVehicles' },
    { id: 'docs', title: 'Fichiers', icon: 'document-text-outline', bgColor: '#CFFAFE', iconColor: '#0891B2', action: handleUploadDocument },
    { id: 'school', title: 'Profil école', icon: 'business-outline', bgColor: '#CCFBF1', iconColor: '#0D9488', route: 'AdminProfile' },
  ]

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* En-tête Style Moniteur */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleOpenPendingEnrollments} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={themeColors.textPrimary} />
            {stats?.pendingValidations > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pendingValidations > 9 ? '9+' : stats.pendingValidations}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Bonjour,</Text>
          <Text style={styles.userName}>{user?.firstName || 'Admin'} 👋</Text>
          <Text style={styles.userRole}>Administrateur - Auto-école</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Inscriptions en attente */}
        {stats?.pendingValidations && stats.pendingValidations > 0 ? (
          <TouchableOpacity 
            onPress={handleOpenPendingEnrollments} 
            style={[styles.warningBanner, Shadows.sm]}
            activeOpacity={0.85}
          >
            <View style={styles.warningIconBadge}>
              <Ionicons name="alert-circle-outline" size={22} color="#D97706" />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Validation requise</Text>
              <Text style={styles.warningText}>
                {t('admin_dashboard.pending_validations', { count: stats.pendingValidations })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D97706" />
          </TouchableOpacity>
        ) : null}

        {/* Aperçu de l'auto-école (#0F172A Hero Card) */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Aperçu de l'auto-école</Text>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.dateBadgeText}>{formatDate(todayStr)}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <TouchableOpacity style={styles.statItem} onPress={handleOpenAllStudents} activeOpacity={0.7}>
              <Text style={styles.statValue}>{stats?.activeCandidates ?? 0}</Text>
              <Text style={styles.statLabel}>Élèves{'\n'}actifs</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.todaySessions ?? 0}</Text>
              <Text style={styles.statLabel}>Cours du{'\n'}jour</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats?.totalOffers ?? 0}</Text>
              <Text style={styles.statLabel}>Offres{'\n'}disponibles</Text>
            </View>
          </View>

          {/* Banner dédié au Chiffre d'Affaires (CA du mois) */}
          <View style={styles.revenueBanner}>
            <View style={styles.revenueHeaderRow}>
              <View style={styles.revenueIconBadge}>
                <Ionicons name="cash-outline" size={18} color="#10B981" />
              </View>
              <Text style={styles.revenueLabel}>CA du mois (Chiffre d'affaires)</Text>
            </View>
            <Text style={styles.revenueValue}>
              {stats?.monthlyRevenue ? `${formatPrice(stats.monthlyRevenue)}` : '0 FCFA'}
            </Text>
          </View>
        </View>

        {/* Grille Navigation 3 Colonnes */}
        <View style={styles.gridContainer}>
          {ADMIN_TILES.map((tile) => (
            <TouchableOpacity 
              key={tile.id} 
              style={styles.tile}
              onPress={() => {
                if (tile.route) navigation.navigate(tile.route)
                else if (tile.action) tile.action()
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.tileIconContainer, { backgroundColor: tile.bgColor }]}>
                <Ionicons name={tile.icon} size={28} color={tile.iconColor} />
              </View>
              <Text style={styles.tileTitle} numberOfLines={1}>{tile.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Documents & Fichiers de l'école */}
        <Text style={styles.sectionTitle}>{t('admin_dashboard.school_files', 'Documents de l\'école')}</Text>
        <View style={[styles.sectionCard, Shadows.sm]}>
          <TouchableOpacity 
            style={[styles.uploadActionBtn, uploading && { opacity: 0.7 }]} 
            onPress={handleUploadDocument}
            disabled={uploading}
          >
            <Ionicons name="cloud-upload-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.uploadActionBtnText}>
              {uploading ? t('admin_dashboard.uploading', 'Envoi en cours...') : t('admin_dashboard.upload_file', 'Ajouter un document')}
            </Text>
          </TouchableOpacity>

          {docsLoading ? (
            <ActivityIndicator color={themeColors.primary} style={{ marginVertical: 12 }} />
          ) : documents.length === 0 ? (
            <Text style={styles.emptyText}>{t('admin_dashboard.no_document', 'Aucun document téléversé')}</Text>
          ) : (
            documents.map((doc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.docRow}
                onPress={() => Linking.openURL(doc.fileUrl)}
              >
                <View style={styles.docIconBg}>
                  <Ionicons name="document-text-outline" size={20} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                  <Text style={styles.docDate}>
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : t('admin_dashboard.new', 'Nouveau')}
                  </Text>
                </View>
                <Ionicons name="open-outline" size={18} color={themeColors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Séances à venir */}
        <Text style={styles.sectionTitle}>Séances du jour & à venir</Text>
        {stats?.upcomingSessions && stats.upcomingSessions.length > 0 ? (
          stats.upcomingSessions.map((session) => (
            <View key={session.id} style={[styles.sessionCard, Shadows.sm]}>
              <View style={styles.sessionCardHeader}>
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="car-sport" size={24} color="#4F46E5" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sessionTitle}>Élève: {session.studentName}</Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color={themeColors.textSecondary} />
                    <Text style={styles.timeText}>
                      {formatDate(session.date)} • {session.startTime} - {session.endTime}
                    </Text>
                  </View>
                  <Text style={styles.sessionSub}>Moniteur: {session.monitorName}</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#4F46E5',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: Radius.md,
                      marginTop: 8,
                      alignSelf: 'flex-start',
                    }}
                    onPress={() => setTrackingSession(session)}
                  >
                    <Ionicons name="navigate-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>Suivi GPS en Temps Réel</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Planifié</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>Aucune séance prévue pour le moment.</Text>
          </View>
        )}

        {/* Activités récentes */}
        <Text style={styles.sectionTitle}>{t('admin_dashboard.recent_activities', 'Activités récentes')}</Text>
        {stats?.recentActivities && stats.recentActivities.length > 0 ? (
          stats.recentActivities.map((act) => (
            <View key={act.id} style={[styles.activityItemCard, Shadows.sm]}>
              <View style={styles.activityDotBg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.activityMsg}>{act.description}</Text>
                <Text style={styles.activityTime}>{formatDate(act.timestamp)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>{t('admin_dashboard.no_activity', 'Aucune activité récente')}</Text>
          </View>
        )}
      </ScrollView>

      <Modal isVisible={allStudentsModalVisible} onClose={() => setAllStudentsModalVisible(false)} title={t('admin_dashboard.students_by_offer')}>
        {loadingStudents ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginVertical: 20 }} />
        ) : offersWithStudents.length === 0 ? (
          <EmptyState message={t('admin_dashboard.no_enrollment')} icon="📦" />
        ) : (
          <ScrollView style={{ maxHeight: 500 }}>
            <Text style={{ marginBottom: 12, color: themeColors.textSecondary }}>{t('admin_dashboard.click_offer')}</Text>
            {offersWithStudents.map((offer, index) => {
              const isExpanded = expandedOffer === offer.id;
              return (
                <View key={index} style={{ marginBottom: 10, borderRadius: Radius.sm, overflow: 'hidden', backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.borderLight }}>
                  <TouchableOpacity 
                    style={{ padding: 16, backgroundColor: isExpanded ? themeColors.primary + '15' : themeColors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                    onPress={() => setExpandedOffer(isExpanded ? null : offer.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 16, color: themeColors.textPrimary }}>{offer.name}</Text>
                      <Text style={{ color: themeColors.textMuted, fontSize: 12, marginTop: 4 }}>{offer.students.length} élève(s) inscrit(s)</Text>
                    </View>
                    <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={themeColors.textSecondary} />
                  </TouchableOpacity>
                  
                  {isExpanded && (
                    <View style={{ padding: 16, backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.borderLight }}>
                      {offer.students.map((student, sIndex) => (
                         <View key={sIndex} style={{ paddingVertical: 8, borderBottomWidth: sIndex === offer.students.length - 1 ? 0 : 1, borderBottomColor: themeColors.borderLight }}>
                           <Text style={{ fontWeight: '600', color: themeColors.textPrimary }}>{student.studentName}</Text>
                           <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                             <Text style={{ color: themeColors.textSecondary, fontSize: 12 }}>{student.hoursConsumed}h / {student.hours}h • {new Date(student.enrolledAt).toLocaleDateString()}</Text>
                             <Text style={{ color: student.status === 'ACTIVE' ? themeColors.success : themeColors.warning, fontWeight: 'bold', fontSize: 12 }}>
                               {student.status}
                             </Text>
                           </View>
                         </View>
                      ))}
                    </View>
                  )}
                </View>
              )
            })}
          </ScrollView>
        )}
      </Modal>

      <Modal isVisible={pendingModalVisible} onClose={() => setPendingModalVisible(false)} title="Inscriptions en attente">
        {loadingPending ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginVertical: 20 }} />
        ) : pendingEnrollments.length === 0 ? (
          <EmptyState message="Aucune inscription en attente" icon="✅" />
        ) : (
          <ScrollView style={{ maxHeight: 500 }}>
            {pendingEnrollments.map((enrollment, index) => (
              <View key={index} style={{ marginBottom: 12, padding: 16, backgroundColor: themeColors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: themeColors.borderLight, ...Shadows.sm }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: themeColors.textPrimary }}>{enrollment.studentName}</Text>
                <Text style={{ color: themeColors.textSecondary, marginTop: 4 }}>Offre: {enrollment.offerName}</Text>
                <Text style={{ color: themeColors.textSecondary }}>Prix: {formatPrice(enrollment.price)}</Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 12, marginTop: 4 }}>Inscrit le: {new Date(enrollment.enrolledAt).toLocaleDateString()}</Text>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 10 }}>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: 10, backgroundColor: themeColors.errorLight, borderRadius: Radius.sm, alignItems: 'center', opacity: updatingEnrollmentId === enrollment.id ? 0.5 : 1 }}
                    onPress={() => handleUpdateEnrollmentStatus(enrollment.id, 'CANCELLED')}
                    disabled={updatingEnrollmentId === enrollment.id}
                  >
                    <Text style={{ color: themeColors.error, fontWeight: 'bold' }}>Refuser</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={{ flex: 1, padding: 10, backgroundColor: themeColors.success, borderRadius: Radius.sm, alignItems: 'center', opacity: updatingEnrollmentId === enrollment.id ? 0.5 : 1 }}
                    onPress={() => handleUpdateEnrollmentStatus(enrollment.id, 'ACTIVE')}
                    disabled={updatingEnrollmentId === enrollment.id}
                  >
                    <Text style={{ color: themeColors.textWhite, fontWeight: 'bold' }}>Accepter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </Modal>

      <LiveSessionTrackingModal
        visible={!!trackingSession}
        onClose={() => setTrackingSession(null)}
        session={trackingSession}
        isInstructor={false}
      />
    </SafeAreaView>
  )
}

// =====================================================
// 2. OFFERS SCREEN
// =====================================================
const PERMIT_CATEGORIES = [
  { id: 'A1', label: 'Motos, scooters, tricycles et quadricycles de 50 à 125 cm³' },
  { id: 'A', label: 'Motos de plus de 125 cm³, avec ou sans side-car, tricycles motorisés' },
  { id: 'B', label: 'Voitures, camionnettes et véhicules de moins de 3.5t comportant au plus 9 places' },
  { id: 'C', label: 'Camions et véhicules de transport de marchandises de plus de 3.5t' },
  { id: 'D', label: 'Bus, autocars et véhicules de transport de personnes de plus de 9 places' },
  { id: 'E', label: 'Véhicules des catégories B, C ou D tractant une remorque de plus de 750 kg' },
  { id: 'F', label: 'Véhicules de catégorie B spécialement aménagés pour les personnes en situation de handicap' },
  { id: 'G', label: 'Tracteurs agricoles, engins de travaux publics et certains véhicules industriels' }
]

export function AdminOffersScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const [offers, setOffers] = useState([])
  const [monitors, setMonitors] = useState([])
  const [selectedMonitorIds, setSelectedMonitorIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  const [saving, setSaving] = useState(false)
  const [enrollmentsModalVisible, setEnrollmentsModalVisible] = useState(false)
  const [selectedOfferEnrollments, setSelectedOfferEnrollments] = useState([])
  const [loadingEnrollments, setLoadingEnrollments] = useState(false)
  const [viewingOfferName, setViewingOfferName] = useState('')

  // Form Fields
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [hours, setHours] = useState('')
  const [permitType, setPermitType] = useState('B')
  const [showPermitPicker, setShowPermitPicker] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadOffers()
    }, [])
  )

  async function loadOffers() {
    try {
      setLoading(true)
      const [data, mons] = await Promise.all([getAdminOffers(), getAdminMonitors()])
      setOffers(data)
      setMonitors(mons)
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_offers.err_load'))
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingOffer(null)
    setName('')
    setDescription('')
    setPrice('')
    setHours('')
    setPermitType('B')
    setShowPermitPicker(false)
    setSelectedMonitorIds([])
    setModalVisible(true)
  }

  function openEditModal(offer) {
    setEditingOffer(offer)
    setName(offer.name)
    setDescription(offer.description || '')
    setPrice(offer.price.toString())
    setHours(offer.hours.toString())
    setPermitType(offer.permitType || 'B')
    setSelectedMonitorIds(offer.monitorIds || [])
    setModalVisible(true)
  }

  async function openEnrollmentsModal(offer) {
    setViewingOfferName(offer.name)
    setEnrollmentsModalVisible(true)
    setLoadingEnrollments(true)
    setSelectedOfferEnrollments([])
    try {
      const allEnrollments = await getAdminEnrollments()
      const filtered = allEnrollments.filter(e => e.offerId === offer.id)
      setSelectedOfferEnrollments(filtered)
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_offers.err_load_enrollments'))
    } finally {
      setLoadingEnrollments(false)
    }
  }

  async function handleSave() {
    if (!name.trim() || !price || !hours) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_offers.err_fill_fields'))
      return
    }
    try {
      setSaving(true)
      const offerData = {
        name,
        description,
        price: parseInt(price),
        hours: parseInt(hours),
        permitType,
        monitorIds: selectedMonitorIds,
      }
      if (editingOffer) {
        await updateAdminOffer(editingOffer.id, offerData)
        Alert.alert(t('schools.success_title', 'Succès'), t('admin_offers.success_updated'))
      } else {
        await createAdminOffer(offerData)
        Alert.alert(t('schools.success_title', 'Succès'), t('admin_offers.success_created'))
      }
      setModalVisible(false)
      loadOffers()
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_offers.err_save'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    Alert.alert(t('admin_offers.confirm_del_title'), t('admin_offers.confirm_del_msg'), [
      { text: t('admin_offers.cancel'), style: 'cancel' },
      {
        text: t('admin_offers.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminOffer(id)
            Alert.alert(t('schools.success_title', 'Succès'), t('admin_offers.success_deleted'))
            loadOffers()
          } catch (err) {
            Alert.alert(t('schools.err_title', 'Erreur'), t('admin_offers.err_delete'))
          }
        },
      },
    ])
  }

  function handleOptions(item) {
    Alert.alert(
      'Options',
      'Choisissez une action',
      [
        { text: t('admin_offers.students'), onPress: () => openEnrollmentsModal(item) },
        { text: t('admin_offers.edit'), onPress: () => openEditModal(item) },
        { text: t('admin_offers.delete'), style: 'destructive', onPress: () => handleDelete(item.id) },
        { text: t('admin_offers.cancel'), style: 'cancel' },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <View>
            <Text style={styles.title}>{t('admin_offers.title')}</Text>
            <Text style={styles.subtitle}>Gérez vos formations</Text>
          </View>
          <TouchableOpacity onPress={openCreateModal} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>+ {t('admin_offers.btn_add')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, Shadows.sm]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.offerName}>{item.name}</Text>
                <Text style={styles.offerDesc}>{item.description}</Text>
                <Text style={styles.offerMeta}>
                  Permis {item.permitType} • {item.hours} {t('admin_offers.hours')} • {formatPrice(item.price)}
                </Text>
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleOptions(item)} style={styles.editBtn}>
                  <Ionicons name="ellipsis-horizontal" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState message={t('admin_offers.empty')} icon={<Ionicons name="cube" size={48} color={themeColors.primary} />} />}
        />
      )}

      <Modal isVisible={modalVisible} onClose={() => setModalVisible(false)} title={editingOffer ? t('admin_offers.modal_title_edit') : t('admin_offers.modal_title_create')}>
        <ScrollView style={{ maxHeight: 400 }}>
          <Text style={styles.label}>{t('admin_offers.name_label')}</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder={t('admin_offers.name_placeholder')} />

          <Text style={styles.label}>{t('admin_offers.desc_label')}</Text>
          <TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 60 }]} placeholder={t('admin_offers.desc_placeholder')} multiline />

          <Text style={styles.label}>{t('admin_offers.price_label')}</Text>
          <TextInput value={price} onChangeText={setPrice} keyboardType="numeric" style={styles.input} placeholder={t('admin_offers.price_placeholder')} />

          <Text style={styles.label}>{t('admin_offers.hours_label')}</Text>
          <TextInput value={hours} onChangeText={setHours} keyboardType="numeric" style={styles.input} placeholder={t('admin_offers.hours_placeholder')} />

          
          <Text style={styles.label}>{t('admin_offers.monitors_label', 'Moniteurs assignés')}</Text>
          <View style={styles.selectWrapper}>
            {monitors.map(monitor => (
              <TouchableOpacity
                key={monitor.id}
                onPress={() => {
                  setSelectedMonitorIds(prev => prev.includes(monitor.id) ? prev.filter(id => id !== monitor.id) : [...prev, monitor.id])
                }}
                style={[
                  styles.selectOption,
                  selectedMonitorIds.includes(monitor.id) && styles.selectOptionActive
                ]}
              >
                <Text style={[styles.selectOptionText, selectedMonitorIds.includes(monitor.id) && styles.selectOptionTextActive]}>
                  {monitor.firstName} {monitor.lastName}
                </Text>
              </TouchableOpacity>
            ))}
            {monitors.length === 0 && <Text style={styles.emptyText}>{t('admin_offers.no_monitors', 'Aucun moniteur trouvé')}</Text>}
          </View>

          <Text style={styles.label}>{t('admin_offers.permit_label')}</Text>
          <TouchableOpacity 
            style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} 
            onPress={() => setShowPermitPicker(true)}
          >
            <Text style={{ color: permitType ? themeColors.textPrimary : themeColors.textMuted, fontSize: 15 }}>
              {permitType ? `${t('schools.permit')} ${permitType}` : t('admin_offers.permit_label')}
            </Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <Button onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }}>
            {saving ? t('admin_offers.btn_saving') : t('admin_offers.btn_save')}
          </Button>
        </ScrollView>
      </Modal>

      <Modal isVisible={enrollmentsModalVisible} onClose={() => setEnrollmentsModalVisible(false)} title={`${t('admin_offers.enrollments_modal_title')} ${viewingOfferName}`}>
        {loadingEnrollments ? (
          <ActivityIndicator size="large" color={themeColors.primary} style={{ marginVertical: 20 }} />
        ) : selectedOfferEnrollments.length === 0 ? (
          <EmptyState message={t('admin_offers.no_enrollment')} icon={<Ionicons name="school-outline" size={48} color={themeColors.primary} />} />
        ) : (
          <ScrollView style={{ maxHeight: 400 }}>
            {selectedOfferEnrollments.map((enrollment, index) => (
              <View key={index} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: themeColors.borderLight }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: themeColors.textPrimary }}>{enrollment.studentName}</Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 12, marginTop: 2 }}>{t('student_progress.sessions')} : {new Date(enrollment.enrolledAt).toLocaleDateString()}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={{ color: themeColors.textSecondary, fontSize: 13 }}>{t('admin_offers.hours')}: {enrollment.hoursConsumed} / {enrollment.hours}</Text>
                  <Text style={{ color: enrollment.status === 'ACTIVE' ? themeColors.success : themeColors.warning, fontWeight: 'bold', fontSize: 13 }}>
                    {enrollment.status}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </Modal>

      <Modal isVisible={showPermitPicker} onClose={() => setShowPermitPicker(false)} title="Sélectionner le type de permis">
        <ScrollView style={{ maxHeight: 400 }}>
          {PERMIT_CATEGORIES.map(cat => (
            <TouchableOpacity 
              key={cat.id} 
              onPress={() => { setPermitType(cat.id); setShowPermitPicker(false); }}
              style={{ 
                paddingVertical: 12, 
                borderBottomWidth: 1, 
                borderBottomColor: themeColors.borderLight,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: permitType === cat.id ? themeColors.primary : themeColors.textPrimary }}>Permis {cat.id}</Text>
                <Text style={{ fontSize: 13, color: themeColors.textSecondary, marginTop: 4 }}>{cat.label}</Text>
              </View>
              {permitType === cat.id && <Ionicons name="checkmark-circle" size={24} color={themeColors.primary} />}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Modal>
    </SafeAreaView>
  )
}

// =====================================================
// 3. INSTRUCTORS SCREEN
// =====================================================
export function AdminInstructorsScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const [monitors, setMonitors] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMonitor, setEditingMonitor] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form Fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadMonitors()
    }, [])
  )

  async function loadMonitors() {
    try {
      setLoading(true)
      const data = await getAdminMonitors()
      setMonitors(data)
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_load'))
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingMonitor(null)
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setLicenseNumber('')
    setPhoneNumber('')
    setStatus('ACTIVE')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setModalVisible(true)
  }

  function openEditModal(monitor) {
    setEditingMonitor(monitor)
    setFirstName(monitor.firstName)
    setLastName(monitor.lastName)
    setEmail(monitor.email || '')
    setPassword('') // Ne pas préremplir le mot de passe
    setLicenseNumber(monitor.licenseNumber || '')
    setPhoneNumber(monitor.phoneNumber || '')
    setStatus(monitor.status || 'ACTIVE')
    setModalVisible(true)
  }

  async function handleSave() {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_fill_fields'))
      return
    }
    try {
      setSaving(true)
      const monitorData = {
        firstName,
        lastName,
        email,
        licenseNumber,
        phoneNumber,
        status,
      }
      if (!editingMonitor) {
        if (!password) {
          Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_pwd_req'))
          return
        }
        if (password.length < 8) {
          Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_pwd_len'))
          return
        }
        if (password !== confirmPassword) {
          Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_pwd_match'))
          return
        }
        monitorData.password = password
      } else if (password) {
        if (password.length < 8) {
          Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_pwd_len'))
          return
        }
        if (password !== confirmPassword) {
          Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_pwd_match'))
          return
        }
        monitorData.password = password
      }

      if (editingMonitor) {
        await updateAdminMonitor(editingMonitor.id, monitorData)
        Alert.alert(t('schools.success_title', 'Succès'), t('admin_instructors.success_updated'))
      } else {
        await createAdminMonitor(monitorData)
        Alert.alert(t('schools.success_title', 'Succès'), t('admin_instructors.success_created'))
      }
      setModalVisible(false)
      loadMonitors()
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), err.message || t('admin_instructors.err_save'))
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleSuspend(monitor) {
    const newStatus = monitor.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'
    const actionText = newStatus === 'INACTIVE' ? t('admin_instructors.action_suspend') : t('admin_instructors.action_reactivate')
    Alert.alert(t('admin_instructors.confirm_suspend_title'), t('admin_instructors.confirm_suspend_msg', { action: actionText }), [
      { text: t('admin_instructors.cancel'), style: 'cancel' },
      {
        text: t('admin_instructors.yes'),
        onPress: async () => {
          try {
            await updateAdminMonitor(monitor.id, { status: newStatus })
            Alert.alert(t('schools.success_title', 'Succès'), t('admin_instructors.success_suspended', { status: newStatus === 'INACTIVE' ? t('admin_instructors.status_suspended_lower') : t('admin_instructors.status_reactivated_lower') }))
            loadMonitors()
          } catch (err) {
            Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_suspend', { action: actionText }))
          }
        },
      },
    ])
  }

  async function handleDelete(id) {
    Alert.alert(t('admin_instructors.confirm_del_title'), t('admin_instructors.confirm_del_msg'), [
      { text: t('admin_instructors.cancel'), style: 'cancel' },
      {
        text: t('admin_instructors.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminMonitor(id)
            Alert.alert(t('schools.success_title', 'Succès'), t('admin_instructors.success_deleted'))
            loadMonitors()
          } catch (err) {
            Alert.alert(t('schools.err_title', 'Erreur'), t('admin_instructors.err_delete'))
          }
        },
      },
    ])
  }

  function handleOptions(item) {
    const isSuspended = item.status === 'INACTIVE'
    Alert.alert(
      t('admin_instructors.options_title'),
      t('admin_instructors.options_msg'),
      [
        { text: isSuspended ? t('admin_instructors.reactivate') : t('admin_instructors.suspend'), onPress: () => handleToggleSuspend(item) },
        { text: t('admin_instructors.edit'), onPress: () => openEditModal(item) },
        { text: t('admin_instructors.delete'), style: 'destructive', onPress: () => handleDelete(item.id) },
        { text: t('admin_instructors.cancel'), style: 'cancel' },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          <View>
            <Text style={styles.title}>{t('admin_instructors.title')}</Text>
            <Text style={styles.subtitle}>{t('admin_instructors.subtitle')}</Text>
          </View>
          <TouchableOpacity onPress={openCreateModal} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>+ {t('admin_instructors.btn_add')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : (
        <FlatList
          data={monitors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, Shadows.sm, item.status === 'INACTIVE' && { opacity: 0.6 }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Text style={styles.offerName}>{item.firstName} {item.lastName}</Text>
                  <View style={{
                    marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
                    backgroundColor: item.status === 'INACTIVE' ? '#FEE2E2' : '#DCFCE7'
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: item.status === 'INACTIVE' ? '#DC2626' : '#16A34A' }}>
                      {item.status === 'INACTIVE' ? t('admin_instructors.suspended') : t('admin_instructors.active')}
                    </Text>
                  </View>
                </View>
                {item.email && <Text style={styles.offerDesc}>📧 {item.email}</Text>}
                {item.phoneNumber && <Text style={styles.offerDesc}>📞 {item.phoneNumber}</Text>}
                {item.licenseNumber && (
                  <Text style={styles.offerMeta}>Licence: {item.licenseNumber}</Text>
                )}
              </View>
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleOptions(item)} style={styles.editBtn}>
                  <Ionicons name="ellipsis-horizontal" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState message={t('admin_instructors.no_monitor')} icon={<Ionicons name="people-outline" size={48} color={themeColors.primary} />} />}
        />
      )}

      <Modal isVisible={modalVisible} onClose={() => setModalVisible(false)} title={editingMonitor ? t('admin_instructors.modal_title_edit') : t('admin_instructors.modal_title_create')}>
        <ScrollView style={{ maxHeight: 400 }}>
          <Text style={styles.label}>{t('admin_instructors.firstname_label')}</Text>
          <TextInput value={firstName} onChangeText={setFirstName} style={styles.input} placeholder={t('admin_instructors.firstname_placeholder')} />

          <Text style={styles.label}>{t('admin_instructors.lastname_label')}</Text>
          <TextInput value={lastName} onChangeText={setLastName} style={styles.input} placeholder={t('admin_instructors.lastname_placeholder')} />

          <Text style={styles.label}>{t('admin_instructors.email_label')}</Text>
          <TextInput value={email} onChangeText={setEmail} keyboardType="email-address" style={styles.input} placeholder={t('admin_instructors.email_placeholder')} autoCapitalize="none" />

          <Text style={styles.label}>
            {t('admin_instructors.pwd_label')} {!editingMonitor ? '* (8 caractères min)' : '(Optionnel, 8 caractères min)'}
          </Text>
          <View style={styles.inputContainer}>
            <TextInput value={password} onChangeText={setPassword} style={styles.inputField} placeholder={t('admin_instructors.pwd_placeholder')} secureTextEntry={!showPassword} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>
            {t('admin_instructors.confirm_pwd_label')} {!editingMonitor ? '*' : ''}
          </Text>
          <View style={styles.inputContainer}>
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword} style={styles.inputField} placeholder={t('admin_instructors.confirm_pwd_placeholder')} secureTextEntry={!showConfirmPassword} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
              <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t('admin_instructors.license_label')}</Text>
          <TextInput value={licenseNumber} onChangeText={setLicenseNumber} style={styles.input} placeholder={t('admin_instructors.license_placeholder')} />

          <Text style={styles.label}>{t('admin_instructors.phone_label')}</Text>
          <TextInput value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" style={styles.input} placeholder={t('admin_instructors.phone_placeholder')} />

          {editingMonitor && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md }}>
              <Text style={[styles.label, { marginBottom: 0, marginRight: Spacing.md }]}>{t('admin_instructors.status_label')} :</Text>
              <TouchableOpacity 
                onPress={() => setStatus(status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                style={{ 
                  backgroundColor: status === 'ACTIVE' ? '#DCFCE7' : '#FEE2E2', 
                  paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm, borderWidth: 1, 
                  borderColor: status === 'ACTIVE' ? '#16A34A' : '#DC2626'
                }}
              >
                <Text style={{ color: status === 'ACTIVE' ? '#16A34A' : '#DC2626', fontWeight: 'bold' }}>
                  {status === 'ACTIVE' ? t('admin_instructors.active') : t('admin_instructors.suspended')}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <Button onPress={handleSave} loading={saving} style={{ marginTop: Spacing.md }}>
            {saving ? t('admin_instructors.btn_saving') : t('admin_instructors.btn_save')}
          </Button>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  )
}

// =====================================================
// 4. PLANNING / SESSION BOOKING SCREEN
// =====================================================
export function AdminPlanningScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Options states
  const [monitors, setMonitors] = useState([])
  const [modules, setModules] = useState([])
  const [availableOffers, setAvailableOffers] = useState([])
  const [vehicles, setVehicles] = useState([])
  

  // Selection states
  const [selectedDate, setSelectedDate] = useState('')
  const [dateObj, setDateObj] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  const [chosenOfferIds, setChosenOfferIds] = useState([])
  const [selectedMonitorIds, setSelectedMonitorIds] = useState([])
  const [selectedVehicleId, setSelectedVehicleId] = useState('')
  const [selectedModuleId, setSelectedModuleId] = useState('')

  const [showOfferDropdown, setShowOfferDropdown] = useState(false)
  const [showMonitorDropdown, setShowMonitorDropdown] = useState(false)
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false)
  const [showModuleDropdown, setShowModuleDropdown] = useState(false)

  const [startTime, setStartTime] = useState('09:00')
  const [startTimeObj, setStartTimeObj] = useState(new Date(new Date().setHours(9, 0, 0, 0)))
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)

  const [endTime, setEndTime] = useState('11:00')
  const [endTimeObj, setEndTimeObj] = useState(new Date(new Date().setHours(11, 0, 0, 0)))
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)

  const [meetingPoint, setMeetingPoint] = useState('')

  useFocusEffect(
    useCallback(() => {
      loadPreRequisites()
    }, [])
  )

  const onDateChange = (event, selectedDateVal) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDateVal) {
      setDateObj(selectedDateVal)
      const yyyy = selectedDateVal.getFullYear()
      const mm = String(selectedDateVal.getMonth() + 1).padStart(2, '0')
      const dd = String(selectedDateVal.getDate()).padStart(2, '0')
      setSelectedDate(`${yyyy}-${mm}-${dd}`)
    }
  }

  const onStartTimeChange = (event, selectedTimeVal) => {
    setShowStartTimePicker(Platform.OS === 'ios')
    if (selectedTimeVal) {
      setStartTimeObj(selectedTimeVal)
      const hours = selectedTimeVal.getHours().toString().padStart(2, '0')
      const mins = selectedTimeVal.getMinutes().toString().padStart(2, '0')
      setStartTime(`${hours}:${mins}`)
    }
  }

  const onEndTimeChange = (event, selectedTimeVal) => {
    setShowEndTimePicker(Platform.OS === 'ios')
    if (selectedTimeVal) {
      setEndTimeObj(selectedTimeVal)
      const hours = selectedTimeVal.getHours().toString().padStart(2, '0')
      const mins = selectedTimeVal.getMinutes().toString().padStart(2, '0')
      setEndTime(`${hours}:${mins}`)
    }
  }

  async function loadPreRequisites() {
    try {
      setLoading(true)
      const results = await Promise.allSettled([
        getAdminMonitors(),
        getAdminModules(),
        getAdminOffers(),
        getAdminVehicles(),
      ])

      const [monitorsRes, modulesRes, offersRes, vehiclesRes] = results

      if (monitorsRes.status === 'fulfilled' && Array.isArray(monitorsRes.value)) {
        setMonitors(monitorsRes.value)
      }
      if (modulesRes.status === 'fulfilled' && Array.isArray(modulesRes.value)) {
        setModules(modulesRes.value)
      }
      if (offersRes.status === 'fulfilled' && Array.isArray(offersRes.value)) {
        setAvailableOffers(offersRes.value)
      }
      if (vehiclesRes.status === 'fulfilled' && Array.isArray(vehiclesRes.value)) {
        setVehicles(vehiclesRes.value.filter(v => v?.isActive))
      }

      const allFailed = results.every(r => r.status === 'rejected')
      if (allFailed) {
        console.error('Failed to load all prerequisites:', results.map(r => r.reason))
        Alert.alert(t('schools.err_title', 'Erreur'), t('admin_planning.err_load'))
      }
    } catch (err) {
      console.error('Error loading planning prerequisites:', err)
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_planning.err_load'))
    } finally {
      setLoading(false)
    }
  }

  // Removed loadOffersForDate effect since we load all offers at startup

  // Effect to load available enrollments when offer or date changes
  



  

  async function handleBookSession() {
    if (!selectedDate || chosenOfferIds.length === 0 || selectedMonitorIds.length === 0) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_planning.err_fill_fields'))
      return
    }

    try {
      setSaving(true)
      const payload = {
        offerIds: chosenOfferIds,
        monitorIds: selectedMonitorIds,
        vehicleId: selectedVehicleId || null,
        moduleId: selectedModuleId || null,
        date: selectedDate,
        startTime,
        endTime,
        meetingPoint,
      }

      await scheduleAdminSession(payload)
      Alert.alert(t('schools.success_title', 'Succès'), t('admin_planning.success_booked'))
      
      // Reset form
      setSelectedDate('')
      setChosenOfferIds([])
      setSelectedMonitorIds([])
      setSelectedVehicleId('')
      setSelectedModuleId('')
      setMeetingPoint('')
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_planning.err_book'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('admin_planning.title')}</Text>
        <Text style={styles.subtitle}>{t('admin_planning.subtitle')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator color={themeColors.primary} />
        ) : (
          <View style={styles.formContainer}>
            <Text style={styles.label}>{t('admin_planning.date_label')}</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, { justifyContent: 'center' }]}
            >
              <Text style={{ color: selectedDate ? themeColors.textPrimary : themeColors.textMuted }}>
                {selectedDate ? `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}` : t('admin_planning.date_placeholder')}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={dateObj}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}

            <Text style={styles.label}>{t('admin_planning.offer_label')}</Text>
            <TouchableOpacity onPress={() => setShowOfferDropdown(true)} style={[styles.input, { justifyContent: 'center', height: 44 }]}>
              <Text style={{ color: chosenOfferIds.length > 0 ? themeColors.textPrimary : themeColors.textMuted }}>
                {chosenOfferIds.length > 0 ? `${chosenOfferIds.length} offre(s) sélectionnée(s)` : t('admin_planning.no_offer')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>{t('admin_planning.monitor_label')}</Text>
            <TouchableOpacity onPress={() => setShowMonitorDropdown(true)} style={[styles.input, { justifyContent: 'center', height: 44 }]}>
              <Text style={{ color: selectedMonitorIds.length > 0 ? themeColors.textPrimary : themeColors.textMuted }}>
                {selectedMonitorIds.length > 0 ? `${selectedMonitorIds.length} moniteur(s) sélectionné(s)` : 'Sélectionner...'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Véhicule (Optionnel)</Text>
            <TouchableOpacity onPress={() => setShowVehicleDropdown(true)} style={[styles.input, { justifyContent: 'center', height: 44 }]}>
              <Text style={{ color: selectedVehicleId ? themeColors.textPrimary : themeColors.textMuted }}>
                {selectedVehicleId ? vehicles.find(v => v.id === selectedVehicleId)?.name : 'Sélectionner...'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.label}>Module Pédagogique (Optionnel)</Text>
            <TouchableOpacity onPress={() => setShowModuleDropdown(true)} style={[styles.input, { justifyContent: 'center', height: 44 }]}>
              <Text style={{ color: selectedModuleId ? themeColors.textPrimary : themeColors.textMuted }}>
                {selectedModuleId ? modules.find(m => m.id === selectedModuleId)?.name : 'Sélectionner...'}
              </Text>
            </TouchableOpacity>



            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('admin_planning.start_time_label')}</Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  style={styles.input}
                  placeholder="09:00"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{t('admin_planning.end_time_label')}</Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  style={styles.input}
                  placeholder="11:00"
                />
              </View>
            </View>



            <Text style={styles.label}>{t('admin_planning.meeting_point_label')}</Text>
            <TextInput
              value={meetingPoint}
              onChangeText={setMeetingPoint}
              style={styles.input}
              placeholder={t('admin_planning.meeting_point_placeholder')}
            />

            <Button
              onPress={handleBookSession}
              loading={saving}
              style={{ marginTop: Spacing.md, marginBottom: Spacing.xxl }}
            >
              {saving ? t('admin_planning.btn_booking') : t('admin_planning.btn_book')}
            </Button>
          </View>
        )}
      </ScrollView>

      {/* Offers Dropdown Modal */}
      <Modal isVisible={showOfferDropdown} onClose={() => setShowOfferDropdown(false)} title={t('admin_planning.offer_label')}>
        <ScrollView style={{ maxHeight: 300 }}>
          <View style={styles.selectWrapper}>
            {availableOffers.map((offer) => (
              <TouchableOpacity
                key={offer.id}
                onPress={() => setChosenOfferIds(prev => prev.includes(offer.id) ? prev.filter(id => id !== offer.id) : [...prev, offer.id])}
                style={[
                  styles.selectOption,
                  chosenOfferIds.includes(offer.id) && styles.selectOptionActive,
                  { width: '100%', marginBottom: 8 }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={chosenOfferIds.includes(offer.id) ? 'checkbox' : 'square-outline'} size={20} color={chosenOfferIds.includes(offer.id) ? themeColors.textOnPrimary : themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectOptionText, chosenOfferIds.includes(offer.id) && styles.selectOptionTextActive, { flex: 1, flexWrap: 'wrap' }]}>
                    {offer.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {availableOffers.length === 0 && (
              <Text style={styles.emptyText}>{t('admin_planning.no_offer')}</Text>
            )}
          </View>
        </ScrollView>
      </Modal>

      {/* Monitors Dropdown Modal */}
      <Modal isVisible={showMonitorDropdown} onClose={() => setShowMonitorDropdown(false)} title={t('admin_planning.monitor_label')}>
        <ScrollView style={{ maxHeight: 300 }}>
          <View style={styles.selectWrapper}>
            {monitors.map((mon) => (
              <TouchableOpacity
                key={mon.id}
                onPress={() => setSelectedMonitorIds(prev => prev.includes(mon.id) ? prev.filter(id => id !== mon.id) : [...prev, mon.id])}
                style={[
                  styles.selectOption,
                  selectedMonitorIds.includes(mon.id) && styles.selectOptionActive,
                  { width: '100%', marginBottom: 8 }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={selectedMonitorIds.includes(mon.id) ? 'checkbox' : 'square-outline'} size={20} color={selectedMonitorIds.includes(mon.id) ? themeColors.textOnPrimary : themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectOptionText, selectedMonitorIds.includes(mon.id) && styles.selectOptionTextActive, { flex: 1, flexWrap: 'wrap' }]}>
                    {mon.firstName} {mon.lastName}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {monitors.length === 0 && (
              <Text style={styles.emptyText}>Aucun moniteur disponible</Text>
            )}
          </View>
        </ScrollView>
      </Modal>

      {/* Vehicles Dropdown Modal */}
      <Modal isVisible={showVehicleDropdown} onClose={() => setShowVehicleDropdown(false)} title="Véhicule (Optionnel)">
        <ScrollView style={{ maxHeight: 300 }}>
          <View style={styles.selectWrapper}>
            {vehicles.map((veh) => (
              <TouchableOpacity
                key={veh.id}
                onPress={() => setSelectedVehicleId(prev => prev === veh.id ? '' : veh.id)}
                style={[
                  styles.selectOption,
                  selectedVehicleId === veh.id && styles.selectOptionActive,
                  { width: '100%', marginBottom: 8 }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={selectedVehicleId === veh.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedVehicleId === veh.id ? themeColors.textOnPrimary : themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectOptionText, selectedVehicleId === veh.id && styles.selectOptionTextActive, { flex: 1, flexWrap: 'wrap' }]}>
                    {veh.name} {veh.plateNumber ? `(${veh.plateNumber})` : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {vehicles.length === 0 && (
              <Text style={styles.emptyText}>Aucun véhicule actif disponible.</Text>
            )}
          </View>
        </ScrollView>
      </Modal>

      {/* Modules Dropdown Modal */}
      <Modal isVisible={showModuleDropdown} onClose={() => setShowModuleDropdown(false)} title="Module Pédagogique (Optionnel)">
        <ScrollView style={{ maxHeight: 300 }}>
          <View style={styles.selectWrapper}>
            {modules.map((mod) => (
              <TouchableOpacity
                key={mod.id}
                onPress={() => setSelectedModuleId(prev => prev === mod.id ? '' : mod.id)}
                style={[
                  styles.selectOption,
                  selectedModuleId === mod.id && styles.selectOptionActive,
                  { width: '100%', marginBottom: 8 }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={selectedModuleId === mod.id ? 'radio-button-on' : 'radio-button-off'} size={20} color={selectedModuleId === mod.id ? themeColors.textOnPrimary : themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectOptionText, selectedModuleId === mod.id && styles.selectOptionTextActive, { flex: 1, flexWrap: 'wrap' }]}>
                    {mod.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {modules.length === 0 && (
              <Text style={styles.emptyText}>Aucun module disponible.</Text>
            )}
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  )
}

// =====================================================
// 5. PROFILE SCREEN
// =====================================================
export function AdminProfileScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const navigation = useNavigation()
  const { user, logout, refreshUser } = useAuth()
  const { openMenu } = useSideMenu()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const { isDarkMode, toggleTheme } = useTheme()
  const { t, i18n } = useTranslation()

  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [avatarModalVisible, setAvatarModalVisible] = useState(false)

  const handleAvatarOptions = () => {
    Alert.alert(
      t('admin_profile.change_avatar', 'Changer la photo de profil'),
      t('admin_profile.choose_source', 'Veuillez choisir la source'),
      [
        {
          text: t('admin_profile.camera', 'Prendre une photo'),
          onPress: takePhoto,
        },
        {
          text: t('admin_profile.gallery', 'Choisir dans la galerie'),
          onPress: pickImage,
        },
        {
          text: t('common.cancel', 'Annuler'),
          style: 'cancel',
        },
      ]
    );
  };

  const processImageUpload = async (result) => {
    if (!result.canceled) {
      setUploadingAvatar(true)
      try {
        const uploadRes = await uploadImage(result.assets[0].uri);
        if (uploadRes.fileUrl) {
          await updateProfile({ avatarUrl: uploadRes.fileUrl });
          await refreshUser();
          setAvatarModalVisible(false);
        }
      } catch (e) {
        Alert.alert(t('schools.err_title', 'Erreur'), t('admin_profile.err_upload_avatar'));
      } finally {
        setUploadingAvatar(false)
      }
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    processImageUpload(result);
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('schools.err_title', 'Erreur'), "L'accès à la caméra est requis.");
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    processImageUpload(result);
  };

  // School form
  const [sName, setSName] = useState('')
  const [sDesc, setSDesc] = useState('')
  const [sAddress, setSAddress] = useState('')
  const [sCity, setSCity] = useState('')
  const [sRegion, setSRegion] = useState('')
  const [sPhone, setSPhone] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sWebsite, setSWebsite] = useState('')
  const [sImageUrl, setSImageUrl] = useState('')
  const [uploadingSchoolLogo, setUploadingSchoolLogo] = useState(false)

  const pickSchoolLogo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploadingSchoolLogo(true)
      try {
        const uploadRes = await uploadImage(result.assets[0].uri);
        if (uploadRes.fileUrl) {
          setSImageUrl(uploadRes.fileUrl);
        }
      } catch (e) {
        Alert.alert(t('schools.err_title', 'Erreur'), t('admin_profile.err_upload_logo'));
      } finally {
        setUploadingSchoolLogo(false)
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'SCHOOL_ADMIN') {
        loadSchoolProfile()
      }
    }, [user?.role])
  )

  async function loadSchoolProfile() {
    try {
      setLoading(true)
      const res = await getAdminSchoolProfile()
      const data = res || {}
      setSName(data.name || '')
      setSDesc(data.description || '')
      setSAddress(data.address || '')
      setSCity(data.city || '')
      setSRegion(data.region || '')
      setSPhone(data.phone || '')
      setSEmail(data.email || '')
      setSWebsite(data.website || '')
      setSImageUrl(data.imageUrl || '')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveSchool() {
    try {
      setSaving(true)
      await updateAdminSchoolProfile({
        name: sName,
        description: sDesc,
        address: sAddress,
        city: sCity,
        region: sRegion,
        phone: sPhone,
        email: sEmail,
        website: sWebsite,
        imageUrl: sImageUrl,
      })
      Alert.alert(t('schools.success_title', 'Succès'), t('admin_profile.success_updated'))
      setModalVisible(false)
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), t('admin_profile.err_update'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openMenu} style={{ marginRight: Spacing.md }}>
            <Ionicons name="menu" size={32} color={themeColors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('navigation.profile', 'Mon Profil')}</Text>
        </View>
        <TouchableOpacity onPress={() => setAvatarModalVisible(true)} disabled={uploadingAvatar} style={{ alignSelf: 'center', marginTop: 16 }}>
          <View style={styles.avatarCircle}>
            {uploadingAvatar ? (
              <ActivityIndicator color={themeColors.dark} />
            ) : user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: 72, height: 72, borderRadius: 36 }} />
            ) : (
              <Text style={styles.avatarText}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.title}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
        <View style={[styles.chip, styles.chipActive, { marginTop: 8 }]}>
          <Text style={styles.chipTextActive}>{user?.role}</Text>
        </View>
      </View>
      
      <View style={{ padding: Spacing.lg }}>
        {user?.role === 'SCHOOL_ADMIN' && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.actionBtn, { width: '100%', marginBottom: 16, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.primary, flexDirection: 'row', justifyContent: 'center' }]}>
            <Ionicons name="pencil" size={16} color={themeColors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.actionBtnText, { color: themeColors.primary }]}>{t('admin_profile.btn_edit_info')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { flexDirection: 'row', justifyContent: 'center' }]}>
          <Ionicons name="log-out" size={20} color={themeColors.error} style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>{t('admin_profile.btn_logout')}</Text>
        </TouchableOpacity>
      </View>

      <Modal isVisible={avatarModalVisible} onClose={() => setAvatarModalVisible(false)} title={t('admin_profile.avatar_title', 'Photo de profil')}>
        <View style={{ alignItems: 'center', paddingVertical: Spacing.xl }}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={{ width: 200, height: 200, borderRadius: 100, marginBottom: 20 }} />
          ) : (
            <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: themeColors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 64, color: themeColors.textOnPrimary }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={handleAvatarOptions} style={[styles.actionBtn, { flexDirection: 'row', alignItems: 'center' }]}>
            <Ionicons name="camera" size={20} color={themeColors.textOnPrimary} style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>{t('admin_profile.change_avatar', 'Changer la photo de profil')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal isVisible={modalVisible} onClose={() => setModalVisible(false)} title={t('admin_profile.modal_title_edit')}>
        <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ paddingBottom: 40 }}>
          {loading ? (
            <ActivityIndicator color={themeColors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <TouchableOpacity onPress={pickSchoolLogo} disabled={uploadingSchoolLogo}>
                  <View style={[styles.avatarCircle, { width: 100, height: 100, borderRadius: 50, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }]}>
                    {uploadingSchoolLogo ? (
                      <ActivityIndicator color={themeColors.primary} />
                    ) : sImageUrl ? (
                      <Image source={{ uri: sImageUrl }} style={{ width: 100, height: 100, borderRadius: 50 }} />
                    ) : (
                    <Ionicons name="business-outline" size={40} color={themeColors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
                <Text style={[styles.label, { marginTop: 8 }]}>{t('admin_profile.logo_label')}</Text>
              </View>

              <Text style={styles.label}>{t('admin_profile.school_name_label')}</Text>
              <TextInput value={sName} onChangeText={setSName} style={styles.input} />

              <Text style={styles.label}>{t('admin_profile.desc_label')}</Text>
              <TextInput value={sDesc} onChangeText={setSDesc} style={[styles.input, { height: 80 }]} multiline />

              <Text style={styles.label}>{t('admin_profile.phone_label')}</Text>
              <TextInput value={sPhone} onChangeText={setSPhone} style={styles.input} keyboardType="phone-pad" />

              <Text style={styles.label}>{t('admin_profile.email_label')}</Text>
              <TextInput value={sEmail} onChangeText={setSEmail} style={styles.input} keyboardType="email-address" />

              <Text style={styles.label}>{t('admin_profile.address_label')}</Text>
              <TextInput value={sAddress} onChangeText={setSAddress} style={styles.input} />

              <Text style={styles.label}>{t('admin_profile.city_label')}</Text>
              <TextInput value={sCity} onChangeText={setSCity} style={styles.input} />

              <Text style={styles.label}>{t('admin_profile.region_label')}</Text>
              <TextInput value={sRegion} onChangeText={setSRegion} style={styles.input} />

              <Text style={styles.label}>{t('admin_profile.website_label')}</Text>
              <TextInput value={sWebsite} onChangeText={setSWebsite} style={styles.input} keyboardType="url" />

              <TouchableOpacity onPress={handleSaveSchool} style={[styles.actionBtn, { width: '100%', marginTop: 20, opacity: saving ? 0.7 : 1 }]} disabled={saving}>
                <Text style={styles.actionBtnText}>{saving ? t('admin_profile.btn_saving') : t('admin_profile.btn_save')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Modal>
    </SafeAreaView>
  )
}

// =====================================================
// STYLES
// =====================================================
function getStyles(themeColors) { return StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: '#F9FAFB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  menuButton: {
    padding: 4,
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFF',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  greetingContainer: {
    marginBottom: Spacing.xs,
  },
  greetingText: {
    fontSize: 16,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  userRole: {
    fontSize: 14,
    color: themeColors.textMuted,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  title: { ...Typography.h2, color: themeColors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: '#9CA3AF' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.md },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: Spacing.md },
  statCard: { flex: 1, minWidth: '44%', backgroundColor: themeColors.surface, borderRadius: Radius.lg, padding: Spacing.md, alignItems: 'center' },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  statLabel: { fontSize: 11, color: themeColors.textSecondary, textAlign: 'center' },
  warningBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FCD34D',
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  warningText: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 2,
  },
  overviewCard: {
    backgroundColor: '#0F172A',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  dateBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  revenueBanner: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  revenueHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  revenueIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  revenueLabel: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  revenueValue: {
    color: '#10B981',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  tile: {
    width: '31%',
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
    shadowOpacity: 0.05,
  },
  tileIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  tileTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: themeColors.textPrimary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
    marginBottom: Spacing.xl,
  },
  uploadActionBtn: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
  },
  uploadActionBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  docIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: themeColors.textPrimary,
  },
  docDate: {
    fontSize: 12,
    color: themeColors.textMuted,
    marginTop: 2,
  },
  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
    marginBottom: Spacing.md,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: themeColors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  sessionSub: {
    fontSize: 12,
    color: themeColors.textMuted,
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  activityItemCard: {
    backgroundColor: '#FFF',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.borderLight,
  },
  activityDotBg: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4F46E5',
    marginRight: 12,
  },
  activityCard: { backgroundColor: themeColors.surface, padding: 12, borderRadius: Radius.md, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10 },
  activityDot: { fontSize: 10 },
  activityMsg: { ...Typography.body, color: themeColors.textPrimary, fontSize: 13, fontWeight: '500' },
  activityTime: { ...Typography.caption, color: themeColors.textMuted, marginTop: 2 },
  emptyCard: {
    backgroundColor: '#FFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.borderLight,
    marginBottom: Spacing.md,
  },
  emptyCardText: {
    color: themeColors.textSecondary,
    fontStyle: 'italic',
  },
  list: { padding: Spacing.md },
  card: { backgroundColor: themeColors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  offerName: { ...Typography.bodyMedium, color: themeColors.textPrimary, fontWeight: '700' },
  offerDesc: { ...Typography.small, color: themeColors.textSecondary, marginTop: 2 },
  offerMeta: { ...Typography.caption, color: themeColors.primary, fontWeight: '600', marginTop: 4 },
  rowActions: { flexDirection: 'row', gap: 8 },
  editBtn: { padding: 6, backgroundColor: themeColors.borderLight, borderRadius: Radius.sm },
  editBtnText: { fontSize: 14 },
  deleteBtn: { padding: 6, backgroundColor: themeColors.errorLight, borderRadius: Radius.sm },
  deleteBtnText: { fontSize: 14 },
  actionBtn: { alignSelf: 'center', backgroundColor: themeColors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full },
  actionBtnText: { color: themeColors.textOnPrimary, fontWeight: '700', fontSize: 13 },
  label: { ...Typography.smallMedium, color: themeColors.textPrimary, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: Radius.sm, padding: 10, backgroundColor: themeColors.surface, fontSize: 14, color: themeColors.textPrimary },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border, borderRadius: Radius.sm, paddingHorizontal: 10 },
  inputField: { flex: 1, paddingVertical: 10, fontSize: 14, color: themeColors.textPrimary },
  eyeButton: { paddingLeft: 10, justifyContent: 'center', alignItems: 'center' },
  selectWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 },
  selectOption: { borderWidth: 1, borderColor: themeColors.border, padding: 8, borderRadius: Radius.sm, backgroundColor: themeColors.surface },
  selectOptionActive: { borderColor: themeColors.primary, backgroundColor: themeColors.primaryLight },
  selectOptionText: { fontSize: 12, color: themeColors.textSecondary },
  selectOptionTextActive: { color: themeColors.textOnPrimary, fontWeight: '700' },
  formContainer: { backgroundColor: themeColors.surface, padding: Spacing.md, borderRadius: Radius.md, ...Shadows.sm },
  emptyText: { fontSize: 12, color: themeColors.textMuted, fontStyle: 'italic', marginVertical: 4 },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: '800', color: themeColors.dark },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border },
  chipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
  chipTextActive: { color: themeColors.textOnPrimary, fontWeight: '700' },
  logoutBtn: { padding: 16, borderRadius: Radius.md, backgroundColor: themeColors.errorLight, alignItems: 'center' },
  logoutText: { color: themeColors.error, fontWeight: '700', fontSize: 15 },
}) }
