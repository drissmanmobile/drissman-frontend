import { useTheme } from '../../context/ThemeContext'
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius } from '../../utils/theme';
import { getSchools, getNearbySchools } from '../../services/services';
import SchoolCard from '../../components/schools/SchoolCard';
import { useAuth } from '../../context/AuthContext';
import * as Location from 'expo-location';

export default function SchoolsListScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [isNearbySearch, setIsNearbySearch] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      setLoading(true);
      setIsNearbySearch(false);
      setUserLocation(null);
      const data = await getSchools();
      setSchools(data);
      setFilteredSchools(data);
    } catch (error) {
      console.log('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  }

  // Calculate distance in km between two coordinates
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }

  async function handleNearbySearch() {
    try {
      setLoading(true);
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert(t('schools.location_permission_denied') || 'Permission to access location was denied');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      
      const data = await getNearbySchools(latitude, longitude, 50); // 50km radius
      
      // Calculate and add distance to each school
      const schoolsWithDistance = data.map(school => ({
        ...school,
        calculatedDistance: calculateDistance(latitude, longitude, school.latitude, school.longitude)
      }));

      setSchools(schoolsWithDistance);
      setFilteredSchools(schoolsWithDistance);
      setIsNearbySearch(true);
      setSearchQuery('');
    } catch (error) {
      console.log('Error fetching nearby schools:', error);
      alert('Erreur lors de la récupération des auto-écoles à proximité.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(text) {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredSchools(schools);
      return;
    }
    const lowerText = text.toLowerCase();
    const filtered = schools.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerText) ||
        (s.city && s.city.toLowerCase().includes(lowerText))
    );
    setFilteredSchools(filtered);
  }

  function handleSchoolPress(school) {
    if (!isAuthenticated) {
      navigation.navigate('GuestSchoolDetail', { schoolId: school.id });
    } else {
      navigation.navigate('SchoolDetail', { schoolId: school.id });
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('schools.list_title')}</Text>
        <Text style={styles.headerSubtitle}>{t('schools.list_subtitle')}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={themeColors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('schools.search_placeholder')}
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.locationBtn, isNearbySearch && styles.locationBtnActive]} 
          onPress={isNearbySearch ? fetchSchools : handleNearbySearch}
        >
          <Ionicons 
            name={isNearbySearch ? "location" : "location-outline"} 
            size={22} 
            color={isNearbySearch ? themeColors.textOnPrimary : themeColors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSchools}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <SchoolCard school={item} onPress={handleSchoolPress} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="car-outline" size={48} color={themeColors.textMuted} />
              <Text style={styles.emptyText}>{t('schools.no_schools_found')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: { ...Typography.h1, color: themeColors.textPrimary },
  headerSubtitle: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginTop: 4 },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
    height: 48,
  },
  locationBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBtnActive: {
    backgroundColor: themeColors.primary,
    borderColor: themeColors.primary,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: themeColors.textPrimary,
  },
  clearBtn: { padding: 4 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    ...Typography.bodyMedium,
    color: themeColors.textSecondary,
    marginTop: 12,
  },
});
