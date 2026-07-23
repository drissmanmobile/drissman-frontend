// src/screens/student/StudentDashboardScreen.js
import React, { useMemo, useState, useCallback } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
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
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { formatDate } from '../../utils/formatters'
import { getStudentEnrollments, getMyPayments, getStudentSessions } from '../../services/services'
import api from '../../services/api'

export default function StudentDashboardScreen() {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openMenu } = useSideMenu()
  const navigation = useNavigation()

  const [enrollmentsList, setEnrollmentsList] = useState([])
  const [unpaidEnrollment, setUnpaidEnrollment] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [enrollmentsCount, setEnrollmentsCount] = useState(0)
  const [sessions, setSessions] = useState([])
  const DASHBOARD_TILES = useMemo(() => [
    { id: 'chat', title: 'Mon Moniteur', icon: 'chatbubbles-outline', bgColor: '#E0E7FF', iconColor: '#4F46E5', route: 'StudentMessages' },
    { id: 'formation', title: t('student_dashboard.tile_formation', 'Formation'), icon: 'school-outline', bgColor: '#E0E7FF', iconColor: '#4F46E5', route: 'StudentProgress' },
    { id: 'cours', title: t('student_dashboard.tile_courses', 'Mes cours'), icon: 'book-outline', bgColor: '#DCFCE7', iconColor: '#16A34A', route: 'StudentBookings' },
    { id: 'planning', title: t('student_dashboard.tile_planning', 'Planning'), icon: 'calendar-outline', bgColor: '#FCE7F3', iconColor: '#DB2777', route: 'StudentPlanning' },
    { id: 'documents', title: t('student_dashboard.tile_documents', 'Documents'), icon: 'document-text-outline', bgColor: '#FEF3C7', iconColor: '#D97706', route: 'StudentDocuments' },
    { id: 'quiz', title: t('student_dashboard.tile_quiz', 'Quiz & Code'), icon: 'help-circle-outline', bgColor: '#F3E8FF', iconColor: '#9333EA', route: 'StudentQuiz' },
    { id: 'paiements', title: t('student_dashboard.tile_payments', 'Paiements'), icon: 'card-outline', bgColor: '#ECFDF5', iconColor: '#059669', route: 'StudentPayments' },
    { id: 'notifs', title: 'Notifications', icon: 'notifications-outline', bgColor: '#FFEDD5', iconColor: '#EA580C', route: 'StudentNotifications' },
  ], [t])

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        setLoading(true)
        try {
          const [enrollments, payments, studentSessions] = await Promise.all([
            getStudentEnrollments(),
            getMyPayments(),
            getStudentSessions(user?.id)
          ])

          setEnrollmentsList(enrollments || [])
          setEnrollmentsCount(enrollments ? enrollments.length : 0)
          setSessions(studentSessions || [])

          const pending = (enrollments || []).filter(e => e.status === 'PENDING')
          const unpaid = pending.find(e => 
            !payments.some(p => p.enrollmentId === e.id && (p.status === 'PENDING' || p.status === 'PAID'))
          )
          setUnpaidEnrollment(unpaid || null)

          const notifsRes = await api.get('/api/notifications')
          const unread = (Array.isArray(notifsRes) ? notifsRes : []).filter(n => !n.read).length
          setUnreadCount(unread)
        } catch (e) {
          console.log('Error fetching dashboard data:', e)
        } finally {
          setLoading(false)
        }
      }
      if (user) {
        fetchData()
      }
    }, [user])
  )

  const handleTilePress = (route) => {
    if (route) {
      navigation.navigate(route)
    } else {
      alert(t('student_dashboard.coming_soon', 'Bientôt disponible'))
    }
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const todayStr = `${year}-${month}-${day}`

  const completedSessionsList = (sessions || []).filter(s => s.status === 'COMPLETED')
  const completedSessions = completedSessionsList.length

  const consumedHoursFromEnrollments = (enrollmentsList || []).reduce((sum, e) => sum + (e.hoursConsumed || 0), 0)
  const consumedHoursFromSessions = completedSessionsList.reduce((acc, curr) => acc + (curr.durationHours || 1), 0)
  const totalHours = Math.max(consumedHoursFromEnrollments, consumedHoursFromSessions)

  const totalRequiredHours = (enrollmentsList || []).reduce((sum, e) => sum + (e.hoursPurchased || e.hours || 0), 0)
  const progressPercentage = totalRequiredHours > 0 
    ? Math.min(100, Math.round(((totalHours || 0) / totalRequiredHours) * 100))
    : 0

  const todaySessions = (sessions || []).filter(s => s.date === todayStr)
  const todayActiveSessions = todaySessions
    .filter(s => s.status !== 'COMPLETED' && s.status !== 'CANCELLED')
    .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))

  const futureActiveSessions = (sessions || [])
    .filter(s => s.date > todayStr && s.status !== 'COMPLETED' && s.status !== 'CANCELLED')
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      return (a.startTime || '').localeCompare(b.startTime || '')
    })

  const nextSession = todayActiveSessions.length > 0
    ? todayActiveSessions[0]
    : (futureActiveSessions.length > 0 ? futureActiveSessions[0] : null)

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={openMenu} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => navigation.navigate('StudentNotifications')}
            >
              <Ionicons name="notifications-outline" size={24} color={themeColors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileBtn}
              onPress={() => navigation.navigate('StudentProfile')}
            >
              <Ionicons name="person-outline" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>{t('student_dashboard.greeting', 'Bonjour,')}</Text>
          <Text style={styles.userName}>{user?.firstName || t('student_dashboard.student', 'Élève')} 👋</Text>
          <Text style={styles.userRole}>Élève - Auto-école</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Alerte de paiement */}
        {unpaidEnrollment && (
          <TouchableOpacity 
            style={[styles.warningBanner, Shadows.sm]}
            onPress={() => navigation.navigate('StudentPayments')}
            activeOpacity={0.85}
          >
            <View style={styles.warningIconBadge}>
              <Ionicons name="warning-outline" size={22} color="#EF4444" />
            </View>
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Paiement en attente</Text>
              <Text style={styles.warningText}>
                Offre {unpaidEnrollment.offerName || ''} à régulariser. Cliquez pour payer.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}

        {/* Aperçu de la formation */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Aperçu de la formation</Text>
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.dateBadgeText}>{formatDate(todayStr)}</Text>
            </View>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : enrollmentsCount}</Text>
              <Text style={styles.statLabel}>Offres{'\n'}inscrites</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : completedSessions}</Text>
              <Text style={styles.statLabel}>Cours{'\n'}effectués</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : totalHours}h</Text>
              <Text style={styles.statLabel}>Heures de{'\n'}conduite</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{loading ? '-' : `${progressPercentage}%`}</Text>
              <Text style={styles.statLabel}>Progression{'\n'}globale</Text>
            </View>
          </View>

          {/* Banner spécial Progression Visuelle */}
          <TouchableOpacity 
            style={styles.progressBanner}
            onPress={() => navigation.navigate('StudentProgress')}
            activeOpacity={0.85}
          >
            <View style={styles.progressHeaderRow}>
              <View style={styles.progressTitleGroup}>
                <View style={styles.progressIconBadge}>
                  <Ionicons name="trophy-outline" size={16} color="#10B981" />
                </View>
                <Text style={styles.progressBannerTitle}>Progression de la Formation</Text>
              </View>
              <Text style={styles.progressPercentageText}>{progressPercentage}%</Text>
            </View>
            
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
            </View>

            <View style={styles.progressFooterRow}>
              <Text style={styles.progressSubtext}>
                {totalHours}h effectuées sur {totalRequiredHours}h • {completedSessions} cours validé(s)
              </Text>
              <View style={styles.progressLinkGroup}>
                <Text style={styles.progressLinkText}>Voir détail</Text>
                <Ionicons name="chevron-forward" size={14} color="#10B981" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Navigation Grid (3 colonnes) */}
        <View style={styles.gridContainer}>
          {DASHBOARD_TILES.map((tile, index) => (
            <TouchableOpacity 
              key={tile.id || index} 
              style={styles.tile}
              onPress={() => handleTilePress(tile.route)}
              activeOpacity={0.8}
            >
              <View style={[styles.tileIconContainer, { backgroundColor: tile.bgColor }]}>
                <Ionicons name={tile.icon} size={28} color={tile.iconColor} />
              </View>
              <Text style={styles.tileTitle} numberOfLines={1}>{tile.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Prochain Cours / Séance à venir */}
        <Text style={styles.sectionTitle}>Prochain cours</Text>
        {loading ? (
          <ActivityIndicator color={themeColors.primary} style={{ marginTop: 20 }} />
        ) : nextSession ? (
          <View style={[styles.nextLessonCard, Shadows.sm]}>
            <View style={styles.nextLessonHeader}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="car-sport" size={24} color="#4F46E5" />
              </View>
              <View style={styles.nextLessonInfo}>
                <Text style={styles.studentName}>{nextSession.offerName || 'Conduite'}</Text>
                <View style={styles.timeRow}>
                  <Ionicons name="time-outline" size={14} color={themeColors.textSecondary} />
                  <Text style={styles.timeText}>
                    {formatDate(nextSession.date)} • {nextSession.startTime ? nextSession.startTime.substring(0, 5) : '--:--'} - {nextSession.endTime ? nextSession.endTime.substring(0, 5) : '--:--'}
                  </Text>
                </View>
                <Text style={styles.lessonType}>{nextSession.schoolName || 'Auto-école'}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>À venir</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardText}>Aucun cours à venir planifié pour le moment.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  profileBtn: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
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
  warningBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
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
    color: '#991B1B',
  },
  warningText: {
    fontSize: 12,
    color: '#7F1D1D',
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
  progressBanner: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  progressBannerTitle: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
  },
  progressPercentageText: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: Radius.full,
  },
  progressFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressSubtext: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  progressLinkGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressLinkText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
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
  nextLessonCard: {
    backgroundColor: '#FFF',
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
    backgroundColor: '#EEF2FF',
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
    backgroundColor: '#FFF',
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
