// src/screens/auth/VerifyEmailScreen.js
import { useTheme } from '../../context/ThemeContext'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors, Typography, Spacing, Radius } from '../../utils/theme'
import Button from '../../components/ui/Button'
import { useAuth } from '../../context/AuthContext'

export default function VerifyEmailScreen() {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { user, verifyEmail, resendOtp, refreshUser, logout } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  async function handleVerify() {
    if (!code || code.length < 6) {
      Alert.alert(t('verify_email.err_title'), t('verify_email.err_code_len'))
      return
    }
    setLoading(true)
    try {
      await verifyEmail(user.email, code)
      await refreshUser() // Fetch new profile with isVerified = true
      Alert.alert(t('verify_email.success_title'), t('verify_email.success_verified'))
    } catch (error) {
      Alert.alert(t('verify_email.err_title'), error.response?.data?.message || t('verify_email.err_code_invalid'))
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await resendOtp(user.email)
      Alert.alert(t('verify_email.success_title'), t('verify_email.success_resent') + user.email)
    } catch (error) {
      Alert.alert(t('verify_email.err_title'), error.response?.data?.message || t('verify_email.err_resend'))
    } finally {
      setResending(false)
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('verify_email.title')}</Text>
        <Text style={styles.subtitle}>
          {t('verify_email.subtitle_1')}<Text style={{ fontWeight: 'bold' }}>{user?.email}</Text>.
        </Text>
        <Text style={styles.subtitle}>
          {t('verify_email.subtitle_2')}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
          textAlign="center"
        />

        <Button 
          loading={loading} 
          onPress={handleVerify}
          fullWidth
          style={{ marginBottom: 16 }}
        >
          {t('verify_email.submit')}
        </Button>

        <TouchableOpacity onPress={handleResend} disabled={resending} style={{ marginBottom: 24 }}>
          <Text style={styles.resendText}>
            {resending ? t('verify_email.resending') : t('verify_email.resend')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={logout}>
          <Text style={styles.logoutText}>{t('verify_email.logout')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.background },
  container: { flex: 1, padding: Spacing.xl, justifyContent: 'center', alignItems: 'center' },
  title: { ...Typography.h1, color: themeColors.textPrimary, marginBottom: 16, textAlign: 'center' },
  subtitle: { ...Typography.bodyMedium, color: themeColors.textSecondary, marginBottom: 8, textAlign: 'center' },
  input: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: 32,
    letterSpacing: 8,
    marginTop: 32,
    marginBottom: 32,
    width: '80%',
    color: themeColors.textPrimary,
  },
  resendText: { color: themeColors.primary, fontWeight: '600', fontSize: 16 },
  logoutText: { color: themeColors.textMuted, fontSize: 14, textDecorationLine: 'underline' }
})
