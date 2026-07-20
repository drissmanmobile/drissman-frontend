// src/screens/instructor/ScheduleScreen.js
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { getInstructorSchedule, validateSession, uploadDocument } from '../../services/services'
import * as DocumentPicker from 'expo-document-picker'
import { Badge, Modal } from '../../components/ui/index'
import { EmptyState } from '../../components/ui/index'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { formatDate, formatTime } from '../../utils/formatters'
import Button from '../../components/ui/Button'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'



export default function InstructorScheduleScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openMenu } = useSideMenu()

  const FILTERS = useMemo(() => [
    { key: 'ALL', label: t('instructor_schedule.filter_all') },
    { key: 'UPCOMING', label: t('instructor_schedule.filter_upcoming') },
    { key: 'PAST', label: t('instructor_schedule.filter_past') },
  ], [t])
  const [sessions, setSessions] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState(null)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    getInstructorSchedule(user?.id || 'i1').then(setSessions).finally(() => setLoading(false))
  }, [])

  async function handleValidate(present) {
    if (!selectedSession) return
    setValidating(true)
    try {
      await validateSession(selectedSession.id, present)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === selectedSession.id
            ? { ...s, status: present ? 'COMPLETED' : 'CANCELLED' }
            : s
        )
      )
      setSelectedSession(null)
    } catch {
      Alert.alert(t('schools.err_title'), t('instructor_schedule.err_validate'))
    } finally {
      setValidating(false)
    }
  }

  async function handleUploadDocument(session) {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]
      Alert.alert(t('schools.info_title'), t('instructor_schedule.uploading'))
      
      await uploadDocument(
        file.uri,
        file.name,
        file.mimeType,
        user.id,
        null,
        session.id
      )
      
      Alert.alert(t('schools.success_title'), t('instructor_schedule.success_upload'))
    } catch (err) {
      console.log('Upload error', err)
      Alert.alert(t('schools.err_title'), t('instructor_schedule.err_upload'))
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
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openMenu} style={{ marginRight: Spacing.md }}>
            <Ionicons name="menu" size={32} color={themeColors.textWhite} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{t('instructor_schedule.title')}</Text>
            <Text style={styles.subtitle}>{t('instructor_schedule.subtitle', { name: user?.firstName })}</Text>
          </View>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key)}
            style={[styles.chip, filter === f.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Liste */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : filtered.length === 0 ? (
        <EmptyState message={t('instructor_schedule.empty')} icon={<Ionicons name="calendar-outline" size={48} color={themeColors.textSecondary} />} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isPast = new Date(item.date) < now
            const canValidate = isPast && item.status !== 'COMPLETED' && item.status !== 'CANCELLED'
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                    <Text style={styles.timeText}>{formatTime(item.date)}</Text>
                  </View>
                  <Badge status={item.status} />
                </View>

                <Text style={styles.offerName}>{item.offerName}</Text>
                <Text style={styles.schoolName}>{item.schoolName}</Text>
                {item.meetingPoint && (
                  <Text style={styles.meeting}><Ionicons name="location-outline" size={14} color={themeColors.textMuted} /> {item.meetingPoint}</Text>
                )}

                {canValidate && (
                  <TouchableOpacity
                    onPress={() => setSelectedSession(item)}
                    style={styles.validateBtn}
                  >
                    <Text style={styles.validateText}><Ionicons name="checkmark-outline" size={16} color={themeColors.textOnPrimary} /> {t('instructor_schedule.validate_btn')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => handleUploadDocument(item)}
                  style={styles.uploadBtn}
                >
                  <Text style={styles.uploadText}><Ionicons name="attach-outline" size={16} color={themeColors.textPrimary} /> {t('instructor_schedule.upload_btn')}</Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}

      {/* Modal validation présence */}
      <Modal
        isVisible={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={t('instructor_schedule.modal_title')}
      >
        {selectedSession && (
          <View>
            <View style={styles.modalInfo}>
              <Text style={styles.modalOffer}>{selectedSession.offerName}</Text>
              <Text style={styles.modalDate}>
                {formatDate(selectedSession.date)} à {formatTime(selectedSession.date)}
              </Text>
            </View>
            <Text style={styles.modalQuestion}>{t('instructor_schedule.modal_question')}</Text>
            <View style={styles.modalButtons}>
              <Button
                variant="outline"
                onPress={() => handleValidate(false)}
                loading={validating}
                style={[styles.modalBtn, { borderColor: themeColors.error }]}
              >
                <Text style={{ color: themeColors.error, fontWeight: '700' }}><Ionicons name="close-circle-outline" size={16} color={themeColors.error} /> {t('instructor_schedule.absent')}</Text>
              </Button>
              <Button
                variant="primary"
                onPress={() => handleValidate(true)}
                loading={validating}
                style={styles.modalBtn}
              >
                <Text style={{ color: themeColors.textOnPrimary, fontWeight: '700' }}><Ionicons name="checkmark-circle-outline" size={16} color={themeColors.textOnPrimary} /> {t('instructor_schedule.present')}</Text>
              </Button>
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  header: { backgroundColor: themeColors.dark, padding: Spacing.lg, paddingBottom: 24 },
  title: { ...Typography.h2, color: themeColors.textWhite, marginBottom: 4 },
  subtitle: { ...Typography.body, color: '#9CA3AF' },
  filterRow: { flexDirection: 'row', padding: Spacing.md, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border },
  chipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: themeColors.textSecondary },
  chipTextActive: { color: themeColors.textOnPrimary, fontWeight: '700' },
  list: { padding: Spacing.md },
  card: { backgroundColor: themeColors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: 12, ...Shadows.sm },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  dateBox: {},
  dateText: { ...Typography.bodyMedium, color: themeColors.textPrimary },
  timeText: { ...Typography.small, color: themeColors.textMuted },
  offerName: { ...Typography.bodyMedium, color: themeColors.textPrimary, marginBottom: 2 },
  schoolName: { ...Typography.small, color: themeColors.textSecondary, marginBottom: 4 },
  meeting: { ...Typography.caption, color: themeColors.textMuted, marginBottom: 10 },
  validateBtn: { backgroundColor: themeColors.primary, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', marginTop: 6 },
  validateText: { fontWeight: '700', color: themeColors.textOnPrimary, fontSize: 13 },
  uploadBtn: { backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border, borderRadius: Radius.md, paddingVertical: 10, alignItems: 'center', marginTop: 8 },
  uploadText: { fontWeight: '600', color: themeColors.textPrimary, fontSize: 13 },
  modalInfo: { backgroundColor: themeColors.borderLight, borderRadius: Radius.md, padding: 12, marginBottom: 14 },
  modalOffer: { ...Typography.bodyMedium, color: themeColors.textPrimary },
  modalDate: { ...Typography.small, color: themeColors.textSecondary },
  modalQuestion: { ...Typography.body, color: themeColors.textSecondary, marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
})
