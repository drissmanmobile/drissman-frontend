// src/screens/student/StudentDashboardScreen.js
import { useTheme } from '../../context/ThemeContext'
import React, { useMemo, useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { getStudentEnrollments, getMyPayments } from '../../services/services'

export default function StudentDashboardScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openMenu } = useSideMenu()

  const DASHBOARD_TILES = useMemo(() => [
    { id: 'formation', title: t('student_dashboard.tile_formation'), icon: 'school-outline', color: '#3B82F6', route: 'StudentProgress' },
    { id: 'cours', title: t('student_dashboard.tile_courses'), icon: 'book-outline', color: '#10B981', route: 'StudentBookings' },
    { id: 'planning', title: t('student_dashboard.tile_planning'), icon: 'calendar-outline', color: '#F59E0B', route: 'StudentPlanning' },
    { id: 'moniteur', title: t('student_dashboard.tile_monitor'), icon: 'person-circle-outline', color: '#8B5CF6', route: null },
    { id: 'documents', title: t('student_dashboard.tile_documents'), icon: 'document-text-outline', color: '#6366F1', route: null },
    { id: 'classe', title: t('student_dashboard.tile_class'), icon: 'people-outline', color: '#EC4899', route: null },
    { id: 'quiz', title: t('student_dashboard.tile_quiz'), icon: 'help-circle-outline', color: '#14B8A6', route: 'StudentQuiz' },
    { id: 'examens', title: t('student_dashboard.tile_exams'), icon: 'medal-outline', color: '#F43F5E', route: null },
    { id: 'paiements', title: t('student_dashboard.tile_payments'), icon: 'card-outline', color: '#84CC16', route: 'StudentPayments' },
  ], [t])

  const [unpaidEnrollment, setUnpaidEnrollment] = useState(null)

  useFocusEffect(
    useCallback(() => {
      async function checkUnpaid() {
        try {
          const [enrollments, payments] = await Promise.all([
            getStudentEnrollments(),
            getMyPayments()
          ])
          
          const pending = enrollments.filter(e => e.status === 'PENDING')
          const unpaid = pending.find(e => 
            !payments.some(p => p.enrollmentId === e.id && (p.status === 'PENDING' || p.status === 'PAID'))
          )
          setUnpaidEnrollment(unpaid || null)
        } catch (e) {
          console.log('Error checking unpaid enrollments:', e)
        }
      }
      if (user) {
        checkUnpaid()
      }
    }, [user])
  )

  function handleTilePress(route) {
    if (route) {
      navigation.navigate(route)
    } else {
      // Pour les écrans non encore implémentés
      alert(t('student_dashboard.coming_soon'))
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.dark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={openMenu} style={{ marginRight: Spacing.md }}>
            <Ionicons name="menu" size={32} color={themeColors.textWhite} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>{t('student_dashboard.greeting')} {user?.firstName || t('student_dashboard.student')} 👋</Text>
            <Text style={styles.title}>{t('student_dashboard.title')}</Text>
          </View>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('StudentNotifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={themeColors.textWhite} />
            <View style={styles.badge} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => navigation.navigate('StudentProfile')}
          >
            <Ionicons name="person" size={20} color={themeColors.textWhite} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {unpaidEnrollment && (
          <TouchableOpacity 
            style={styles.warningBanner}
            onPress={() => navigation.navigate('StudentPayments')}
          >
            <Ionicons name="warning-outline" size={24} color={themeColors.error || '#EF4444'} />
            <Text style={[styles.warningText, { color: themeColors.error || '#EF4444' }]}>
              Vous avez une inscription en attente de paiement ({unpaidEnrollment.offerName || 'Offre'}). Cliquez ici pour la finaliser.
            </Text>
            <Ionicons name="chevron-forward" size={20} color={themeColors.error || '#EF4444'} />
          </TouchableOpacity>
        )}

        <View style={styles.grid}>
          {DASHBOARD_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.id}
              style={styles.tile}
              activeOpacity={0.8}
              onPress={() => handleTilePress(tile.route)}
            >
              <View style={[styles.iconContainer, { backgroundColor: tile.color + '20' }]}>
                <Ionicons name={tile.icon} size={28} color={tile.color} />
              </View>
              <Text style={styles.tileTitle}>{tile.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  header: {
    backgroundColor: themeColors.dark,
    paddingHorizontal: Spacing.lg,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  greeting: { fontSize: 14, color: '#9CA3AF', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: themeColors.textWhite },
  profileBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: themeColors.error || '#EF4444',
    borderWidth: 2,
    borderColor: themeColors.dark,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  warningBanner: {
    backgroundColor: '#EF444420',
    padding: 16,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    marginLeft: 12,
    flex: 1,
    fontWeight: '600',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  tile: {
    backgroundColor: themeColors.surface,
    width: '47%',
    aspectRatio: 1.1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  tileTitle: {
    ...Typography.bodyMedium,
    color: themeColors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
})
