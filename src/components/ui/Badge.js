import { useTheme } from '../../context/ThemeContext'
import { View, Text, StyleSheet } from 'react-native'
import { Colors, Radius } from '../../utils/theme'

const getStatusMap = (themeColors) => ({
  SCHEDULED: { label: 'Planifiée', bg: themeColors.infoLight, text: themeColors.info },
  COMPLETED: { label: 'Terminée', bg: themeColors.successLight, text: themeColors.success },
  CANCELLED: { label: 'Annulée', bg: themeColors.errorLight, text: themeColors.error },
  ACTIVE: { label: 'Active', bg: themeColors.successLight, text: themeColors.success },
  PENDING: { label: 'En attente', bg: themeColors.warningLight, text: themeColors.warning },
  INACTIVE: { label: 'Inactive', bg: '#F3F4F6', text: themeColors.textSecondary },
});

export function Badge({ status, label }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const statusMap = getStatusMap(themeColors);
  const config = statusMap[status] || {
    label: label || status,
    bg: '#F3F4F6',
    text: themeColors.textSecondary,
  }

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  )
}

export default Badge

const getStyles = (themeColors) => StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
})
