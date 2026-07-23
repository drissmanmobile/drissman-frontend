// src/screens/instructor/StudentDetailScreen.js
import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'

export default function StudentDetailScreen() {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const navigation = useNavigation()
  const route = useRoute()

  const { student } = route.params || {}

  const [activeSubTab, setActiveSubTab] = useState('APERÇU')

  // Fallback defaults matching Martin Paul mockup if student details are incomplete
  const studentData = {
    name: student?.studentName || 'Martin Paul',
    phone: student?.phone || '691 23 45 67',
    email: student?.email || 'martinpaul@gmail.com',
    status: student?.status || 'ACTIVE',
    offerName: student?.offerName || 'Pack Permis B Complet',
    hoursPurchased: student?.hoursPurchased || 20,
    hoursConsumed: student?.hoursConsumed || 12,
    pendingLessons: student?.pendingLessons !== undefined ? student?.pendingLessons : 2,
    progressPercent:
      student?.hoursPurchased && student?.hoursConsumed
        ? Math.round((student.hoursConsumed / student.hoursPurchased) * 100)
        : student?.progressPercent || 85,
    lessons: student?.lessons && student.lessons.length > 0
      ? student.lessons
      : [
          { id: 'l1', date: '19 Mai', title: 'Conduite en ville', time: '08:00 - 09:30', status: 'COMPLETED' },
          { id: 'l2', date: '17 Mai', title: 'Manœuvres', time: '10:00 - 11:30', status: 'COMPLETED' },
          { id: 'l3', date: '15 Mai', title: 'Conduite sur route', time: '13:00 - 14:30', status: 'COMPLETED' },
        ],
  }

  const handleSendMessage = () => {
    navigation.navigate('InstructorMessages', { studentName: studentData.name, studentId: studentData.studentId || studentData.id })
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails élève</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Ionicons name="person" size={36} color="#4F46E5" />
          </View>
          <Text style={styles.profileName}>{studentData.name}</Text>
          
          <View style={styles.contactRow}>
            <Ionicons name="call-outline" size={14} color="#D1D5DB" style={{ marginRight: 6 }} />
            <Text style={styles.contactText}>{studentData.phone}</Text>
          </View>
          
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={14} color="#D1D5DB" style={{ marginRight: 6 }} />
            <Text style={styles.contactText}>{studentData.email}</Text>
          </View>

          <View style={styles.badgeActiveContainer}>
            <Text style={styles.badgeActiveText}>
              {studentData.status === 'ACTIVE' ? 'Actif' : 'Inactif'}
            </Text>
          </View>
        </View>

        {/* Sub-tabs Header */}
        <View style={styles.subTabsRow}>
          {['Aperçu', 'Leçons', 'Évaluations', 'Documents'].map((tab) => {
            const key = tab.toUpperCase()
            const isActive = activeSubTab === key
            return (
              <TouchableOpacity
                key={key}
                style={[styles.subTabItem, isActive && styles.subTabItemActive]}
                onPress={() => setActiveSubTab(key)}
              >
                <Text style={[styles.subTabText, isActive && styles.subTabTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Tab Content */}
        {activeSubTab === 'APERÇU' && (
          <View style={styles.tabContainer}>
            {/* Stats grid */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{studentData.hoursConsumed}</Text>
                <Text style={styles.statLabel}>Leçons{'\n'}effectuées</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{studentData.pendingLessons}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{studentData.progressPercent}%</Text>
                <Text style={styles.statLabel}>Progression</Text>
              </View>
            </View>

            {/* Section: Dernières leçons */}
            <Text style={styles.sectionTitle}>Dernières leçons</Text>
            {studentData.lessons.map((lesson, idx) => (
              <View key={idx} style={styles.lessonCard}>
                <View style={styles.dateCol}>
                  <Text style={styles.dateDay}>{lesson.date.split(' ')[0]}</Text>
                  <Text style={styles.dateMonth}>{lesson.date.split(' ')[1] || 'Mai'}</Text>
                </View>
                <View style={styles.lessonMain}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                    <Text style={styles.timeText}>{lesson.time}</Text>
                  </View>
                </View>
                <View style={styles.completedBadge}>
                  <Text style={styles.completedBadgeText}>
                    {lesson.status === 'COMPLETED' ? 'Terminée' : 'À venir'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeSubTab !== 'APERÇU' && (
          <View style={styles.placeholderTab}>
            <Ionicons name="folder-open-outline" size={48} color="#9CA3AF" />
            <Text style={styles.placeholderText}>Information disponible dans la prochaine séance.</Text>
          </View>
        )}
      </ScrollView>

      {/* Fixed Message Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageButton} activeOpacity={0.8} onPress={handleSendMessage}>
          <Ionicons name="chatbubble-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.messageButtonText}>Envoyer un message</Text>
        </TouchableOpacity>
      </View>
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
    headerIconBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

    scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

    profileCard: {
      backgroundColor: '#0F172A',
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      marginBottom: Spacing.lg,
      ...Shadows.md,
    },
    avatarLarge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.xs,
    },
    profileName: { fontSize: 20, fontWeight: '700', color: '#FFF', marginBottom: Spacing.xs },
    contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    contactText: { fontSize: 13, color: '#D1D5DB' },
    badgeActiveContainer: {
      backgroundColor: '#16A34A',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: Spacing.sm,
    },
    badgeActiveText: { fontSize: 12, color: '#FFF', fontWeight: '700' },

    subTabsRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      marginBottom: Spacing.lg,
    },
    subTabItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    subTabItemActive: { borderBottomColor: '#1E293B' },
    subTabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    subTabTextActive: { fontWeight: '700', color: '#1E293B' },

    tabContainer: {},
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    statBox: {
      flex: 1,
      backgroundColor: '#FFF',
      borderRadius: Radius.md,
      paddingVertical: Spacing.md,
      alignItems: 'center',
      marginHorizontal: 4,
      ...Shadows.sm,
    },
    statNumber: { fontSize: 22, fontWeight: '800', color: '#111827' },
    statLabel: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 4 },

    sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: Spacing.md },

    lessonCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: Radius.md,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadows.sm,
    },
    dateCol: {
      backgroundColor: '#F3F4F6',
      borderRadius: Radius.sm,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: 'center',
      marginRight: Spacing.md,
    },
    dateDay: { fontSize: 16, fontWeight: '700', color: '#111827' },
    dateMonth: { fontSize: 11, color: '#6B7280' },
    lessonMain: { flex: 1 },
    lessonTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    timeText: { fontSize: 13, color: '#6B7280' },

    completedBadge: {
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    completedBadgeText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },

    placeholderTab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    placeholderText: { color: '#9CA3AF', marginTop: 12, fontSize: 14 },

    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#FFF',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      borderTopWidth: 1,
      borderTopColor: '#E5E7EB',
    },
    messageButton: {
      backgroundColor: '#0F172A',
      borderRadius: Radius.md,
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    messageButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  })
