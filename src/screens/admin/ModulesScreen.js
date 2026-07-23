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
  Linking,
  TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme'
import { Modal, EmptyState, Badge } from '../../components/ui/index'
import * as DocumentPicker from 'expo-document-picker'
import { getAdminModules, getModuleDocuments, uploadDocument, createAdminModule, updateAdminModule, deleteAdminModule } from '../../services/services'
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

  // Module CRUD state
  const [moduleModalVisible, setModuleModalVisible] = useState(false)
  const [editingModule, setEditingModule] = useState(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('THEORY')
  const [requiredHours, setRequiredHours] = useState('1')
  const [saving, setSaving] = useState(false)

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

  function openCreateModal() {
    setEditingModule(null)
    setName('')
    setDescription('')
    setCategory('THEORY')
    setRequiredHours('1')
    setModuleModalVisible(true)
  }

  function openEditModal(mod) {
    setEditingModule(mod)
    setName(mod.name)
    setDescription(mod.description)
    setCategory(mod.category)
    setRequiredHours(mod.requiredHours?.toString() || '1')
    setModuleModalVisible(true)
  }

  async function handleSaveModule() {
    if (!name.trim() || !requiredHours.trim()) {
      Alert.alert(t('schools.err_title', 'Erreur'), 'Veuillez remplir les champs obligatoires.')
      return
    }
    
    try {
      setSaving(true)
      const payload = {
        name,
        description,
        category,
        requiredHours: parseInt(requiredHours, 10) || 1
      }
      
      if (editingModule) {
        await updateAdminModule(editingModule.id, payload)
        Alert.alert(t('schools.success_title', 'Succès'), 'Module mis à jour.')
      } else {
        await createAdminModule(payload)
        Alert.alert(t('schools.success_title', 'Succès'), 'Module créé.')
      }
      setModuleModalVisible(false)
      loadModules()
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), 'Impossible de sauvegarder le module.')
    } finally {
      setSaving(false)
    }
  }

  function handleDeleteModule(id) {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce module ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminModule(id)
            Alert.alert(t('schools.success_title', 'Succès'), 'Module supprimé.')
            loadModules()
          } catch (err) {
            Alert.alert(t('schools.err_title', 'Erreur'), 'Impossible de supprimer ce module.')
          }
        },
      },
    ])
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
        
        <TouchableOpacity onPress={openCreateModal} style={styles.headerAddBtn}>
          <Ionicons name="add" size={20} color={themeColors.textOnPrimary} />
          <Text style={styles.headerAddBtnText}>Ajouter</Text>
        </TouchableOpacity>
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
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity onPress={() => handleViewDocuments(item)} style={[styles.docsBtn, { flex: 1 }]}>
                  <Text style={styles.docsBtnText}><Ionicons name="folder-outline" size={14} color={themeColors.primary} /> {t('admin_modules.btn_docs')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openEditModal(item)} style={styles.editBtn}>
                  <Ionicons name="pencil" size={18} color={themeColors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteModule(item.id)} style={styles.deleteBtn}>
                  <Ionicons name="trash" size={18} color={themeColors.error} />
                </TouchableOpacity>
              </View>
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

      {/* Modal for Creating/Editing Module */}
      <Modal
        isVisible={moduleModalVisible}
        onClose={() => setModuleModalVisible(false)}
        title={editingModule ? 'Modifier le Module' : 'Créer un Module'}
      >
        <ScrollView style={{ maxHeight: 400 }}>
          <Text style={styles.label}>Nom du module *</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Ex: Code de la Route" />

          <Text style={styles.label}>Description</Text>
          <TextInput value={description} onChangeText={setDescription} style={[styles.input, { height: 60 }]} placeholder="Détails du module..." multiline />

          <Text style={styles.label}>Catégorie</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity onPress={() => setCategory('THEORY')} style={[styles.chip, category === 'THEORY' && styles.chipActive]}>
              <Text style={[styles.chipText, category === 'THEORY' && styles.chipTextActive]}>Théorie</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCategory('PRACTICAL')} style={[styles.chip, category === 'PRACTICAL' && styles.chipActive]}>
              <Text style={[styles.chipText, category === 'PRACTICAL' && styles.chipTextActive]}>Pratique</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Heures Requises *</Text>
          <TextInput value={requiredHours} onChangeText={setRequiredHours} keyboardType="numeric" style={styles.input} placeholder="Ex: 20" />

          <TouchableOpacity onPress={handleSaveModule} style={[styles.uploadBtn, { marginTop: 24, opacity: saving ? 0.7 : 1 }]} disabled={saving}>
            <Text style={styles.uploadBtnText}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#F9FAFB', padding: Spacing.lg, paddingBottom: 16 },
  headerTop: { flexDirection: 'row', marginBottom: 12 },
  backBtn: { padding: 4 },
  backBtnText: { color: themeColors.primary, fontWeight: '600', fontSize: 16 },
  title: { ...Typography.h2, color: themeColors.textPrimary, marginBottom: 4 },
  subtitle: { ...Typography.body, color: themeColors.textSecondary },
  list: { padding: Spacing.md },
  card: { 
    backgroundColor: '#FFF', 
    borderRadius: Radius.xl, 
    padding: Spacing.md, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.borderLight || '#F3F4F6',
    ...Shadows.sm,
  },
  cardContent: { marginBottom: 12 },
  moduleName: { ...Typography.h3, color: themeColors.textPrimary, marginBottom: 2 },
  moduleCategory: { ...Typography.small, color: themeColors.primary, fontWeight: '600', marginBottom: 6 },
  moduleDesc: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginBottom: 8 },
  moduleMeta: { ...Typography.caption, color: themeColors.textMuted },
  docsBtn: { 
    backgroundColor: '#FFF', 
    borderWidth: 1, 
    borderColor: themeColors.borderLight || '#E5E7EB', 
    borderRadius: Radius.lg, 
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
  headerAddBtn: { position: 'absolute', right: Spacing.lg, bottom: 20, backgroundColor: themeColors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full },
  headerAddBtnText: { color: themeColors.textOnPrimary, fontWeight: '600', marginLeft: 4, fontSize: 13 },
  editBtn: { padding: 10, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { padding: 10, backgroundColor: themeColors.errorLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  label: { ...Typography.smallMedium, color: themeColors.textPrimary, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: themeColors.border, borderRadius: Radius.sm, padding: 10, backgroundColor: themeColors.surface, fontSize: 14, color: themeColors.textPrimary },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border },
  chipActive: { backgroundColor: themeColors.primary, borderColor: themeColors.primary },
  chipText: { fontSize: 13, color: themeColors.textSecondary },
  chipTextActive: { color: themeColors.textOnPrimary, fontWeight: '700' },
})
