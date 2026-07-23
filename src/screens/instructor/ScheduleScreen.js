// src/screens/instructor/ScheduleScreen.js
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal as RNModal,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { useTheme } from '../../context/ThemeContext'
import { getInstructorSchedule, validateSession, getSessionStudents } from '../../services/services'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import LiveSessionTrackingModal from '../../components/session/LiveSessionTrackingModal'


export default function InstructorScheduleScreen() {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openMenu } = useSideMenu()

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [selectedDay, setSelectedDay] = useState('20') // default 20 (Mai 2025)
  const [selectedSession, setSelectedSession] = useState(null)
  const [validating, setValidating] = useState(false)
  const [showTrackingModal, setShowTrackingModal] = useState(false)

  // Roll call states
  const [sessionStudents, setSessionStudents] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [loadingStudents, setLoadingStudents] = useState(false)

  const daysList = [
    { dayName: 'LUN', dayNum: '19', fullDate: '2025-05-19' },
    { dayName: 'MAR', dayNum: '20', fullDate: '2025-05-20' },
    { dayName: 'MER', dayNum: '21', fullDate: '2025-05-21' },
    { dayName: 'JEU', dayNum: '22', fullDate: '2025-05-22' },
    { dayName: 'VEN', dayNum: '23', fullDate: '2025-05-23' },
    { dayName: 'SAM', dayNum: '24', fullDate: '2025-05-24' },
    { dayName: 'DIM', dayNum: '25', fullDate: '2025-05-25' },
  ]

  useEffect(() => {
    fetchSchedule()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      async function loadStudents() {
        setLoadingStudents(true)
        try {
          const targetId = selectedSession.id || selectedSession.sessionId
          const list = await getSessionStudents(targetId, selectedSession.offerId, selectedSession.offerName)
          let finalStudents = [...list]
          if (selectedSession.studentName && selectedSession.studentName !== 'Classe collective') {
            const exists = finalStudents.some(s => s.studentName === selectedSession.studentName)
            if (!exists) {
              finalStudents.unshift({
                id: selectedSession.studentId || 'single_st',
                studentName: selectedSession.studentName,
                offerName: selectedSession.offerName || 'Offre',
              })
            }
          }
          setSessionStudents(finalStudents)
          const initialMap = {}
          finalStudents.forEach(st => {
            const key = st.id || st.studentId || st.studentName
            initialMap[key] = true // Présent par défaut
          })
          setAttendanceMap(initialMap)
        } catch (err) {
          console.log('Error loading students for session:', err)
        } finally {
          setLoadingStudents(false)
        }
      }
      loadStudents()
    } else {
      setSessionStudents([])
      setAttendanceMap({})
    }
  }, [selectedSession])

  const toggleStudent = (key) => {
    setAttendanceMap(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleAll = (selectAll) => {
    const nextMap = {}
    sessionStudents.forEach(st => {
      const key = st.id || st.studentId || st.studentName
      nextMap[key] = selectAll
    })
    setAttendanceMap(nextMap)
  }

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const data = await getInstructorSchedule(user?.id || 'i1')
      const normalized = (data || []).map((s, idx) => ({
        ...s,
        id: String(s.id || s.sessionId || `session_${idx}`),
      }))
      setSessions(normalized)
    } catch (e) {
      console.log('Error fetching schedule:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleValidatePresence = async (markPresent = true) => {
    if (!selectedSession) return
    const targetId = selectedSession.id || selectedSession.sessionId
    const duration = selectedSession.durationHours || 1
    setValidating(true)
    try {
      let finalMap = { ...attendanceMap }
      if (!markPresent) {
        sessionStudents.forEach(st => {
          const key = st.id || st.studentId || st.studentName
          finalMap[key] = false
        })
      }
      await validateSession(targetId, markPresent, finalMap)
      setSessions((prev) =>
        prev.map((s) =>
          (s.id || s.sessionId) === targetId
            ? { ...s, status: markPresent ? 'COMPLETED' : 'CANCELLED' }
            : s
        )
      )
      const presentCount = Object.values(finalMap).filter(Boolean).length
      Alert.alert(
        markPresent ? 'Émargement validé !' : 'Absence enregistrée',
        markPresent
          ? `L'émargement a été validé pour ${presentCount}/${sessionStudents.length} élève(s). Les ${duration}h de conduite ont été ajoutées à leur progression.`
          : `L'absence a été enregistrée pour cette séance.`
      )
      setSelectedSession(null)
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la présence.')
    } finally {
      setValidating(false)
    }
  }

  const getStatusBadgeProps = (status) => {
    switch (status) {
      case 'IN_PROGRESS':
        return { label: 'En cours', bg: '#FEF3C7', color: '#D97706' }
      case 'COMPLETED':
        return { label: 'Émargé (Terminé)', bg: '#DCFCE7', color: '#16A34A' }
      case 'CANCELLED':
        return { label: 'Absent', bg: '#FEE2E2', color: '#DC2626' }
      case 'PREVU':
      case 'SCHEDULED':
      default:
        return { label: 'À venir', bg: '#E0E7FF', color: '#4338CA' }
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planning & Émargement</Text>
        <TouchableOpacity style={styles.calendarIconBtn} onPress={fetchSchedule}>
          <Ionicons name="refresh" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Date Selector Row */}
      <View style={styles.dateSelectorContainer}>
        <Text style={styles.monthTitle}>Mai 2025</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysScroll}>
          {daysList.map((item) => {
            const isSelected = selectedDay === item.dayNum
            return (
              <TouchableOpacity
                key={item.dayNum}
                style={[styles.dayCard, isSelected && styles.dayCardSelected]}
                onPress={() => setSelectedDay(item.dayNum)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>
                  {item.dayName}
                </Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected]}>
                  {item.dayNum}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* Session Agenda List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item, index) => (item && item.id ? String(item.id) : (item && item.sessionId ? String(item.sessionId) : `session_${index}`))}
          contentContainerStyle={styles.agendaList}
          renderItem={({ item }) => {
            const badge = getStatusBadgeProps(item.status)
            const isCompleted = item.status === 'COMPLETED'
            const isCancelled = item.status === 'CANCELLED'

            return (
              <View style={styles.sessionRow}>
                {/* Time range column */}
                <View style={styles.timeColumn}>
                  <Text style={styles.timeStart}>
                    {item.startTime ? item.startTime.substring(0, 5) : '08:00'}
                  </Text>
                  <Text style={styles.timeEnd}>
                    {item.endTime ? item.endTime.substring(0, 5) : '09:30'}
                  </Text>
                </View>

                {/* Session details card */}
                <TouchableOpacity
                  style={[
                    styles.sessionCard,
                    isCompleted && { borderLeftColor: '#16A34A' },
                    isCancelled && { borderLeftColor: '#DC2626' },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedSession(item)}
                >
                  <View style={styles.sessionHeaderRow}>
                    <View style={styles.studentInfoGroup}>
                      <View style={styles.avatarMini}>
                        <Ionicons name="person" size={18} color="#4F46E5" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.studentName}>{item.studentName}</Text>
                        {/* Tag/Badge de l'Offre */}
                        <View style={styles.offerBadgeContainer}>
                          <Ionicons name="ribbon-outline" size={12} color="#4F46E5" style={{ marginRight: 3 }} />
                          <Text style={styles.offerBadgeText}>
                            Offre : {item.offerName || 'Pack Permis B'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  {/* Module Topic & Meeting Point */}
                  <View style={styles.sessionMetaRow}>
                    {item.title ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="book-outline" size={13} color="#6B7280" style={{ marginRight: 4 }} />
                        <Text style={styles.metaText}>{item.title}</Text>
                      </View>
                    ) : null}
                    {item.meetingPoint ? (
                      <View style={styles.metaItem}>
                        <Ionicons name="location-outline" size={13} color="#6B7280" style={{ marginRight: 4 }} />
                        <Text style={styles.metaText} numberOfLines={1}>{item.meetingPoint}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Roll Call Button */}
                  <TouchableOpacity
                    style={[
                      styles.rollCallBtn,
                      isCompleted && styles.rollCallBtnDone,
                      isCancelled && styles.rollCallBtnAbsent,
                    ]}
                    onPress={() => setSelectedSession(item)}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : isCancelled ? 'close-circle' : 'checkbox-outline'}
                      size={16}
                      color={isCompleted ? '#16A34A' : isCancelled ? '#DC2626' : '#4F46E5'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.rollCallBtnText,
                        isCompleted && { color: '#16A34A' },
                        isCancelled && { color: '#DC2626' },
                      ]}
                    >
                      {isCompleted
                        ? 'Présence validée'
                        : isCancelled
                        ? 'Absence signalée'
                        : 'Faire l\'appel / Émarger'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            )
          }}
        />
      )}

      {/* Attendance Validation / Roll Call Modal */}
      <RNModal visible={!!selectedSession} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Ionicons name="clipboard-outline" size={24} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.modalTitle}>Appel de séance & Émargement</Text>
            </View>

            {selectedSession && (
              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <View style={styles.modalDetailsBox}>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailLabel}>Offre de formation :</Text>
                    <Text style={[styles.detailValue, { color: '#4F46E5', fontWeight: '700' }]}>
                      {selectedSession.offerName || 'Pack Permis B'}
                    </Text>
                  </View>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailLabel}>Module / Leçon :</Text>
                    <Text style={styles.detailValue}>{selectedSession.title || 'Séance de conduite'}</Text>
                  </View>
                  <View style={styles.detailItemRow}>
                    <Text style={styles.detailLabel}>Durée séance :</Text>
                    <Text style={styles.detailValue}>{selectedSession.durationHours || 1} heure(s)</Text>
                  </View>
                  {selectedSession.meetingPoint && (
                    <View style={styles.detailItemRow}>
                      <Text style={styles.detailLabel}>Lieu RDV :</Text>
                      <Text style={styles.detailValue}>{selectedSession.meetingPoint}</Text>
                    </View>
                  )}

                  <View style={styles.noticeBox}>
                    <Ionicons name="information-circle-outline" size={16} color="#D97706" style={{ marginRight: 6 }} />
                    <Text style={styles.noticeText}>
                      Valider la présence ajoutera {selectedSession.durationHours || 1}h à la progression de chaque élève présent.
                    </Text>
                  </View>
                </View>

                {/* Roll Call Student List Section */}
                <View style={styles.rollCallSection}>
                  <View style={styles.rollCallHeader}>
                    <Text style={styles.rollCallTitle}>
                      Appel individuel ({sessionStudents.length} élève{sessionStudents.length > 1 ? 's' : ''})
                    </Text>
                    {sessionStudents.length > 1 && (
                      <TouchableOpacity onPress={() => {
                        const allChecked = Object.values(attendanceMap).length > 0 && Object.values(attendanceMap).every(Boolean)
                        toggleAll(!allChecked)
                      }}>
                        <Text style={styles.selectAllText}>
                          {Object.values(attendanceMap).length > 0 && Object.values(attendanceMap).every(Boolean) ? 'Tout décocher' : 'Tout cocher'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {loadingStudents ? (
                    <ActivityIndicator color="#4F46E5" style={{ marginVertical: 15 }} />
                  ) : sessionStudents.length === 0 ? (
                    <Text style={styles.emptyStudentsText}>Aucun élève inscrit trouvé pour cette offre.</Text>
                  ) : (
                    sessionStudents.map((st) => {
                      const key = st.id || st.studentId || st.studentName
                      const isPresent = attendanceMap[key] !== false
                      return (
                        <TouchableOpacity
                          key={key}
                          style={[styles.studentRowItem, isPresent && styles.studentRowItemActive]}
                          onPress={() => toggleStudent(key)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isPresent ? 'checkbox' : 'square-outline'}
                            size={22}
                            color={isPresent ? '#16A34A' : '#9CA3AF'}
                            style={{ marginRight: 10 }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.studentRowName}>{st.studentName}</Text>
                            {st.offerName ? <Text style={styles.studentRowOffer}>{st.offerName}</Text> : null}
                          </View>
                          <View style={[styles.presenceBadge, isPresent ? styles.presenceBadgePresent : styles.presenceBadgeAbsent]}>
                            <Text style={[styles.presenceBadgeText, isPresent ? styles.presenceBadgeTextPresent : styles.presenceBadgeTextAbsent]}>
                              {isPresent ? 'Présent' : 'Absent'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      )
                    })
                  )}
                </View>
              </ScrollView>
            )}

            {validating ? (
              <ActivityIndicator color="#4F46E5" style={{ marginVertical: 20 }} />
            ) : (
              <View style={[styles.modalActions, { marginTop: 12 }]}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#2563EB', marginBottom: 8 }]}
                  onPress={() => setShowTrackingModal(true)}
                >
                  <Ionicons name="navigate-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalBtnText}>Suivi GPS en direct</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#16A34A', marginBottom: 8 }]}
                  onPress={() => handleValidatePresence(true)}
                >
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalBtnText}>
                    Valider la présence ({Object.values(attendanceMap).filter(Boolean).length}/{sessionStudents.length} présents)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#DC2626', marginBottom: 8 }]}
                  onPress={() => handleValidatePresence(false)}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.modalBtnText}>Marquer tous Absents</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#9CA3AF' }]}
                  onPress={() => setSelectedSession(null)}
                >
                  <Text style={styles.modalBtnText}>Fermer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </RNModal>

      <LiveSessionTrackingModal
        visible={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        session={selectedSession}
        isInstructor={true}
      />
    </SafeAreaView>
  )
}


const getStyles = (themeColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: '#F9FAFB',
    },
    menuButton: { padding: 4 },
    calendarIconBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

    dateSelectorContainer: { marginBottom: Spacing.md },
    monthTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#111827',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    daysScroll: { paddingHorizontal: Spacing.lg },
    dayCard: {
      alignItems: 'center',
      justify: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: Radius.md,
      backgroundColor: '#FFF',
      marginRight: 8,
      minWidth: 44,
      ...Shadows.sm,
    },
    dayCardSelected: { backgroundColor: '#0F172A' },
    dayName: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginBottom: 2 },
    dayNum: { fontSize: 15, fontWeight: '800', color: '#111827' },
    dayTextSelected: { color: '#FFF' },

    agendaList: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: Spacing.md,
    },
    timeColumn: {
      width: 50,
      alignItems: 'flex-start',
      marginRight: Spacing.sm,
      paddingTop: 6,
    },
    timeStart: { fontSize: 13, fontWeight: '700', color: '#111827' },
    timeEnd: { fontSize: 11, color: '#6B7280' },

    sessionCard: {
      flex: 1,
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      padding: Spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: '#4F46E5',
      ...Shadows.sm,
    },
    sessionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    studentInfoGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 8,
    },
    avatarMini: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    studentName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    offerBadgeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    offerBadgeText: { fontSize: 11, fontWeight: '600', color: '#4B5563' },

    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: { fontSize: 11, fontWeight: '700' },

    sessionMetaRow: {
      marginTop: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 3,
    },
    metaText: { fontSize: 12, color: '#4B5563' },

    rollCallBtn: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#EEF2FF',
      paddingVertical: 8,
      borderRadius: Radius.md,
    },
    rollCallBtnDone: { backgroundColor: '#DCFCE7' },
    rollCallBtnAbsent: { backgroundColor: '#FEE2E2' },
    rollCallBtnText: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    modalCard: {
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      width: '100%',
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    modalTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    modalDetailsBox: {
      backgroundColor: '#F9FAFB',
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.lg,
    },
    detailItemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    detailLabel: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
    detailValue: { fontSize: 13, color: '#111827', fontWeight: '600' },

    noticeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      borderRadius: Radius.sm,
      padding: 8,
      marginTop: 10,
    },
    noticeText: { fontSize: 11, color: '#92400E', flex: 1, fontWeight: '500' },

    rollCallSection: {
      marginTop: 12,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
      paddingTop: 12,
    },
    rollCallHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    rollCallTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#1F2937',
    },
    selectAllText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#4F46E5',
    },
    emptyStudentsText: {
      fontSize: 13,
      color: '#6B7280',
      fontStyle: 'italic',
      textAlign: 'center',
      marginVertical: 10,
    },
    studentRowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F9FAFB',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: Radius.md,
      padding: 10,
      marginBottom: 8,
    },
    studentRowItemActive: {
      backgroundColor: '#F0FDF4',
      borderColor: '#BBF7D0',
    },
    studentRowName: {
      fontSize: 14,
      fontWeight: '700',
      color: '#111827',
    },
    studentRowOffer: {
      fontSize: 11,
      color: '#6B7280',
    },
    presenceBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    presenceBadgePresent: {
      backgroundColor: '#DCFCE7',
    },
    presenceBadgeAbsent: {
      backgroundColor: '#FEE2E2',
    },
    presenceBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    presenceBadgeTextPresent: {
      color: '#16A34A',
    },
    presenceBadgeTextAbsent: {
      color: '#DC2626',
    },

    modalActions: { width: '100%' },
    modalBtn: {
      height: 44,
      borderRadius: Radius.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.sm,
    },
    modalBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  })
