// src/components/ui/SideMenu.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import Modal from 'react-native-modal';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSideMenu } from '../../context/SideMenuContext';
import { Typography, Spacing, Colors } from '../../utils/theme';
import { useNavigation } from '@react-navigation/native';

export default function SideMenu() {
  const { isMenuOpen, closeMenu } = useSideMenu();
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme, Colors: themeColors } = useTheme();
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

  const styles = getStyles(themeColors);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
  };

  const navigateTo = (screen) => {
    closeMenu();
    if (typeof screen === 'string') {
      navigation.navigate(screen);
    } else if (screen && screen.name) {
      navigation.navigate(screen.name, screen.params);
    }
  };

  const renderMenuItems = () => {
    const items = [];

    // Common Profile link based on role
    if (user?.role === 'STUDENT') {
      items.push({ label: t('navigation.profile', 'Mon Profil'), icon: 'person-outline', onPress: () => navigateTo('StudentProfile') });
    } else if (user?.role === 'SCHOOL_ADMIN' || user?.role === 'SUPER_ADMIN') {
      items.push({ label: t('navigation.profile', 'Mon Profil'), icon: 'person-outline', onPress: () => navigateTo('AdminProfile') });
    } else if (user?.role === 'MONITOR') {
      items.push({ label: t('navigation.profile', 'Mon Profil'), icon: 'person-outline', onPress: () => navigateTo('InstructorProfile') });
    }

    return items.map((item, index) => (
      <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
        <Ionicons name={item.icon} size={24} color={themeColors.textPrimary} style={styles.menuIcon} />
        <Text style={styles.menuText}>{item.label}</Text>
      </TouchableOpacity>
    ));
  };

  return (
    <Modal
      isVisible={isMenuOpen}
      onBackdropPress={closeMenu}
      onBackButtonPress={closeMenu}
      animationIn="slideInLeft"
      animationOut="slideOutLeft"
      style={styles.modal}
      backdropOpacity={0.5}
      useNativeDriver={true}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appName}>Drissman</Text>
          <Text style={styles.tagline}>{t('app.tagline', 'Votre auto-école de poche')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderMenuItems()}

          <View style={styles.divider} />

          {/* Settings Section */}
          <Text style={styles.sectionTitle}>{t('settings.title', 'Paramètres')}</Text>

          <TouchableOpacity style={styles.menuItem} onPress={toggleLanguage}>
            <Ionicons name="language-outline" size={24} color={themeColors.textPrimary} style={styles.menuIcon} />
            <Text style={styles.menuText}>
              {i18n.language === 'fr' ? 'English' : 'Français'}
            </Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Ionicons name={isDarkMode ? 'moon' : 'sunny-outline'} size={24} color={themeColors.textPrimary} style={styles.menuIcon} />
            <Text style={styles.menuText}>{t('settings.dark_mode', 'Mode sombre')}</Text>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: themeColors.primary }}
              thumbColor={'#f4f3f4'}
              style={{ marginLeft: 'auto' }}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={[styles.menuItem, { marginTop: 'auto' }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={themeColors.error || '#EF4444'} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: themeColors.error || '#EF4444' }]}>
              {t('settings.logout', 'Déconnexion')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const getStyles = (themeColors) => StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-start',
  },
  container: {
    width: '80%',
    height: '100%',
    backgroundColor: themeColors.background,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: themeColors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: Spacing.lg,
  },
  appName: {
    ...Typography.h2,
    color: '#FFF',
    marginBottom: 4,
  },
  tagline: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollContent: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuText: {
    ...Typography.bodyMedium,
    color: themeColors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.borderLight,
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.caption,
    color: themeColors.textSecondary,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
