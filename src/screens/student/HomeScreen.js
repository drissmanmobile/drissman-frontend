// src/screens/student/HomeScreen.js
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { useSideMenu } from '../../context/SideMenuContext'
import { getSchools } from '../../services/services'
import SchoolCard from '../../components/schools/SchoolCard'
import { EmptyState } from '../../components/ui/index'
import { Colors, Typography, Spacing, Radius } from '../../utils/theme'
import { useTranslation } from 'react-i18next'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'

export default function StudentHomeScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user } = useAuth()
  const { openMenu } = useSideMenu()
  const [schools, setSchools] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCity, setSelectedCity] = useState(t('student_home.city_all'))

  const CITIES = [t('student_home.city_all'), 'Douala', 'Yaoundé', 'Bafoussam']

  useEffect(() => {
    fetchSchools()
  }, [selectedCity, search])

  async function fetchSchools() {
    setLoading(true)
    try {
      const filters = {}
      if (selectedCity !== t('student_home.city_all')) filters.city = selectedCity
      if (search.trim()) filters.search = search.trim()
      const data = await getSchools(filters)
      setSchools(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.dark} />

      {/* Hero header */}
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={openMenu} style={{ marginRight: Spacing.md }}>
            <Ionicons name="menu" size={32} color={themeColors.textWhite} />
          </TouchableOpacity>
          <Text style={styles.greeting}>{t('student_home.hello')} {user?.firstName} 👋</Text>
        </View>
        <Text style={styles.heroTitle}>
          {t('student_home.hero_title')}{'\n'}
          <Text style={styles.heroAccent}>{t('student_home.hero_accent')}</Text>
        </Text>
        <Text style={styles.heroStats}>{t('student_home.hero_stats')}</Text>

        {/* Barre de recherche */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('student_home.search_placeholder')}
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filtres par ville */}
      <View style={styles.filterRow}>
        {CITIES.map((city) => (
          <TouchableOpacity
            key={city}
            onPress={() => setSelectedCity(city)}
            style={[styles.chip, selectedCity === city && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedCity === city && styles.chipTextActive]}>
              {city}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* En-tête résultats */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsTitle}>
          {t('student_home.results_title')}
          {schools.length > 0 && (
            <Text style={styles.resultsCount}> ({schools.length})</Text>
          )}
        </Text>
      </View>

      {/* Liste des écoles */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : schools.length === 0 ? (
        <EmptyState
          message={t('student_home.no_school')}
          actionLabel={t('student_home.reset')}
          onAction={() => { setSearch(''); setSelectedCity(t('student_home.city_all')) }}
        />
      ) : (
        <FlatList
          data={schools}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <SchoolCard
              school={item}
              onPress={(s) => navigation.navigate('SchoolDetail', { schoolId: s.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  hero: {
    backgroundColor: themeColors.dark,
    paddingHorizontal: Spacing.lg,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greeting: { fontSize: 13, color: '#9CA3AF', marginBottom: 8 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: themeColors.textWhite, lineHeight: 34, marginBottom: 8 },
  heroAccent: { color: themeColors.primary },
  heroStats: { fontSize: 12, color: '#6B7280', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A2332',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#1F2D40',
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: themeColors.textWhite },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  chipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: themeColors.textSecondary },
  chipTextActive: { color: themeColors.textOnPrimary, fontWeight: '700' },
  resultsHeader: { paddingHorizontal: Spacing.md, marginBottom: 4 },
  resultsTitle: { ...Typography.h4, color: themeColors.textPrimary },
  resultsCount: { color: themeColors.primary },
  list: { paddingHorizontal: Spacing.md, paddingBottom: 24 },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
