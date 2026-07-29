import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import RNModal from 'react-native-modal'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { Typography, Spacing, Radius, Shadows } from '../../utils/theme'

export default function WhatsNewModal({ isVisible, onClose, features = [] }) {
  const { Colors: themeColors } = useTheme()
  const styles = getStyles(themeColors)

  const defaultFeatures = [
    {
      id: '1',
      tag: 'NOUVEAUTÉ',
      tagColor: '#1A73E8',
      icon: 'sparkles',
      title: 'Navigation & Interface Chrome',
      description: 'Découvrez la toute nouvelle interface inspirée de Google Chrome avec typographie Google Sans et thèmes dynamiques.',
    },
    {
      id: '2',
      tag: 'AMÉLIORATION',
      tagColor: '#138347',
      icon: 'speedometer-outline',
      title: 'Planning en temps réel',
      description: 'Vos cours de conduite et créneaux sont synchronisés instantanément avec notifications push intelligentes.',
    },
    {
      id: '3',
      tag: 'FONCTIONNALITÉ',
      tagColor: '#8E24AA',
      icon: 'school-outline',
      title: 'Quiz Code IA & Auto-évaluation',
      description: 'Entraînez-vous au Code de la route avec le générateur de questions assisté par IA.',
    },
  ]

  const featureList = features.length > 0 ? features : defaultFeatures

  return (
    <RNModal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.4}
    >
      <View style={styles.container}>
        {/* Chrome chrome://whats-new/ style Header Banner */}
        <View style={styles.header}>
          <View style={styles.chromeBadge}>
            <Ionicons name="logo-chrome" size={24} color="#4285F4" />
            <Text style={styles.chromeBadgeText}>Nouveautés Drissman</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainTitle}>Qu'y a-t-il de neuf ?</Text>
          <Text style={styles.subtitle}>
            Explorez les dernières mises à jour et améliorations pour votre auto-école.
          </Text>

          {featureList.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.pillTag, { backgroundColor: item.tagColor + '15' }]}>
                  <Text style={[styles.pillTagText, { color: item.tagColor }]}>{item.tag}</Text>
                </View>
              </View>
              <View style={styles.cardBody}>
                <View style={[styles.iconContainer, { backgroundColor: themeColors.borderLight }]}>
                  <Ionicons name={item.icon || 'star'} size={24} color={item.tagColor || themeColors.primary} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.primaryButtonText}>J'ai compris</Text>
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  )
}

const getStyles = (themeColors) =>
  StyleSheet.create({
    modal: {
      margin: 0,
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: themeColors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      maxHeight: '88%',
      ...Shadows.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    chromeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    chromeBadgeText: {
      ...Typography.h4,
      color: themeColors.textPrimary,
      fontWeight: '700',
    },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.borderLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
    },
    mainTitle: {
      ...Typography.h1,
      fontSize: 26,
      color: themeColors.textPrimary,
      marginTop: Spacing.sm,
    },
    subtitle: {
      ...Typography.body,
      color: themeColors.textSecondary,
      marginTop: 4,
      marginBottom: Spacing.lg,
    },
    card: {
      backgroundColor: themeColors.background,
      borderRadius: Radius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: themeColors.border,
      ...Shadows.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      marginBottom: Spacing.sm,
    },
    pillTag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: Radius.full,
    },
    pillTagText: {
      ...Typography.smallMedium,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    cardBody: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    iconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    textContainer: {
      flex: 1,
    },
    cardTitle: {
      ...Typography.h4,
      fontSize: 16,
      color: themeColors.textPrimary,
      marginBottom: 4,
    },
    cardDescription: {
      ...Typography.body,
      fontSize: 13,
      color: themeColors.textSecondary,
      lineHeight: 19,
    },
    footer: {
      padding: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: themeColors.border,
      backgroundColor: themeColors.surface,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
    },
    primaryButton: {
      backgroundColor: '#1A73E8', // Chrome primary blue accent
      borderRadius: Radius.full,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      ...Typography.bodyMedium,
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 15,
    },
  })
