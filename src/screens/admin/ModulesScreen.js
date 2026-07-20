// src/screens/admin/ModulesScreen.js
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { Modal, EmptyState, Badge } from '../../components/ui/index'
import * as DocumentPicker from 'expo-document-picker'
import { getAdminModules, getModuleDocuments, uploadDocument } from '../../services/services'
import { Ionicons } from '@expo/vector-icons'


export default function AdminModulesScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user } = useAuth()
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Documents state
  const [selectedModuleDocs, setSelectedModuleDocs] = useState(null)
  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadModules()
  }, [])

  async function loadModules() {
    try {
      setLoading(true)
      const data = await getAdminModules()
      setModules(data)
    } catch (err) {
      Alert.alert(t('schools.err_title'), t('admin_modules.err_load'))
    } finally {
      setLoading(false)
    }
  }

  async function handleViewDocuments(moduleItem) {
    setSelectedModuleDocs(moduleItem)
    setDocsLoading(true)
    try {
      const docs = await getModuleDocuments(moduleItem.id)
      setDocuments(docs)
    } catch (e) {
      console.log('Error fetching docs', e)
      setDocuments([])
      Alert.alert(t('schools.err_title'), t('admin_modules.err_docs'))
    } finally {
      setDocsLoading(false)
    }
  }

  async function handleUploadDocument() {
    if (!selectedModuleDocs) return
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]
      Alert.alert(t('schools.info_title'), t('admin_modules.uploading'))
      setUploading(true)
      
      const newDoc = await uploadDocument(
        file.uri,
        file.name,
        file.mimeType,
        user.id,
        selectedModuleDocs.id,
        null // sessionId is null since it's a module
      )
      
      Alert.alert(t('schools.success_title'), t('admin_modules.success_upload'))
      
      // Refresh documents list
      setDocuments(prev => [...prev, newDoc])
    } catch (err) {
      console.log('Upload error', err)
      Alert.alert(t('schools.err_title'), t('admin_modules.err_upload'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>{t('admin_modules.btn_back')}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{t('admin_modules.title')}</Text>
        <Text style={styles.subtitle}>{t('admin_modules.subtitle')}</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : (
        <FlatList
          data={modules}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, Shadows.sm]}>
              <View style={styles.cardContent}>
                <Text style={styles.moduleName}>{item.name}</Text>
                <Text style={styles.moduleCategory}>
                  {item.category === 'THEORY' ? t('admin_modules.theory') : t('admin_modules.practical')}
                </Text>
                <Text style={styles.moduleDesc}>{item.description}</Text>
                <Text style={styles.moduleMeta}>
                  {item.requiredHours} {t('admin_modules.hours_req')}
                </Text>
              </View>
              
              <TouchableOpacity onPress={() => handleViewDocuments(item)} style={styles.docsBtn}>
                <Text style={styles.docsBtnText}><Ionicons name="folder-outline" size={14} color={themeColors.primary} /> {t('admin_modules.btn_docs')}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<EmptyState message={t('admin_modules.empty')} icon={<Ionicons name="book-outline" size={48} color={themeColors.textSecondary} />} />}
        />
      )}

      {/* Modal for Module Documents */}
      <Modal
        isVisible={!!selectedModuleDocs}
        onClose={() => setSelectedModuleDocs(null)}
        title={`${t('admin_modules.modal_title')} ${selectedModuleDocs?.name || ''}`}
      >
        {docsLoading ? (
          <ActivityIndicator color={themeColors.primary} style={{ marginVertical: 20 }} />
        ) : (
          <View>
            <TouchableOpacity 
              style={[styles.uploadBtn, uploading && { opacity: 0.7 }]} 
              onPress={handleUploadDocument}
              disabled={uploading}
            >
              <Text style={styles.uploadBtnText}>
                {uploading ? t('admin_modules.btn_uploading') : t('admin_modules.btn_add_doc')}
              </Text>
            </TouchableOpacity>

            {documents.length === 0 ? (
              <Text style={styles.emptyText}>{t('admin_modules.empty_docs')}</Text>
            ) : (
              <ScrollView style={{ maxHeight: 300 }}>
                {documents.map((doc, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.docItem}
                    onPress={() => Linking.openURL(doc.fileUrl)}
                  >
                    <Ionicons name="document-text-outline" size={24} color={themeColors.textSecondary} style={styles.docIcon} />
                    <View style={styles.docInfo}>
                      <Text style={styles.docName} numberOfLines={1}>{doc.name}</Text>
                      <Text style={styles.docDate}>
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : t('admin_modules.new')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </Modal>
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  header: { backgroundColor: themeColors.dark, padding: Spacing.lg, paddingBottom: 20 },
  headerTop: { flexDirection: 'row', marginBottom: 12 },
  backBtn: { padding: 4 },
  backBtnText: { color: themeColors.primary, fontWeight: '600', fontSize: 16 },
  title: { ...Typography.h2, color: themeColors.textWhite, marginBottom: 4 },
  subtitle: { ...Typography.body, color: '#9CA3AF' },
  list: { padding: Spacing.md },
  card: { 
    backgroundColor: themeColors.surface, 
    borderRadius: Radius.lg, 
    padding: Spacing.md, 
    marginBottom: 12,
  },
  cardContent: { marginBottom: 12 },
  moduleName: { ...Typography.h3, color: themeColors.textPrimary, marginBottom: 2 },
  moduleCategory: { ...Typography.small, color: themeColors.primary, fontWeight: '600', marginBottom: 6 },
  moduleDesc: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginBottom: 8 },
  moduleMeta: { ...Typography.caption, color: themeColors.textMuted },
  docsBtn: { 
    backgroundColor: themeColors.surface, 
    borderWidth: 1, 
    borderColor: themeColors.border, 
    borderRadius: Radius.md, 
    paddingVertical: 10, 
    alignItems: 'center' 
  },
  docsBtnText: { fontSize: 14, color: themeColors.primary, fontWeight: '600' },
  uploadBtn: {
    backgroundColor: themeColors.primary,
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadBtnText: { color: themeColors.textOnPrimary, fontWeight: '700', fontSize: 14 },
  emptyText: { textAlign: 'center', color: themeColors.textSecondary, marginVertical: 20 },
  docItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 12, 
    backgroundColor: themeColors.background, 
    borderRadius: Radius.sm, 
    marginBottom: 8,
    borderWidth: 1,
    borderColor: themeColors.borderLight
  },
  docIcon: { marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { ...Typography.bodyMedium, color: themeColors.textPrimary, fontWeight: '500' },
  docDate: { ...Typography.caption, color: themeColors.textMuted, marginTop: 2 },
})
