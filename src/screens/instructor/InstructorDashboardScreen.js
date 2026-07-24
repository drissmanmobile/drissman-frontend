// src/screens/instructor/InstructorDashboardScreen.js
import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { getInstructorSchedule, getChatContacts } from '../../services/services'
import api from '../../services/api'
import LiveSessionTrackingModal from '../../components/session/LiveSessionTrackingModal'
import { getActiveTrackingSessionId } from '../../services/sessionTrackingService'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { formatDate } from '../../utils/formatters'

export default function InstructorDashboardScreen() {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openMenu } = useSideMenu()
  const navigation = useNavigation()

  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [trackingSession, setTrackingSession] = useState(null)

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setLoading(true)
        try {
          const [sessionsData, contactsData, notifsRes] = await Promise.allSettled([
            getInstructorSchedule(user?.id),
            getChatContacts(),
            api.get('/api/notifications')
          ])

          let sched = []
          if (sessionsData.status === 'fulfilled') {
            sched = sessionsData.value || []
            setSessions(sched)
          }

          let unreadMsg = 0
          if (contactsData.status === 'fulfilled' && Array.isArray(contactsData.value)) {
            unreadMsg = contactsData.value.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
          }

          let unreadNotifs = 0
          if (notifsRes.status === 'fulfilled' && Array.isArray(notifsRes.value)) {
            unreadNotifs = notifsRes.value.filter(n => !n.read).length
          }

          const now = new Date()
          const year = now.getFullYear()
          const month = String(now.getMonth() + 1).padStart(2, '0')
          const day = String(now.getDate()).padStart(2, '0')
          const todayStr = `${year}-${month}-${day}`
          
          const pendingTodayCount = sched.filter(s => {
            const dateStr = s.date?.includes('T') ? s.date.split('T')[0] : s.date
            return dateStr === todayStr && s.status !== 'COMPLETED' && s.status !== 'CANCELLED'
          }).length

          const totalBadge = unreadNotifs + unreadMsg
          setUnreadCount(totalBadge)
        } catch (e) {
          console.log('Error fetching instructor schedule:', e)
          setUnreadCount(0)
        } finally {
          setLoading(false)
        }
      }
      if (user) {
        fetchData()
      }
    }, [user])
  )

  const dashboardTiles = useMemo(() => [
    { id: 'lessons', title: 'Mes leçons', icon: 'book-outline', route: 'InstructorSchedule', bgColor: '#E0E7FF', iconColor: '#4F46E5' },
    { id: 'students', title: 'Mes élèves', icon: 'people-outline', route: 'InstructorStudents', bgColor: '#DCFCE7', iconColor: '#16A34A' },
    { id: 'schedule', title: 'Planning', icon: 'calendar-outline', route: 'InstructorSchedule', bgColor: '#FCE7F3', iconColor: '#DB2777' },
    { id: 'presence', title: 'Présence', icon: 'checkmark-circle-outline', route: 'InstructorSchedule', bgColor: '#FEF3C7', iconColor: '#D97706' },
    { id: 'evaluations', title: 'Évaluations', icon: 'create-outline', route: 'InstructorStats', bgColor: '#F3E8FF', iconColor: '#9333EA' },
    { id: 'messages', title: 'Messages', icon: 'mail-outline', route: 'InstructorMessages', bgColor: '#FFEDD5', iconColor: '#EA580C' },
  ], [])

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`

  const getSessionDateStr = (dateVal) => {
    if (!dateVal) return ''
    if (typeof dateVal === 'string') {
      return dateVal.includes('T') ? dateVal.split('T')[0] : dateVal
    }
    return dateVal
  }

  const todaySessions = sessions.filter(s => getSessionDateStr(s.date) === todayStr)
  const completedLessons = todaySessions.filter(s => s.status === 'COMPLETED').length
  const absences = todaySessions.filter(s => s.status === 'CANCELLED' || s.status === 'ABSENT').length
  const plannedLessons = todaySessions.length
  
  const drivingHours = todaySessions.reduce((acc, curr) => acc + (curr.durationHours || 1), 0)
  
  // Leçons non terminées/non annulées d'aujourd'hui
  const todayUpcoming = todaySessions
    .filter(s => s.status !== 'COMPLETED' && s.status !== 'CANCELLED')
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  // Leçons futures à venir
  const futureUpcoming = sessions
    .filter(s => {
      const sDate = getSessionDateStr(s.date)
      return sDate > todayStr && s.status !== 'COMPLETED' && s.status !== 'CANCELLED'
    })
    .sort((a, b) => {
      const dateA = getSessionDateStr(a.date)
      const dateB = getSessionDateStr(b.date)
      if (dateA !== dateB) return dateA.localeCompare(dateB)
      return (a.startTime || '').localeCompare(b.startTime || '')
    })

  const nextLesson = todayUpcoming.length > 0
    ? todayUpcoming[0]
    : (futureUpcoming.length > 0 ? futureUpcoming[0] : null)

  const handleTilePress = (route) => {
    if (route) {
      navigation.navigate(route)
    } else {
      alert('Bientôt disponible')
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('StudentNotifications')} style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={24} color={themeColors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{t('dashboard.greeting', 'Bonjour,')}</Text>
          <Text style={styles.userName}>M. {user?.lastName || 'Moniteur'} {user?.firstName || ''}👋</Text>
          <Text style={styles.userRole}>{t('dashboard.instructor_role', 'Moniteur - Auto-école')}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Suivi GPS actif en arrière-plan */}
        {getActiveTrackingSessionId() ? (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#16A34A',
              paddingHorizontal: Spacing.md,
              paddingVertical: 10,
              marginBottom: Spacing.md,
              borderRadius: Radius.md,
            }}
            onPress={() => {
              const activeId = getActiveTrackingSessionId()
              const sess = sessions.find(s => s.id === activeId) || nextLesson || { id: activeId }
              setTrackingSession(sess)
            }}
          >
            <Ionicons name="radio-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={{ color: '#FFF', fontWeight: '700', flex: 1, fontSize: 13 }}>
              Transmission GPS en direct active
            </Text>
            <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 12, textDecorationLine: 'underline' }}>
              Afficher la carte
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Aperçu du jour */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>{t('dashboard.today_overview', 'Aperçu du jour')}</Text>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.dateBadgeText}>{formatDate(todayStr)}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : plannedLessons}</Text>
              <Text style={styles.statLabel}>{t('dashboard.planned_lessons', 'Leçons\nprévues')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : completedLessons}</Text>
              <Text style={styles.statLabel}>{t('dashboard.completed_lessons', 'Leçons\nterminées')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : absences}</Text>
              <Text style={styles.statLabel}>{t('dashboard.absence', 'Absence')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : drivingHours}h</Text>
              <Text style={styles.statLabel}>{t('dashboard.driving_hours', 'Heures de\nconduite')}</Text>
            </View>
          </View>
        </View>

        {/* Grid Navigation */}
        <View style={styles.gridContainer}>
          {dashboardTiles.map((tile, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.tile}
              onPress={() => handleTilePress(tile.route)}
            >
              <View style={[styles.tileIconContainer, { backgroundColor: tile.bgColor }]}>
                <Ionicons name={tile.icon} size={28} color={tile.iconColor} />
              </View>
              <Text style={styles.tileTitle}>{t(`dashboard.tile_${tile.id}`, tile.title)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Prochaine Leçon */}
        <Text style={styles.sectionTitle}>{t('dashboard.next_lesson', 'Prochaine leçon')}</Text>
        {loading ? (
          <ActivityIndicator color={themeColors.primary} style={{ marginTop: 20 }} />
        ) : nextLesson ? (
          <View style={[styles.nextLessonCard, Shadows.sm]}>
            <View style={styles.nextLessonHeader}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={24} color="#6B7280" />
              </View>
              <View style={styles.nextLessonInfo}>
                <Text style={styles.studentName}>{nextLesson.studentName}</Text>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color={themeColors.textSecondary} />
                  <Text style={styles.timeText}>
                    {nextLesson.date && nextLesson.date !== todayStr ? `${formatDate(nextLesson.date)} à ` : ''}
                    {nextLesson.startTime ? nextLesson.startTime.substring(0, 5) : '--:--'} - {nextLesson.endTime ? nextLesson.endTime.substring(0, 5) : '--:--'}
                  </Text>
                </View>
                <Text style={styles.lessonType}>{nextLesson.offerName || 'Conduite'}</Text>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#2563EB',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: Radius.md,
                    marginTop: 8,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => setTrackingSession(nextLesson)}
                >
                  <Ionicons name="navigate-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Suivi GPS & Carte Map</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>
                  {nextLesson.status === 'IN_PROGRESS' ? t('dashboard.in_progress', 'En cours') : t('dashboard.upcoming', 'À venir')}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>
              {plannedLessons > 0 
                ? t('dashboard.all_completed_today', "Toutes les leçons d'aujourd'hui sont terminées.") 
                : t('dashboard.no_lessons_today', "Aucune leçon prévue aujourd'hui.")}
            </Text>
          </View>
        )}
      </ScrollView>

      <LiveSessionTrackingModal
        visible={!!trackingSession}
        onClose={() => setTrackingSession(null)}
        session={trackingSession}
        isInstructor={true}
      />
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: themeColors.background,
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
    color: themeColors.textPrimary,
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
    fontSize: 22,
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
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  tile: {
    width: '31%',
    backgroundColor: themeColors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.sm,
    shadowOpacity: 0.05,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
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
  nextLessonCard: {
    backgroundColor: themeColors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
  },
  nextLessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextLessonInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
    color: themeColors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
  },
  lessonType: {
    fontSize: 13,
    color: themeColors.textSecondary,
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
  emptyCard: {
    backgroundColor: themeColors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.borderLight,
  },
  emptyCardText: {
    color: themeColors.textSecondary,
    fontStyle: 'italic',
  }
})
