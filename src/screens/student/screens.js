// src/screens/student/PlanningScreen.js
import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Image, Alert, Switch, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { getStudentSessions, getSessionDocuments, uploadImage } from '../../services/services'
import { updateProfile } from '../../services/auth.service'
import * as ImagePicker from 'expo-image-picker'
import { Badge, Modal } from '../../components/ui/index'
import { EmptyState } from '../../components/ui/index'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { formatDate, formatTime } from '../../utils/formatters'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { useNavigation } from '@react-navigation/native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import SessionLocationModal from '../../components/session/SessionLocationModal'



function StudentPlanningScreen() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [selectedSessionDocs, setSelectedSessionDocs] = useState(null)
  const [docsLoading, setDocsLoading] = useState(false)
  const [documents, setDocuments] = useState([])

  const [trackingSession, setTrackingSession] = useState(null)

  const FILTERS = [

    { key: 'ALL', label: t('student_planning.filter_all') },
    { key: 'UPCOMING', label: t('student_planning.filter_upcoming') },
    { key: 'PAST', label: t('student_planning.filter_past') },
  ]

  useEffect(() => {
    getStudentSessions(user?.id).then(setSessions).finally(() => setLoading(false))
  }, [])

  async function handleViewDocuments(session) {
    setSelectedSessionDocs(session)
    setDocsLoading(true)
    try {
      const docs = await getSessionDocuments(session.sessionId || session.id)
      setDocuments(docs)
    } catch (e) {
      console.log('Error fetching docs', e)
      setDocuments([])
    } finally {
      setDocsLoading(false)
    }
  }

  const now = new Date()
  const filtered = sessions.filter((s) => {
    const sessionDate = new Date(`${s.date}T${s.startTime || '00:00:00'}`)
    if (filter === 'UPCOMING') return sessionDate >= now
    if (filter === 'PAST') return sessionDate < now
    return true
  })

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('student_planning.title')}</Text>
        <Text style={styles.subtitle}>{t('student_planning.subtitle')}</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.chip, filter === f.key && styles.chipActive]}>
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : filtered.length === 0 ? (
        <EmptyState message={t('student_planning.no_session')} icon={<Ionicons name="calendar-outline" size={48} color={themeColors.textSecondary} />} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s, idx) => String(s.sessionId || s.id || idx)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Text style={styles.time}>{item.startTime ? item.startTime.substring(0, 5) : '—'} - {item.endTime ? item.endTime.substring(0, 5) : '—'}</Text>
                <Text style={styles.school} numberOfLines={1}>{item.schoolName}</Text>
                <Text style={styles.offer} numberOfLines={1}>{item.offerName}</Text>
                {item.meetingPoint && <Text style={styles.meeting}><Ionicons name="location-outline" size={14} color={themeColors.textMuted} /> {item.meetingPoint}</Text>}
                
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity onPress={() => handleViewDocuments(item)} style={styles.docsBtn}>
                    <Text style={styles.docsBtnText}>{t('student_planning.view_docs')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setTrackingSession(item)} style={[styles.docsBtn, { backgroundColor: themeColors.primary }]}>
                    <Ionicons name="location-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={[styles.docsBtnText, { color: '#FFF' }]}>Lieu du RDV</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Badge status={item.status} />
            </View>
          )}
        />
      )}
      {/* Modal for Documents */}
      <Modal
        isVisible={!!selectedSessionDocs}
        onClose={() => setSelectedSessionDocs(null)}
        title={t('student_planning.docs_title')}
      >
        {docsLoading ? (
          <ActivityIndicator color={themeColors.primary} />
        ) : documents.length === 0 ? (
          <Text style={{ textAlign: 'center', marginVertical: 20, color: themeColors.textSecondary }}>{t('student_planning.no_docs')}</Text>
        ) : (
          <View>
            {documents.map((doc, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.docItem}
                onPress={() => Linking.openURL(doc.fileUrl)}
              >
                <Text style={styles.docName}><Ionicons name="document-text-outline" size={16} color={themeColors.textPrimary} /> {doc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Modal>

      <SessionLocationModal
        visible={!!trackingSession}
        onClose={() => setTrackingSession(null)}
        session={trackingSession}
      />
    </SafeAreaView>
  )
}


// =====================================================
// src/screens/student/BookingsScreen.js
// =====================================================
import { getStudentEnrollments } from '../../services/services'
import { formatPrice } from '../../utils/formatters'

export function StudentBookingsScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudentEnrollments(user?.id).then(setEnrollments).finally(() => setLoading(false))
  }, [])

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('student_bookings.title')}</Text>
        <Text style={styles.subtitle}>{t('student_bookings.subtitle')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : enrollments.length === 0 ? (
        <EmptyState message={t('student_bookings.no_booking')} icon={<Ionicons name="clipboard-outline" size={48} color={themeColors.textSecondary} />} />
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.date}>{item.schoolName}</Text>
                <Text style={styles.offer}>{item.offerName}</Text>
              </View>
              <Badge status={item.status} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  )
}

// =====================================================
// src/screens/student/ProgressScreen.js
// =====================================================
export { default as StudentProgressScreen } from './ProgressScreen';


