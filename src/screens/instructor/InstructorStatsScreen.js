// src/screens/instructor/InstructorStatsScreen.js
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
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'

export default function InstructorStatsScreen() {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const navigation = useNavigation()

  const [period, setPeriod] = useState('Cette semaine')

  const weeklyData = [
    { day: 'Lun', hours: 1.2 },
    { day: 'Mar', hours: 2.8 },
    { day: 'Mer', hours: 2.0 },
    { day: 'Jeu', hours: 4.5, highlight: true },
    { day: 'Ven', hours: 2.3 },
    { day: 'Sam', hours: 1.8 },
    { day: 'Dim', hours: 3.5 },
  ]

  const categoryBreakdown = [
    { name: 'Conduite en ville', percent: 40, color: '#3B82F6' },
    { name: 'Conduite sur route', percent: 30, color: '#60A5FA' },
    { name: 'Manœuvres', percent: 20, color: '#F87171' },
    { name: 'Stationnement', percent: 10, color: '#34D399' },
  ]

  const maxHours = Math.max(...weeklyData.map((d) => d.hours))

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes statistiques</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Pill */}
        <View style={styles.periodRow}>
          <TouchableOpacity style={styles.periodPill}>
            <Text style={styles.periodText}>{period}</Text>
            <Ionicons name="chevron-down" size={16} color="#374151" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* 4 Stats Grid */}
        <View style={styles.gridContainer}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.statNumber, { color: '#4F46E5' }]}>18</Text>
            <Text style={[styles.statLabel, { color: '#4F46E5' }]}>Leçons prévues</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={[styles.statNumber, { color: '#16A34A' }]}>12</Text>
            <Text style={[styles.statLabel, { color: '#16A34A' }]}>Leçons terminées</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.statNumber, { color: '#D97706' }]}>4</Text>
            <Text style={[styles.statLabel, { color: '#D97706' }]}>Élèves actifs</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F3E8FF' }]}>
            <Text style={[styles.statNumber, { color: '#9333EA' }]}>13.5h</Text>
            <Text style={[styles.statLabel, { color: '#9333EA' }]}>Heures de conduite</Text>
          </View>
        </View>

        {/* Chart 1: Heures de conduite */}
        <View style={[styles.chartCard, Shadows.sm]}>
          <Text style={styles.chartTitle}>Heures de conduite</Text>
          <View style={styles.chartArea}>
            {weeklyData.map((item, index) => {
              const heightPercent = (item.hours / maxHours) * 100
              return (
                <View key={index} style={styles.barColumn}>
                  {item.highlight && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>{item.hours}h</Text>
                    </View>
                  )}
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        { height: `${heightPercent}%` },
                        item.highlight && styles.barFillHighlight,
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Chart 2: Répartition des leçons */}
        <View style={[styles.chartCard, Shadows.sm]}>
          <Text style={styles.chartTitle}>Répartition des leçons</Text>

          <View style={styles.breakdownRow}>
            {/* Donut representation */}
            <View style={styles.donutContainer}>
              <View style={styles.donutCircle}>
                <Text style={styles.donutCenterText}>100%</Text>
              </View>
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              {categoryBreakdown.map((cat, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: cat.color }]} />
                  <Text style={styles.legendName}>{cat.name}</Text>
                  <Text style={styles.legendPercent}>{cat.percent}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
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

    scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: 40 },

    periodRow: { alignItems: 'flex-end', marginBottom: Spacing.md },
    periodPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    periodText: { fontSize: 13, fontWeight: '600', color: '#374151' },

    gridContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: Spacing.lg,
    },
    statCard: {
      width: '48%',
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
    },
    statNumber: { fontSize: 26, fontWeight: '800' },
    statLabel: { fontSize: 13, fontWeight: '600', marginTop: 4 },

    chartCard: {
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    chartTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: Spacing.lg },

    chartArea: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 140,
      paddingTop: 20,
    },
    barColumn: { alignItems: 'center', flex: 1 },
    tooltip: {
      backgroundColor: '#1E293B',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      position: 'absolute',
      top: -24,
    },
    tooltipText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    barTrack: {
      width: 14,
      height: 100,
      backgroundColor: '#F3F4F6',
      borderRadius: 7,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: {
      width: '100%',
      backgroundColor: '#94A3B8',
      borderRadius: 7,
    },
    barFillHighlight: { backgroundColor: '#1E293B' },
    barLabel: { fontSize: 12, color: '#6B7280', marginTop: 8 },

    breakdownRow: { flexDirection: 'row', alignItems: 'center' },
    donutContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 12,
      borderColor: '#3B82F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.lg,
    },
    donutCircle: { alignItems: 'center', justifyContent: 'center' },
    donutCenterText: { fontSize: 16, fontWeight: '800', color: '#111827' },

    legendContainer: { flex: 1 },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    legendName: { flex: 1, fontSize: 13, color: '#374151', fontWeight: '500' },
    legendPercent: { fontSize: 13, fontWeight: '700', color: '#111827' },
  })
