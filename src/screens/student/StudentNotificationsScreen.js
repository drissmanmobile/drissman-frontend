import { useTheme } from '../../context/ThemeContext'
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../utils/theme';

export default function StudentNotificationsScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation();
  // Simuler des notifications pour l'instant (car l'API pour récupérer les notifs n'est pas encore créée)
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: t('notifications.course_title'),
      message: t('notifications.course_msg'),
      date: t('notifications.today'),
      read: false,
      type: 'course',
    },
    {
      id: '2',
      title: t('notifications.payment_title'),
      message: t('notifications.payment_msg'),
      date: t('notifications.yesterday'),
      read: false,
      type: 'payment',
    },
    {
      id: '3',
      title: t('notifications.exam_title'),
      message: t('notifications.exam_msg'),
      date: '05 Juil',
      read: true,
      type: 'exam',
    },
    {
      id: '4',
      title: t('notifications.admin_title'),
      message: t('notifications.admin_msg'),
      date: '01 Juil',
      read: true,
      type: 'admin',
    },
  ]);

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const getIconForType = (type) => {
    switch(type) {
      case 'course': return 'car-outline';
      case 'payment': return 'card-outline';
      case 'exam': return 'document-text-outline';
      case 'admin': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const getColorForType = (type) => {
    switch(type) {
      case 'course': return '#10B981';
      case 'payment': return '#F59E0B';
      case 'exam': return '#8B5CF6';
      case 'admin': return '#3B82F6';
      default: return themeColors.primary;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationCard, !item.read && styles.unreadCard]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getColorForType(item.type) + '20' }]}>
        <Ionicons name={getIconForType(item.type)} size={24} color={getColorForType(item.type)} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title}</Text>
          <Text style={styles.date}>{item.date}</Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <Text style={styles.subtitle}>{t('notifications.title')}</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllText}>{t('notifications.mark_all_read')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={themeColors.textMuted} />
            <Text style={styles.emptyText}>{t('notifications.empty_title')}</Text>
            <Text style={styles.emptySubText}>{t('notifications.empty_msg')}</Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  subtitle: {
    ...Typography.bodyMedium,
    color: themeColors.textMuted,
    fontWeight: '500',
  },
  markAllText: {
    ...Typography.bodyMedium,
    color: themeColors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: Spacing.md,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: themeColors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'flex-start',
    ...Shadows.sm,
  },
  unreadCard: {
    backgroundColor: '#F3F4F6', // Lighter background for unread
    borderLeftWidth: 3,
    borderLeftColor: themeColors.primary,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    ...Typography.bodyLarge,
    color: themeColors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  unreadText: {
    fontWeight: '700',
    color: themeColors.dark,
  },
  date: {
    ...Typography.bodySmall,
    color: themeColors.textMuted,
    marginLeft: Spacing.sm,
  },
  message: {
    ...Typography.bodyMedium,
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.primary,
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    ...Typography.h3,
    color: themeColors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySubText: {
    ...Typography.bodyLarge,
    color: themeColors.textMuted,
    marginTop: Spacing.sm,
  },
});
