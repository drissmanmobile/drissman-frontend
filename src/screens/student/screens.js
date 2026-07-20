// src/screens/student/PlanningScreen.js
import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Image, Alert, Switch } from 'react-native'
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
      const docs = await getSessionDocuments(session.id)
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
    if (filter === 'UPCOMING') return new Date(s.date) >= now
    if (filter === 'PAST') return new Date(s.date) < now
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
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
                <Text style={styles.time}>{formatTime(item.date)}</Text>
                <Text style={styles.school} numberOfLines={1}>{item.schoolName}</Text>
                <Text style={styles.offer} numberOfLines={1}>{item.offerName}</Text>
                {item.meetingPoint && <Text style={styles.meeting}><Ionicons name="location-outline" size={14} color={themeColors.textMuted} /> {item.meetingPoint}</Text>}
                
                <TouchableOpacity onPress={() => handleViewDocuments(item)} style={styles.docsBtn}>
                  <Text style={styles.docsBtnText}>{t('student_planning.view_docs')}</Text>
                </TouchableOpacity>
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
export function StudentProgressScreen() {
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
        <Text style={styles.title}>{t('student_progress.title')}</Text>
        <Text style={styles.subtitle}>{t('student_progress.subtitle')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : (
        <FlatList
          data={enrollments}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const pct = item.totalSessions > 0
              ? Math.round((item.sessionsCompleted / item.totalSessions) * 100)
              : 0
            return (
              <View style={styles.card}>
                <Text style={styles.date}>{item.schoolName}</Text>
                <Text style={styles.offer}>{item.offerName}</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressLabel}>
                  {item.sessionsCompleted}/{item.totalSessions} {t('student_progress.sessions')} ({pct}%)
                </Text>
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setUploading(true)
      try {
        const uploadRes = await uploadImage(result.assets[0].uri);
        if (uploadRes.fileUrl) {
          await updateProfile({ avatarUrl: uploadRes.fileUrl });
          await refreshUser();
        }
      } catch (e) {
        Alert.alert('Erreur', 'Impossible de mettre à jour la photo de profil');
      } finally {
        setUploading(false)
      }
    }
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: themeColors.background }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openMenu} style={{ marginRight: Spacing.md }}>
            <Ionicons name="menu" size={32} color={themeColors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('navigation.profile', 'Mon Profil')}</Text>
        </View>
        <TouchableOpacity onPress={pickImage} disabled={uploading} style={{ alignSelf: 'center', marginTop: 16 }}>
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
        <Text style={styles.title}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
        <View style={[styles.chip, styles.chipActive, { marginTop: 8 }]}>
          <Text style={styles.chipTextActive}>{user?.role}</Text>
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
        <Text style={styles.logoutText}>{t('profile.logout')}</Text>
      </TouchableOpacity>
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
  logoutBtn: { margin: Spacing.lg, padding: 16, borderRadius: Radius.md, backgroundColor: themeColors.errorLight, alignItems: 'center' },
  logoutText: { color: themeColors.error, fontWeight: '700', fontSize: 15 },
})

export default StudentPlanningScreen
