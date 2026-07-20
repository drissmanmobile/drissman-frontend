// src/utils/theme.js
export const lightColors = {
  // Brand
  primary: '#F5C518',       // Jaune/Or Drissman
  primaryDark: '#D4A80E',
  primaryLight: '#FDE68A',

  // Backgrounds
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceDark: '#0A0F1E',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#111827',
  textWhite: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Borders
  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  // Dark theme fallback
  dark: '#0A0F1E',
  darkCard: '#151D2E',
  darkBorder: '#1F2D40',
}

export const darkColors = {
  // Brand
  primary: '#F5C518',
  primaryDark: '#D4A80E',
  primaryLight: '#FDE68A',

  // Backgrounds
  background: '#0A0F1E',
  surface: '#151D2E',
  surfaceDark: '#0A0F1E',

  // Text
  textPrimary: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textOnPrimary: '#111827',
  textWhite: '#FFFFFF',

  // Semantic
  success: '#10B981',
  successLight: '#064E3B',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  info: '#3B82F6',
  infoLight: '#1E3A8A',

  // Borders
  border: '#374151',
  borderLight: '#1F2D40',

  // Dark theme specifics
  dark: '#0A0F1E',
  darkCard: '#151D2E',
  darkBorder: '#1F2D40',
}

// Keep a fallback Colors export
export const Colors = lightColors;

export const Typography = {
  h1: { fontSize: 28, fontWeight: '700', lineHeight: 36 },
  h2: { fontSize: 22, fontWeight: '700', lineHeight: 30 },
  h3: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  h4: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 14, fontWeight: '400', lineHeight: 22 },
  bodyMedium: { fontSize: 14, fontWeight: '500', lineHeight: 22 },
  small: { fontSize: 12, fontWeight: '400', lineHeight: 18 },
  smallMedium: { fontSize: 12, fontWeight: '500', lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400', lineHeight: 16 },
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
}

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
}
