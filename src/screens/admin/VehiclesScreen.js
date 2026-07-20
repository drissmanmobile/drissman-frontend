import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme';
import { Badge, Modal, Button, EmptyState } from '../../components/ui/index';
import { getAdminVehicles, createAdminVehicle, updateAdminVehicle, deleteAdminVehicle } from '../../services/services';

export default function AdminVehiclesScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation();
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [transmission, setTransmission] = useState('MANUAL');
  const [status, setStatus] = useState('ACTIVE');
  const [showTransmissionPicker, setShowTransmissionPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  async function loadVehicles() {
    try {
      setLoading(true);
      const data = await getAdminVehicles();
      setVehicles(data);
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), 'Erreur lors du chargement des véhicules.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingVehicle(null);
    setBrand('');
    setModel('');
    setRegistrationNumber('');
    setTransmission('MANUAL');
    setStatus('ACTIVE');
    setModalVisible(true);
  }

  function openEditModal(vehicle) {
    setEditingVehicle(vehicle);
    setBrand(vehicle.brand);
    setModel(vehicle.model);
    setRegistrationNumber(vehicle.registrationNumber);
    setTransmission(vehicle.transmission || 'MANUAL');
    setStatus(vehicle.status || 'ACTIVE');
    setModalVisible(true);
  }

  async function handleSave() {
    if (!brand.trim() || !model.trim() || !registrationNumber.trim()) {
      Alert.alert(t('schools.err_title', 'Erreur'), 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    try {
      setSaving(true);
      const vehicleData = {
        brand,
        model,
        registrationNumber,
        transmission,
        status,
      };
      
      if (editingVehicle) {
        await updateAdminVehicle(editingVehicle.id, vehicleData);
        Alert.alert(t('schools.success_title', 'Succès'), 'Véhicule mis à jour.');
      } else {
        await createAdminVehicle(vehicleData);
        Alert.alert(t('schools.success_title', 'Succès'), 'Véhicule ajouté.');
      }
      setModalVisible(false);
      loadVehicles();
    } catch (err) {
      Alert.alert(t('schools.err_title', 'Erreur'), 'Erreur lors de la sauvegarde du véhicule.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert('Supprimer', 'Voulez-vous vraiment supprimer ce véhicule ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAdminVehicle(id);
            Alert.alert(t('schools.success_title', 'Succès'), 'Véhicule supprimé.');
            loadVehicles();
          } catch (err) {
            Alert.alert(t('schools.err_title', 'Erreur'), 'Impossible de supprimer ce véhicule.');
          }
        },
      },
    ]);
  }

  function handleOptions(item) {
    Alert.alert(
      'Options',
      'Choisissez une action',
      [
        { text: 'Modifier', onPress: () => openEditModal(item) },
        { text: 'Supprimer', style: 'destructive', onPress: () => handleDelete(item.id) },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  }

  const getStatusColor = (s) => {
    switch (s) {
      case 'ACTIVE': return themeColors.success;
      case 'IN_MAINTENANCE': return themeColors.warning;
      case 'INACTIVE': return themeColors.error;
      default: return themeColors.textMuted;
    }
  };

  const getStatusLabel = (s) => {
    switch (s) {
      case 'ACTIVE': return 'Actif';
      case 'IN_MAINTENANCE': return 'En maintenance';
      case 'INACTIVE': return 'Inactif';
      default: return s;
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingRight: 16 }}>
          <Ionicons name="arrow-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Flotte (Véhicules)</Text>
          <Text style={styles.subtitle}>Gérez vos véhicules</Text>
        </View>
        <TouchableOpacity onPress={openCreateModal} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>+ Ajouter</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={themeColors.primary} />
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, Shadows.sm]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vehicleName}>{item.brand} {item.model}</Text>
                  <Text style={styles.vehicleReg}>{item.registrationNumber}</Text>
                </View>
                <TouchableOpacity onPress={() => handleOptions(item)} style={styles.editBtn}>
                  <Ionicons name="ellipsis-horizontal" size={24} color={themeColors.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.cardFooter}>
                <View style={[styles.badge, { backgroundColor: themeColors.borderLight }]}>
                  <Ionicons name="settings-outline" size={12} color={themeColors.textSecondary} />
                  <Text style={styles.badgeText}>{item.transmission === 'MANUAL' ? 'Manuelle' : 'Automatique'}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                  <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{getStatusLabel(item.status)}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<EmptyState message="Aucun véhicule trouvé." icon={<Ionicons name="car-sport" size={48} color={themeColors.primary} />} />}
        />
      )}

      {/* Modal */}
      <Modal isVisible={modalVisible} onClose={() => setModalVisible(false)} title={editingVehicle ? 'Modifier le véhicule' : 'Ajouter un véhicule'}>
        <ScrollView style={{ maxHeight: 450 }}>
          <Text style={styles.label}>Marque</Text>
          <TextInput value={brand} onChangeText={setBrand} style={styles.input} placeholder="ex: Peugeot" />

          <Text style={styles.label}>Modèle</Text>
          <TextInput value={model} onChangeText={setModel} style={styles.input} placeholder="ex: 208" />

          <Text style={styles.label}>Immatriculation</Text>
          <TextInput value={registrationNumber} onChangeText={setRegistrationNumber} style={styles.input} placeholder="ex: AB-123-CD" autoCapitalize="characters" />

          <Text style={styles.label}>Transmission</Text>
          <TouchableOpacity style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between' }]} onPress={() => setShowTransmissionPicker(true)}>
            <Text style={{ color: themeColors.textPrimary }}>{transmission === 'MANUAL' ? 'Manuelle' : 'Automatique'}</Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <Text style={styles.label}>Statut</Text>
          <TouchableOpacity style={[styles.input, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl }]} onPress={() => setShowStatusPicker(true)}>
            <Text style={{ color: getStatusColor(status) }}>{getStatusLabel(status)}</Text>
            <Ionicons name="chevron-down" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>

          <Button onPress={handleSave} loading={saving} style={{ marginBottom: Spacing.xl }}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </ScrollView>
      </Modal>

      {/* Picker Transmision */}
      <Modal isVisible={showTransmissionPicker} onClose={() => setShowTransmissionPicker(false)} title="Sélectionner la transmission">
        <TouchableOpacity style={styles.pickerOption} onPress={() => { setTransmission('MANUAL'); setShowTransmissionPicker(false); }}>
          <Text style={[styles.pickerOptionText, transmission === 'MANUAL' && { color: themeColors.primary, fontWeight: 'bold' }]}>Manuelle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerOption} onPress={() => { setTransmission('AUTOMATIC'); setShowTransmissionPicker(false); }}>
          <Text style={[styles.pickerOptionText, transmission === 'AUTOMATIC' && { color: themeColors.primary, fontWeight: 'bold' }]}>Automatique</Text>
        </TouchableOpacity>
      </Modal>

      {/* Picker Status */}
      <Modal isVisible={showStatusPicker} onClose={() => setShowStatusPicker(false)} title="Sélectionner le statut">
        <TouchableOpacity style={styles.pickerOption} onPress={() => { setStatus('ACTIVE'); setShowStatusPicker(false); }}>
          <Text style={[styles.pickerOptionText, status === 'ACTIVE' && { color: themeColors.success, fontWeight: 'bold' }]}>Actif</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerOption} onPress={() => { setStatus('IN_MAINTENANCE'); setShowStatusPicker(false); }}>
          <Text style={[styles.pickerOptionText, status === 'IN_MAINTENANCE' && { color: themeColors.warning, fontWeight: 'bold' }]}>En maintenance</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.pickerOption} onPress={() => { setStatus('INACTIVE'); setShowStatusPicker(false); }}>
          <Text style={[styles.pickerOptionText, status === 'INACTIVE' && { color: themeColors.error, fontWeight: 'bold' }]}>Inactif</Text>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.h2, color: themeColors.textPrimary },
  subtitle: { ...Typography.bodyMedium, color: themeColors.textSecondary },
  actionBtn: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  actionBtnText: { color: themeColors.textOnPrimary, fontWeight: '600', fontSize: 13 },
  list: { padding: Spacing.lg },
  card: {
    backgroundColor: themeColors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vehicleName: { ...Typography.h4, color: themeColors.textPrimary },
  vehicleReg: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginTop: 2, fontFamily: 'monospace' },
  editBtn: { padding: 4 },
  cardFooter: { flexDirection: 'row', marginTop: 12, gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: themeColors.textSecondary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  label: { ...Typography.bodyMedium, color: themeColors.textPrimary, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: themeColors.background,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.sm,
    fontSize: 15,
    color: themeColors.textPrimary,
  },
  pickerOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderLight,
  },
  pickerOptionText: { fontSize: 16, color: themeColors.textPrimary },
});
