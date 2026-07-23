import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme';
import { getMyDocuments } from '../../services/services';

export default function StudentDocumentsScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ADMIN'); // 'ADMIN' or 'PEDAGO'
  
  // Mock documents for demonstration
  const [documents, setDocuments] = useState([]);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const docs = await getMyDocuments();
      setDocuments(docs || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Adjust activeTab values based on Category vs Type, our API stores category "Administratif" / "Pédagogique"
  // If we map activeTab 'ADMIN' to 'Administratif' and 'PEDAGO' to 'Pédagogique'
  const filteredDocs = documents.filter(d => {
    if (activeTab === 'ADMIN') return d.category === 'Administratif' || d.category === 'ADMIN';
    if (activeTab === 'PEDAGO') return d.category === 'Pédagogique' || d.category === 'PEDAGO';
    return true;
  });

  const formatDateStr = (dateString) => {
    if (!dateString) return 'Récemment';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const handleOpenDoc = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ADMIN' && styles.activeTab]}
          onPress={() => setActiveTab('ADMIN')}
        >
          <Ionicons name="folder-outline" size={20} color={activeTab === 'ADMIN' ? themeColors.primary : themeColors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'ADMIN' && styles.activeTabText]}>Administratif</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'PEDAGO' && styles.activeTab]}
          onPress={() => setActiveTab('PEDAGO')}
        >
          <Ionicons name="book-outline" size={20} color={activeTab === 'PEDAGO' ? themeColors.primary : themeColors.textMuted} />
          <Text style={[styles.tabText, activeTab === 'PEDAGO' && styles.activeTabText]}>Pédagogique</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerRoot}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : filteredDocs.length === 0 ? (
        <View style={styles.centerRoot}>
          <Ionicons name="document-text-outline" size={64} color={themeColors.border} />
          <Text style={styles.emptyText}>Aucun document dans cette catégorie.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredDocs}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={() => handleOpenDoc(item.fileUrl)}>
              <View style={styles.cardIcon}>
                <Ionicons 
                  name={activeTab === 'ADMIN' ? "document-text" : "school"} 
                  size={24} 
                  color={activeTab === 'ADMIN' ? '#6366F1' : '#10B981'} 
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.docTitle} numberOfLines={2}>{item.title}</Text>
                <View style={styles.docMeta}>
                  <Text style={styles.metaText}>{formatDateStr(item.date)}</Text>
                  <View style={styles.dot} />
                  <Text style={styles.metaText}>{item.fileSize}</Text>
                </View>
              </View>
              <View style={styles.downloadBtn}>
                <Ionicons name="download-outline" size={20} color={themeColors.primary} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  centerRoot: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 8,
  },
  activeTab: {
    borderBottomColor: themeColors.primary,
  },
  tabText: {
    ...Typography.bodyMedium,
    color: themeColors.textMuted,
    fontWeight: '600',
  },
  activeTabText: {
    color: themeColors.primary,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: themeColors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: themeColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  docTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...Typography.small,
    color: themeColors.textSecondary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.textMuted,
    marginHorizontal: 8,
  },
  downloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.md,
    ...Typography.body,
    color: themeColors.textSecondary,
  }
});
