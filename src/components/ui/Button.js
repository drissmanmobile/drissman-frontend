import { useTheme } from '../../context/ThemeContext'
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { Colors, Radius } from '../../utils/theme'

export default function Button({
  children,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'md',
  style,
}) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const variantStyles = {
    primary: { bg: themeColors.primary, text: themeColors.textOnPrimary, border: themeColors.primary },
    secondary: { bg: '#1F2D40', text: themeColors.textWhite, border: '#1F2D40' },
    danger: { bg: themeColors.error, text: themeColors.textWhite, border: themeColors.error },
    outline: { bg: 'transparent', text: themeColors.primary, border: themeColors.primary },
    ghost: { bg: 'transparent', text: themeColors.textSecondary, border: 'transparent' },
  }

  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 14, fontSize: 12 },
    md: { paddingVertical: 13, paddingHorizontal: 20, fontSize: 14 },
    lg: { paddingVertical: 16, paddingHorizontal: 28, fontSize: 16 },
  }

  const v = variantStyles[variant] || variantStyles.primary
  const s = sizeStyles[size] || sizeStyles.md

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          width: fullWidth ? '100%' : undefined,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  base: {
    borderRadius: Radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
})
