import { useTheme } from '../../context/ThemeContext'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Colors, Typography, Spacing } from '../../utils/theme'

export function EmptyState({ message = 'Aucun résultat', actionLabel, onAction, icon = '📭' }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  return (
    <View style={styles.container}>
      {typeof icon === 'string' ? <Text style={styles.icon}>{icon}</Text> : <View style={{marginBottom: 12}}>{icon}</View>}
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default EmptyState

const getStyles = (themeColors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.lg,
  },
  icon: {
    fontSize: 40,
    marginBottom: 12,
  },
  message: {
    ...Typography.body,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: themeColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: themeColors.textOnPrimary,
    fontWeight: '600',
    fontSize: 13,
  },
})
