// src/screens/instructor/StudentsScreen.js
import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { useTheme } from '../../context/ThemeContext'
import { getMonitorStudents } from '../../services/services'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'

export default function InstructorStudentsScreen() {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)
  const navigation = useNavigation()

  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('ALL') // ALL, ACTIVE, INACTIVE
  const [selectedOfferFilter, setSelectedOfferFilter] = useState('ALL') // ALL or offerId/offerName
  const [showFilterModal, setShowFilterModal] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const data = await getMonitorStudents()
      setStudents(data || [])
    } catch (e) {
      console.log('Error loading students:', e)
    } finally {
      setLoading(false)
    }
  }

  // Extract unique offers for filter dropdown
  const uniqueOffers = useMemo(() => {
    const map = new Map()
    students.forEach((s) => {
      if (s.offerName) {
        map.set(s.offerName, s.offerName)
      }
    })
    return Array.from(map.values())
  }, [students])

  const counts = useMemo(() => {
    const total = students.length
    const active = students.filter((s) => s.status === 'ACTIVE').length
    const inactive = students.filter((s) => s.status === 'INACTIVE').length
    return { total, active, inactive }
  }, [students])

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Filter by tab status
      if (activeTab === 'ACTIVE' && student.status !== 'ACTIVE') return false
      if (activeTab === 'INACTIVE' && student.status !== 'INACTIVE') return false

      // Filter by offer
      if (selectedOfferFilter !== 'ALL' && student.offerName !== selectedOfferFilter) {
        return false
      }

      // Filter by search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const nameMatch = student.studentName?.toLowerCase().includes(query)
        const phoneMatch = student.phone?.includes(query)
        const offerMatch = student.offerName?.toLowerCase().includes(query)
        return nameMatch || phoneMatch || offerMatch
      }

      return true
    })
  }, [students, activeTab, selectedOfferFilter, searchQuery])

  const renderStudentItem = ({ item }) => {
    const isActive = item.status === 'ACTIVE'
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('InstructorStudentDetail', { student: item })}
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={24} color="#4F46E5" />
        </View>

        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.studentName}</Text>
          <Text style={styles.studentDetails}>
            {item.phone || 'N/A'}  •  {item.hoursConsumed || 0} leçons
          </Text>
          {item.offerName && (
            <Text style={styles.offerBadgeText} numberOfLines={1}>
              {item.offerName}
            </Text>
          )}
        </View>

        <View style={styles.rightContainer}>
          <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {isActive ? 'Actif' : 'Inactif'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes élèves</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar & Filter Button */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un élève..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterButton, selectedOfferFilter !== 'ALL' && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons
            name="funnel-outline"
            size={20}
            color={selectedOfferFilter !== 'ALL' ? '#FFF' : '#374151'}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs Row */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
          onPress={() => setActiveTab('ALL')}
        >
          <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
            Tous ({counts.total})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'ACTIVE' && styles.tabItemActive]}
          onPress={() => setActiveTab('ACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
            Actifs ({counts.active})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'INACTIVE' && styles.tabItemActive]}
          onPress={() => setActiveTab('INACTIVE')}
        >
          <Text style={[styles.tabText, activeTab === 'INACTIVE' && styles.tabTextActive]}>
            Inactifs ({counts.inactive})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter indicator banner if active */}
      {selectedOfferFilter !== 'ALL' && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterBannerText}>Filtre par offre: {selectedOfferFilter}</Text>
          <TouchableOpacity onPress={() => setSelectedOfferFilter('ALL')}>
            <Ionicons name="close" size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      )}

      {/* Student List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4F46E5" />
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item, index) => String(item.id || item.studentId || item.enrollmentId || index)}
          renderItem={renderStudentItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>Aucun élève trouvé.</Text>
            </View>
          }
        />
      )}

      {/* FAB (+) */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={() => {}}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Filter by Offer Modal */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrer par Offre</Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                selectedOfferFilter === 'ALL' && styles.modalOptionSelected,
              ]}
              onPress={() => {
                setSelectedOfferFilter('ALL')
                setShowFilterModal(false)
              }}
            >
              <Text style={styles.modalOptionText}>Toutes les offres</Text>
              {selectedOfferFilter === 'ALL' && (
                <Ionicons name="checkmark" size={18} color="#4F46E5" />
              )}
            </TouchableOpacity>

            {uniqueOffers.map((offer, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.modalOption,
                  selectedOfferFilter === offer && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setSelectedOfferFilter(offer)
                  setShowFilterModal(false)
                }}
              >
                <Text style={styles.modalOptionText}>{offer}</Text>
                {selectedOfferFilter === offer && (
                  <Ionicons name="checkmark" size={18} color="#4F46E5" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
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
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },

    searchRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
      alignItems: 'center',
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      height: 44,
      marginRight: Spacing.sm,
    },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    filterButton: {
      width: 44,
      height: 44,
      backgroundColor: '#F3F4F6',
      borderRadius: Radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterButtonActive: { backgroundColor: '#4F46E5' },

    tabsRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      marginBottom: Spacing.sm,
    },
    tabItem: {
      marginRight: Spacing.lg,
      paddingVertical: Spacing.xs,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabItemActive: { borderBottomColor: '#1E293B' },
    tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    tabTextActive: { fontWeight: '700', color: '#1E293B' },

    filterBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#EEF2FF',
      marginHorizontal: Spacing.lg,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: Radius.sm,
      marginBottom: Spacing.xs,
    },
    filterBannerText: { fontSize: 13, color: '#4F46E5', fontWeight: '500' },

    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 80 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
      ...Shadows.sm,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#EEF2FF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.md,
    },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 15, fontWeight: '700', color: '#111827' },
    studentDetails: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    offerBadgeText: { fontSize: 12, color: '#4F46E5', marginTop: 2, fontWeight: '500' },

    rightContainer: { flexDirection: 'row', alignItems: 'center' },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    badgeActive: { backgroundColor: '#DCFCE7' },
    badgeInactive: { backgroundColor: '#F3F4F6' },
    statusText: { fontSize: 12, fontWeight: '600' },
    statusTextActive: { color: '#16A34A' },
    statusTextInactive: { color: '#6B7280' },

    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
    emptyText: { marginTop: 12, fontSize: 14, color: '#9CA3AF' },

    fab: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#0F172A',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      paddingHorizontal: Spacing.lg,
    },
    modalContent: {
      backgroundColor: '#FFF',
      borderRadius: Radius.lg,
      padding: Spacing.lg,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: Spacing.md },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    modalOptionSelected: { backgroundColor: '#F8FAFC' },
    modalOptionText: { fontSize: 15, color: '#111827' },
  })
