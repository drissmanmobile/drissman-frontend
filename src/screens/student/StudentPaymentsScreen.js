import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as WebBrowser from 'expo-web-browser';
import { getMyPayments, initiatePayment, refreshPayment, getStudentEnrollments } from '../../services/services';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from 'react-native-modal';
import { TextInput } from 'react-native';

export default function StudentPaymentsScreen() {
  const { Colors } = useTheme();
  const styles = getStyles(Colors);
  const { t } = useTranslation();

  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal d'initiation de paiement
  const [isPaymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPayments = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [data, enrollmentsData] = await Promise.all([
        getMyPayments(),
        getStudentEnrollments()
      ]);
      
      // On rafraîchit automatiquement les factures PENDING
      const pendingInvoices = data.filter(p => p.status === 'PENDING');
      for (const invoice of pendingInvoices) {
        try {
          await refreshPayment(invoice.id);
        } catch (e) {
          console.log('Error auto-refreshing payment:', e.message);
        }
      }
      
      // On recharge la liste si on a fait des auto-refresh
      const finalData = pendingInvoices.length > 0 ? await getMyPayments() : data;
      setPayments(finalData);
      setEnrollments(enrollmentsData);
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', error.message || 'Impossible de récupérer les paiements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const handleOpenCheckout = async (url) => {
    if (!url) {
      Alert.alert('Erreur', 'Lien de paiement indisponible. Veuillez actualiser.');
      return;
    }
    await WebBrowser.openBrowserAsync(url);
    // Rafraîchir au retour
    fetchPayments();
  };

  const handleManualRefresh = async (id) => {
    try {
      setLoading(true);
      await refreshPayment(id);
      await fetchPayments();
    } catch (error) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Erreur', 'Veuillez choisir un moyen de paiement.');
      return;
    }
    if ((selectedMethod === 'MTN_MOMO' || selectedMethod === 'ORANGE_MONEY') && !phoneNumber) {
      Alert.alert('Erreur', 'Le numéro de téléphone est requis pour le Mobile Money.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await initiatePayment({
        enrollmentId: selectedEnrollmentId,
        method: selectedMethod,
        phone: phoneNumber
      });
      setPaymentModalVisible(false);
      if (res.checkoutUrl) {
        await handleOpenCheckout(res.checkoutUrl);
      } else {
        await fetchPayments();
      }
    } catch (error) {
      Alert.alert('Erreur', error.message || 'Impossible d\'initier le paiement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPaymentItem = ({ item }) => {
    const isPending = item.status === 'PENDING';
    const isPaid = item.status === 'PAID';
    const isFailed = item.status === 'FAILED';

    let statusColor = Colors.textMuted;
    let statusText = 'Inconnu';
    if (isPending) {
      statusColor = '#F59E0B';
      statusText = 'En attente';
    } else if (isPaid) {
      statusColor = '#10B981';
      statusText = 'Payé';
    } else if (isFailed) {
      statusColor = '#EF4444';
      statusText = 'Échoué';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.reference}>{item.reference || 'Facture'}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.amount}>{item.amount} XAF</Text>
          <Text style={styles.date}>
            Créé le {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy, HH:mm', { locale: fr }) : '—'}
          </Text>
          <Text style={styles.method}>
            Moyen de paiement : {item.method || 'Non spécifié'}
          </Text>
        </View>

        {isPending && (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => handleManualRefresh(item.id)}
            >
              <Ionicons name="refresh" size={16} color={Colors.primary} />
              <Text style={styles.actionBtnTextOutline}>Actualiser</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionBtnSolid}
              onPress={() => {
                if (item.checkoutUrl) {
                  handleOpenCheckout(item.checkoutUrl);
                } else {
                  setSelectedEnrollmentId(item.enrollmentId);
                  setSelectedMethod(item.method || null);
                  setPaymentModalVisible(true);
                }
              }}
            >
              <Ionicons name="card" size={16} color="#fff" />
              <Text style={styles.actionBtnTextSolid}>Payer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const unpaidEnrollments = enrollments.filter(e => 
    e.status === 'PENDING' && 
    !payments.some(p => p.enrollmentId === e.id && (p.status === 'PENDING' || p.status === 'PAID'))
  );

  const renderUnpaidEnrollmentItem = (item) => (
    <View key={item.id} style={[styles.card, { borderColor: Colors.primary, borderWidth: 1 }]}>
      <View style={styles.cardHeader}>
        <Text style={styles.reference}>Inscription : {item.offerName || 'Offre'}</Text>
        <View style={[styles.statusBadge, { backgroundColor: '#EF444420' }]}>
          <Text style={[styles.statusText, { color: '#EF4444' }]}>À payer</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.amount}>{item.price} XAF</Text>
        <Text style={styles.method}>Veuillez générer une facture pour valider votre inscription.</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.actionBtnSolid}
          onPress={() => {
            setSelectedEnrollmentId(item.id);
            setPaymentModalVisible(true);
          }}
        >
          <Ionicons name="card" size={16} color="#fff" />
          <Text style={styles.actionBtnTextSolid}>Initier le paiement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Paiements</Text>
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={Colors.primary} />
      ) : (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          renderItem={renderPaymentItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPayments(true)} tintColor={Colors.primary} />
          }
          ListHeaderComponent={
            unpaidEnrollments.length > 0 ? (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: Colors.textSecondary }}>À régler</Text>
                {unpaidEnrollments.map(renderUnpaidEnrollmentItem)}
                <Text style={{ fontWeight: 'bold', fontSize: 16, marginTop: 16, marginBottom: 8, color: Colors.textSecondary }}>Historique</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucune facture trouvée.</Text>
            </View>
          }
        />
      )}

      {/* Modal d'initiation au cas où le flux nécessiterait de générer une facture pour une inscription */}
      <Modal
        isVisible={isPaymentModalVisible}
        onBackdropPress={() => !isSubmitting && setPaymentModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choisir le moyen de paiement</Text>
          
          <TouchableOpacity 
            style={[styles.methodBtn, selectedMethod === 'CARD' && styles.methodBtnSelected]} 
            onPress={() => setSelectedMethod('CARD')}
          >
            <Ionicons name="card-outline" size={24} color={selectedMethod === 'CARD' ? Colors.primary : Colors.textPrimary} />
            <Text style={[styles.methodText, selectedMethod === 'CARD' && styles.methodTextSelected]}>Carte Bancaire (Stripe)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodBtn, selectedMethod === 'MTN_MOMO' && styles.methodBtnSelected]} 
            onPress={() => setSelectedMethod('MTN_MOMO')}
          >
            <Ionicons name="phone-portrait-outline" size={24} color={selectedMethod === 'MTN_MOMO' ? Colors.primary : Colors.textPrimary} />
            <Text style={[styles.methodText, selectedMethod === 'MTN_MOMO' && styles.methodTextSelected]}>MTN Mobile Money</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.methodBtn, selectedMethod === 'ORANGE_MONEY' && styles.methodBtnSelected]} 
            onPress={() => setSelectedMethod('ORANGE_MONEY')}
          >
            <Ionicons name="phone-portrait-outline" size={24} color={selectedMethod === 'ORANGE_MONEY' ? Colors.primary : Colors.textPrimary} />
            <Text style={[styles.methodText, selectedMethod === 'ORANGE_MONEY' && styles.methodTextSelected]}>Orange Money</Text>
          </TouchableOpacity>

          {(selectedMethod === 'MTN_MOMO' || selectedMethod === 'ORANGE_MONEY') && (
            <TextInput
              style={styles.input}
              placeholder="Numéro de téléphone (ex: 6XXXXXXXX)"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          )}

          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]} 
            onPress={submitPayment}
            disabled={isSubmitting}
          >
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Payer</Text>}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight || '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight || '#F3F4F6',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reference: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBody: {
    marginBottom: 16,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  method: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 4,
  },
  actionBtnTextOutline: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  actionBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    gap: 4,
  },
  actionBtnTextSolid: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textMuted,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  methodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    gap: 12,
  },
  methodBtnSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  methodText: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  methodTextSelected: {
    color: Colors.primary,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.textPrimary,
    marginBottom: 16,
    marginTop: 8,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
