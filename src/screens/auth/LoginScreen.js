// src/screens/auth/LoginScreen.js
import { useTheme } from '../../context/ThemeContext'
import { useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, StatusBar,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../context/AuthContext'
import { Colors, Typography, Spacing, Radius } from '../../utils/theme'
import Button from '../../components/ui/Button'
import { Ionicons } from '@expo/vector-icons'
import { signInWithGoogle } from '../../services/googleAuth'
import { useTranslation } from 'react-i18next'

const schema = z.object({
  email: z.string().min(3, 'Identifiant requis (min 3 caractères)'),
  password: z.string().min(6, 'Minimum 6 caractères'),
})

export default function LoginScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { login, loginWithGoogle } = useAuth()
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  async function handleGoogleLogin() {
    setServerError('')
    setIsGoogleLoading(true)
    try {
      const token = await signInWithGoogle()
      await loginWithGoogle(token)
    } catch (err) {
      setServerError(err.message || t('auth.google_auth_failed'))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    async function loadLastEmail() {
      try {
        const storedEmail = await AsyncStorage.getItem('last_email')
        if (storedEmail) {
          setValue('email', storedEmail)
        }
      } catch (e) {}
    }
    loadLastEmail()
  }, [setValue])

  async function onSubmit({ email, password }) {
    setServerError('')
    try {
      await login(email, password)
      try {
        await AsyncStorage.setItem('last_email', email)
      } catch (e) {}
      // La navigation se fait automatiquement via AppNavigator
    } catch (err) {
      setServerError(err.message || t('auth.invalid_credentials'))
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={themeColors.dark} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header hero */}
        <View style={styles.hero}>
          <Text style={styles.logo}>🚗 Drissman</Text>
          <Text style={styles.heroTitle}>{t('auth.login_hero_title')}</Text>
          <Text style={styles.heroSubtitle}>{t('auth.login_hero_subtitle')}</Text>
        </View>

        {/* Formulaire */}
        <View style={styles.form}>

          {/* Email / Username */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.email_label')}</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder={t('auth.email_placeholder')}
                  placeholderTextColor={themeColors.textMuted}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>

          {/* Mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('auth.password_label')}</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                  <TextInput
                    style={styles.inputField}
                    placeholder={t('auth.password_placeholder')}
                    placeholderTextColor={themeColors.textMuted}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={themeColors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </View>

          {/* Erreur serveur */}
          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>⚠️ {serverError}</Text>
            </View>
          ) : null}

          {/* Bouton connexion */}
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            size="lg"
            style={{ marginTop: 8 }}
          >
            {t('auth.login_button')}
          </Button>

          {/* Séparateur */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.divider} />
          </View>

          {/* Bouton Google */}
          <Button
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
            loading={isGoogleLoading}
            fullWidth
            size="lg"
            style={{ marginBottom: 20, backgroundColor: themeColors.surface, borderWidth: 1, borderColor: themeColors.border }}
            textStyle={{ color: themeColors.textPrimary }}
          >
            <Ionicons name="logo-google" size={20} color={themeColors.textPrimary} style={{ marginRight: 8, marginTop: 2 }} />
            <Text style={{ color: themeColors.textPrimary, fontWeight: '600' }}> {t('auth.google_login')}</Text>
          </Button>

          {/* Lien inscription */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Register')}
            style={styles.registerLink}
          >
            <Text style={styles.registerLinkText}>
              {t('auth.no_account')}{' '}
              <Text style={styles.registerLinkBold}>{t('auth.register')}</Text>
            </Text>
          </TouchableOpacity>

          {/* Lien visiteur */}
          <TouchableOpacity
            onPress={() => navigation.navigate('GuestSchoolsList')}
            style={[styles.registerLink, { marginTop: 20 }]}
          >
            <Text style={styles.registerLinkText}>
              {t('auth.visitor')}{' '}
              <Text style={[styles.registerLinkBold, { color: themeColors.textSecondary, textDecorationLine: 'underline' }]}>{t('auth.visit_app')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const getStyles = (themeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: themeColors.dark },
  container: { flexGrow: 1 },
  hero: {
    backgroundColor: themeColors.dark,
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  logo: { fontSize: 22, fontWeight: '800', color: themeColors.primary, marginBottom: 24 },
  heroTitle: { ...Typography.h1, color: themeColors.textWhite, marginBottom: 8 },
  heroSubtitle: { ...Typography.body, color: '#9CA3AF' },
  form: {
    flex: 1,
    backgroundColor: themeColors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: Spacing.lg,
    paddingTop: 32,
  },
  field: { marginBottom: Spacing.md },
  label: { ...Typography.smallMedium, color: themeColors.textPrimary, marginBottom: 8 },
  input: {
    backgroundColor: themeColors.surface,
    borderWidth: 1.5,
    borderColor: themeColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: themeColors.textPrimary,
  },
  inputError: { borderColor: themeColors.error },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderWidth: 1.5,
    borderColor: themeColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
  },
  inputField: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: themeColors.textPrimary,
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
  error: { color: themeColors.error, fontSize: 12, marginTop: 4 },
  serverErrorBox: {
    backgroundColor: themeColors.errorLight,
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 12,
  },
  serverErrorText: { color: themeColors.error, fontSize: 13 },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: themeColors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: themeColors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  registerLink: { alignItems: 'center', marginTop: 4 },
  registerLinkText: { color: themeColors.textSecondary, fontSize: 14 },
  registerLinkBold: { color: themeColors.primary, fontWeight: '700' },
})
