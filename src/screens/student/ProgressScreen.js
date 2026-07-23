import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSideMenu } from '../../context/SideMenuContext';
import { getStudentEnrollments, getStudentSessions } from '../../services/services';
import { Typography, Spacing, Radius, Shadows } from '../../utils/theme';

export function StudentProgressScreen() {
  const { Colors } = useTheme();
  const styles = getStyles(Colors);
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { openMenu } = useSideMenu();

  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedModule, setExpandedModule] = useState(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [enrollData, sessionData] = await Promise.all([
        getStudentEnrollments(user?.id),
        getStudentSessions(user?.id)
      ]);
      setEnrollments(Array.isArray(enrollData) ? enrollData : []);
      setSessions(Array.isArray(sessionData) ? sessionData : []);
    } catch (e) {
      console.log('Error fetching progress data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Global calculations
  const totalPurchasedHours = (enrollments || []).reduce((sum, e) => sum + (e.hoursPurchased || e.hours || 0), 0);
  const completedSessions = (sessions || []).filter(s => s.status === 'COMPLETED');
  const consumedFromEnrollments = (enrollments || []).reduce((sum, e) => sum + (e.hoursConsumed || 0), 0);
  const consumedFromSessions = completedSessions.reduce((acc, curr) => acc + (curr.durationHours || 1), 0);
  const totalConsumedHours = Math.max(consumedFromEnrollments, consumedFromSessions);
  
  const globalPct = totalPurchasedHours > 0 
    ? Math.min(100, Math.round((totalConsumedHours / totalPurchasedHours) * 100))
    : 0;

  // Next session
  const upcomingSessions = (sessions || []).filter(s => s.status !== 'COMPLETED' && s.status !== 'CANCELLED');
  const nextSession = upcomingSessions[0];

  // Dynamic module hours based on total purchased offer hours (e.g. 30h, 20h, etc.)
  const targetTotal = totalPurchasedHours > 0 ? totalPurchasedHours : 20;
  const m1Hours = Math.max(1, Math.round(targetTotal * 0.3));
  const m2Hours = Math.max(1, Math.round(targetTotal * 0.4));
  const m3Hours = Math.max(1, Math.round(targetTotal * 0.2));
  const m4Hours = Math.max(1, targetTotal - (m1Hours + m2Hours + m3Hours));

  // Competency Modules list
  const modules = [
    {
      id: 'm1',
      title: 'Module 1 : Maîtrise du véhicule',
      subtitle: 'Poste de conduite, volant, démarrage & changement de vitesses',
      icon: 'car-sport-outline',
      requiredHours: m1Hours,
      completedHours: Math.min(m1Hours, totalConsumedHours),
    },
    {
      id: 'm2',
      title: 'Module 2 : Signalisation & Circulation',
      subtitle: 'Intersections, priorités, ronds-points & insertion',
      icon: 'map-outline',
      requiredHours: m2Hours,
      completedHours: Math.max(0, Math.min(m2Hours, totalConsumedHours - m1Hours)),
    },
    {
      id: 'm3',
      title: 'Module 3 : Manœuvres & Autonomie',
      subtitle: 'Créneaux, stationnement, demi-tour & conduite de nuit/pluie',
      icon: 'navigate-outline',
      requiredHours: m3Hours,
      completedHours: Math.max(0, Math.min(m3Hours, totalConsumedHours - (m1Hours + m2Hours))),
    },
    {
      id: 'm4',
      title: 'Module 4 : Préparation à l’Examen Blanc',
      subtitle: 'Parcours autonome, questions de sécurité & bilan d’aptitude',
      icon: 'trophy-outline',
      requiredHours: m4Hours,
      completedHours: Math.max(0, Math.min(m4Hours, totalConsumedHours - (m1Hours + m2Hours + m3Hours))),
    },
  ];

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={openMenu} style={styles.iconBtn}>
            <Ionicons name="menu" size={26} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('student_progress.title', 'Ma Progression')}</Text>

          <TouchableOpacity onPress={() => fetchData(true)} style={styles.iconBtn}>
            <Ionicons name="refresh-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {t('student_progress.subtitle', 'Suivez vos avancées et la validation de vos compétences')}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement de votre progression...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchData(true)}
              tintColor={Colors.primary}
            />
          }
        >
          {/* Hero Overview Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.gaugeContainer}>
                <Text style={styles.gaugePct}>{globalPct}%</Text>
                <Text style={styles.gaugeSub}>Complété</Text>
              </View>

              <View style={styles.heroStatsGrid}>
                <View style={styles.heroStatItem}>
                  <Ionicons name="time-outline" size={18} color={Colors.primary} />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.heroStatVal}>{totalConsumedHours}h / {totalPurchasedHours}h</Text>
                    <Text style={styles.heroStatLbl}>Heures effectuées</Text>
                  </View>
                </View>

                <View style={styles.heroStatItem}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.heroStatVal}>{completedSessions.length} cours</Text>
                    <Text style={styles.heroStatLbl}>Séances validées</Text>
                  </View>
                </View>

                <View style={styles.heroStatItem}>
                  <Ionicons name="school-outline" size={18} color="#3B82F6" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.heroStatVal}>{enrollments.length} formation{enrollments.length > 1 ? 's' : ''}</Text>
                    <Text style={styles.heroStatLbl}>Inscriptions actives</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Global Progress Bar */}
            <View style={styles.heroProgressBg}>
              <View style={[styles.heroProgressFill, { width: `${globalPct}%` }]} />
            </View>
          </View>

          {/* Section: Formations / Enrolments */}
          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Mes Inscriptions & Offres</Text>
          </View>

          {enrollments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucune inscription enregistrée</Text>
              <Text style={styles.emptyText}>Souscrivez à une offre d'auto-école pour suivre votre progression ici.</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('StudentExplore')}
              >
                <Text style={styles.emptyBtnText}>Explorer les auto-écoles</Text>
              </TouchableOpacity>
            </View>
          ) : (
            enrollments.map((item, index) => {
              const total = item.hoursPurchased || item.hours || 20;
              const consumed = item.hoursConsumed || 0;
              const pct = total > 0 ? Math.min(100, Math.round((consumed / total) * 100)) : 0;
              const isPending = item.status === 'PENDING';

              return (
                <View key={item.id || index} style={styles.enrollmentCard}>
                  {/* Top Bar: School & Status */}
                  <View style={styles.enrollmentHeader}>
                    <View style={styles.schoolInfo}>
                      <View style={styles.schoolIconBadge}>
                        <Ionicons name="business" size={16} color={Colors.primary} />
                      </View>
                      <Text style={styles.schoolName} numberOfLines={1}>
                        {item.schoolName || 'Drissman Auto-école'}
                      </Text>
                    </View>

                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: isPending ? '#FEF3C7' : '#D1FAE5' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: isPending ? '#D97706' : '#059669' }
                      ]}>
                        {isPending ? 'En attente' : 'Actif'}
                      </Text>
                    </View>
                  </View>

                  {/* Main Offer Title */}
                  <Text style={styles.offerTitle}>{item.offerName || 'Offre Permis'}</Text>

                  {/* Progress Bar & Label */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={styles.pctBadge}>{pct}%</Text>
                  </View>

                  <View style={styles.hoursDetailRow}>
                    <Text style={styles.hoursText}>
                      <Text style={{ fontWeight: '700', color: Colors.textPrimary }}>{consumed}h</Text> / {total}h effectuées
                    </Text>
                    <Text style={styles.remainingText}>
                      Reste {Math.max(0, total - consumed)}h
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    {isPending ? (
                      <TouchableOpacity
                        style={styles.actionBtnWarning}
                        onPress={() => navigation.navigate('StudentPayments')}
                      >
                        <Ionicons name="card-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnTextWhite}>Régulariser le paiement</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.actionBtnOutline}
                        onPress={() => navigation.navigate('StudentPlanning')}
                      >
                        <Ionicons name="calendar-outline" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnTextOutline}>Réserver un cours</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}

          {/* Section: Modules REMC Pedagogy */}
          <View style={styles.sectionHeader}>
            <Ionicons name="layers-outline" size={20} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Programme & Étapes de Formation</Text>
          </View>

          <View style={styles.modulesContainer}>
            {modules.map((mod) => {
              const modPct = Math.min(100, Math.round((mod.completedHours / mod.requiredHours) * 100));
              const isDone = modPct === 100;
              const isExpanded = expandedModule === mod.id;

              return (
                <TouchableOpacity
                  key={mod.id}
                  style={[styles.moduleCard, isDone && styles.moduleCardDone]}
                  onPress={() => setExpandedModule(isExpanded ? null : mod.id)}
                  activeOpacity={0.85}
                >
                  <View style={styles.moduleHeader}>
                    <View style={[styles.moduleIconBadge, { backgroundColor: isDone ? '#D1FAE5' : '#FEF3C7' }]}>
                      <Ionicons
                        name={isDone ? "checkmark-done" : mod.icon}
                        size={20}
                        color={isDone ? "#059669" : "#D97706"}
                      />
                    </View>

                    <View style={styles.moduleTextGroup}>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleSubtitle} numberOfLines={1}>{mod.subtitle}</Text>
                    </View>

                    <Text style={[styles.modulePct, { color: isDone ? "#059669" : Colors.primary }]}>
                      {modPct}%
                    </Text>
                  </View>

                  <View style={styles.moduleTrack}>
                    <View style={[
                      styles.moduleFill,
                      { width: `${modPct}%`, backgroundColor: isDone ? "#10B981" : Colors.primary }
                    ]} />
                  </View>

                  {isExpanded && (
                    <View style={styles.moduleExpandContent}>
                      <Text style={styles.moduleDesc}>{mod.subtitle}</Text>
                      <View style={styles.moduleMetaRow}>
                        <Text style={styles.moduleMetaText}>
                          Heures recommandées : <Text style={{ fontWeight: '700' }}>{mod.requiredHours}h</Text>
                        </Text>
                        <Text style={styles.moduleMetaText}>
                          Validé : <Text style={{ fontWeight: '700' }}>{mod.completedHours}h</Text>
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Section: Next Lesson Banner */}
          {nextSession && (
            <View style={styles.nextSessionCard}>
              <View style={styles.nextSessionBadge}>
                <Ionicons name="sparkles" size={16} color="#FFF" />
                <Text style={styles.nextSessionBadgeText}>Prochain cours à venir</Text>
              </View>

              <Text style={styles.nextSessionTitle}>{nextSession.title || 'Séance de conduite'}</Text>
              <Text style={styles.nextSessionMeta}>
                🗓️ {nextSession.date} • 🕒 {nextSession.startTime}
              </Text>
              {nextSession.monitorName && (
                <Text style={styles.nextSessionMonitor}>
                  👨‍🏫 Moniteur : {nextSession.monitorName}
                </Text>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const getStyles = (Colors) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: '#0A0F1E',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerSubtitle: {
    ...Typography.small,
    color: '#9CA3AF',
    marginTop: 4,
  },
  iconBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: '#1F2D40',
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  
  // Hero Card
  heroCard: {
    backgroundColor: '#151D2E',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    borderColor: '#1F2D40',
    borderWidth: 1,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  gaugeContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 5,
    borderColor: Colors.primary,
    backgroundColor: '#0A0F1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  gaugePct: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.primary,
  },
  gaugeSub: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  heroStatsGrid: {
    flex: 1,
    gap: 8,
  },
  heroStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0F1E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  heroStatVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9FAFB',
  },
  heroStatLbl: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  heroProgressBg: {
    height: 10,
    backgroundColor: '#0A0F1E',
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  heroProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },

  // Section Headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
    gap: 8,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '700',
  },

  // Enrollment Card
  enrollmentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  enrollmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  schoolIconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  schoolName: {
    ...Typography.smallMedium,
    color: Colors.textSecondary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  offerTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginVertical: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginRight: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  pctBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primaryDark || Colors.textPrimary,
  },
  hoursDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: Spacing.sm,
  },
  hoursText: {
    ...Typography.small,
    color: Colors.textSecondary,
  },
  remainingText: {
    ...Typography.small,
    color: Colors.textMuted,
  },
  cardActionsRow: {
    marginTop: Spacing.xs,
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  actionBtnTextOutline: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  actionBtnWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#EF4444',
  },
  actionBtnTextWhite: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Modules List
  modulesContainer: {
    gap: 10,
    marginBottom: Spacing.lg,
  },
  moduleCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  moduleCardDone: {
    borderColor: '#10B98140',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  moduleTextGroup: {
    flex: 1,
    marginRight: 8,
  },
  moduleTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  moduleSubtitle: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modulePct: {
    fontSize: 13,
    fontWeight: '800',
  },
  moduleTrack: {
    height: 6,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    marginTop: 10,
    overflow: 'hidden',
  },
  moduleFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
  moduleExpandContent: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  moduleDesc: {
    ...Typography.small,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  moduleMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moduleMetaText: {
    ...Typography.caption,
    color: Colors.textMuted,
  },

  // Next session card
  nextSessionCard: {
    backgroundColor: '#0A0F1E',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '60',
  },
  nextSessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: 8,
    gap: 4,
  },
  nextSessionBadgeText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
  nextSessionTitle: {
    ...Typography.h3,
    color: '#FFF',
    fontWeight: '800',
    marginBottom: 4,
  },
  nextSessionMeta: {
    ...Typography.bodyMedium,
    color: '#D1D5DB',
    marginBottom: 4,
  },
  nextSessionMonitor: {
    ...Typography.small,
    color: '#9CA3AF',
  },

  // Empty state
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: 4,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  emptyBtnText: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});

export default StudentProgressScreen;