// =====================================================
// src/screens/student/ProfileScreen.js & instructor/ProfileScreen.js
// =====================================================
export function ProfileScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user, logout, refreshUser } = useAuth()
  const navigation = useNavigation()
  const { openMenu } = useSideMenu()
  const [uploading, setUploading] = useState(false)

  const [avatarModalVisible, setAvatarModalVisible] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  })

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
      })
    }
  }, [user, isEditing])

  const handleSaveProfile = async () => {
    setUpdating(true)
    try {
      await updateProfile(formData)
      await refreshUser()
      setIsEditing(false)
      Alert.alert(t('common.success', 'Succès'), t('profile.updated_successfully', 'Profil mis à jour avec succès'))
    } catch (e) {
      Alert.alert('Erreur', e.message || 'Impossible de mettre à jour le profil')
    } finally {
      setUpdating(false)
    }
  }

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
      setUploading(true)
      try {
        const uploadRes = await uploadImage(result.assets[0].uri);
        if (uploadRes.fileUrl) {
          await updateProfile({ avatarUrl: uploadRes.fileUrl });
          await refreshUser();
          setAvatarModalVisible(false);
        }
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil');
      } finally {
        setUploading(false)
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
      Alert.alert('Erreur', "L'accès à la caméra est requis.");
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={openMenu} style={{ marginRight: Spacing.md }}>
              <Ionicons name="menu" size={32} color={themeColors.textWhite} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('navigation.profile', 'Mon Profil')}</Text>
          </View>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={{ padding: 8 }}>
            <Ionicons name={isEditing ? "close" : "pencil"} size={24} color={themeColors.textWhite} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setAvatarModalVisible(true)} disabled={uploading} style={{ alignSelf: 'center', marginTop: 16 }}>
          <View style={styles.avatarCircle}>
            {uploading ? (
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
        
        {!isEditing && (
          <View>
            <Text style={styles.title}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.subtitle}>{user?.email}</Text>
            <View style={[styles.chip, styles.chipActive, { marginTop: 8, alignSelf: 'flex-start' }]}>
              <Text style={styles.chipTextActive}>{user?.role}</Text>
            </View>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.lg, flexGrow: 1 }}>
        {isEditing ? (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.formContainer}>
              <Text style={styles.label}>{t('profile.first_name', 'Prénom')}</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(t) => setFormData({ ...formData, firstName: t })}
                placeholderTextColor={themeColors.textMuted}
              />
              
              <Text style={styles.label}>{t('profile.last_name', 'Nom')}</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(t) => setFormData({ ...formData, lastName: t })}
                placeholderTextColor={themeColors.textMuted}
              />

              <Text style={styles.label}>{t('profile.email', 'Email')}</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(t) => setFormData({ ...formData, email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={themeColors.textMuted}
              />

              <TouchableOpacity onPress={handleSaveProfile} disabled={updating} style={styles.saveBtn}>
                {updating ? <ActivityIndicator color={themeColors.textOnPrimary} /> : <Text style={styles.saveBtnText}>{t('common.save', 'Enregistrer')}</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        ) : (
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>{t('profile.logout')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

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
          <TouchableOpacity onPress={handleAvatarOptions} style={{ backgroundColor: themeColors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="camera" size={20} color={themeColors.textOnPrimary} style={{ marginRight: 8 }} />
            <Text style={{ color: themeColors.textOnPrimary, fontWeight: '600', fontSize: 13 }}>{t('admin_profile.change_avatar', 'Changer la photo de profil')}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  header: { backgroundColor: themeColors.dark, padding: Spacing.lg, paddingBottom: 28, position: 'relative' },
  settingsIcon: { position: 'absolute', top: 16, right: 16, zIndex: 10, padding: 8 },
  title: { ...Typography.h2, color: themeColors.textWhite, marginBottom: 4 },
  subtitle: { ...Typography.body, color: '#9CA3AF' },
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border },
  chipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: themeColors.textSecondary },
  chipTextActive: { color: themeColors.textOnPrimary, fontWeight: '700' },
  list: { padding: Spacing.md },
  card: { backgroundColor: themeColors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', ...Shadows.sm },
  cardLeft: { flex: 1, marginRight: 12 },
  date: { ...Typography.bodyMedium, color: themeColors.textPrimary, marginBottom: 2 },
  time: { ...Typography.small, color: themeColors.textMuted, marginBottom: 4 },
  school: { ...Typography.small, color: themeColors.textSecondary },
  offer: { ...Typography.small, color: themeColors.textMuted },
  meeting: { ...Typography.caption, color: themeColors.textMuted, marginTop: 4 },
  progressBg: { height: 8, backgroundColor: themeColors.borderLight, borderRadius: Radius.full, marginTop: 10, marginBottom: 4 },
  progressFill: { height: 8, backgroundColor: themeColors.primary, borderRadius: Radius.full },
  progressLabel: { ...Typography.caption, color: themeColors.textSecondary },
  docsBtn: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border, borderRadius: Radius.md, alignSelf: 'flex-start' },
  docsBtnText: { fontSize: 13, color: themeColors.primary, fontWeight: '600' },
  docItem: { padding: 12, backgroundColor: themeColors.background, borderRadius: Radius.sm, marginBottom: 8 },
  docName: { ...Typography.bodyMedium, color: themeColors.textPrimary },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontSize: 26, fontWeight: '800', color: themeColors.dark },
  logoutBtn: { marginVertical: Spacing.lg, padding: 16, borderRadius: Radius.md, backgroundColor: themeColors.errorLight, alignItems: 'center' },
  logoutText: { color: themeColors.error, fontWeight: '700', fontSize: 15 },
  formContainer: { marginTop: 8 },
  label: { ...Typography.smallMedium, color: themeColors.textPrimary, marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border, borderRadius: Radius.md, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: themeColors.textPrimary },
  saveBtn: { marginTop: 24, padding: 16, borderRadius: Radius.md, backgroundColor: themeColors.primary, alignItems: 'center' },
  saveBtnText: { color: themeColors.textOnPrimary, fontWeight: '700', fontSize: 15 },
})

export default StudentPlanningScreen
