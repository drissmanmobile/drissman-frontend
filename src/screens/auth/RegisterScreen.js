// src/screens/auth/RegisterScreen.js
import { useTheme } from '../../context/ThemeContext'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, StatusBar,
} from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../../context/AuthContext'
import { Colors, Typography, Spacing, Radius } from '../../utils/theme'
import Button from '../../components/ui/Button'
import { Ionicons } from '@expo/vector-icons'



export default function RegisterScreen({ navigation }) {
  const { Colors: themeColors } = useTheme();
  const styles = getStyles(themeColors);
  const { t } = useTranslation()
  const { register } = useAuth()

  const schema = useMemo(() => z.object({
    firstName: z.string().min(2, t('register.err_firstname')),
    lastName: z.string().min(2, t('register.err_lastname')),
    email: z.string().email(t('register.err_email')),
    phone: z.string().min(9, t('register.err_phone')),
    password: z.string().min(6, t('register.err_password_len')),
    confirmPassword: z.string(),
    role: z.enum(['STUDENT', 'SCHOOL_ADMIN', 'MONITOR']),
    schoolName: z.string().optional(),
  }).refine((d) => d.password === d.confirmPassword, {
    message: t('register.err_password_match'),
    path: ['confirmPassword'],
  }).refine((d) => d.role !== 'SCHOOL_ADMIN' || (d.schoolName && d.schoolName.length > 0), {
    message: t('register.err_school_req'),
    path: ['schoolName']
  }), [t])

  const ROLES = useMemo(() => [
    { value: 'STUDENT', label: t('register.role_student'), desc: t('register.role_student_desc') },
    { value: 'SCHOOL_ADMIN', label: t('register.role_admin'), desc: t('register.role_admin_desc') },
    { value: 'MONITOR', label: t('register.role_monitor'), desc: t('register.role_monitor_desc') },
  ], [t])
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSchoolInput, setShowSchoolInput] = useState(false)

  const { control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'STUDENT', schoolName: '' },
  })

  const selectedRole = watch('role')

  async function onSubmit(data) {
    setServerError('')
    try {
      const { confirmPassword, ...payload } = data
      await register(payload)
    } catch (err) {
      setServerError(err.message || t('register.err_register'))
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="light-content" backgroundColor={themeColors.dark} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <View style={styles.hero}>
          <Text style={styles.logo}>🚗 Drissman</Text>
          <Text style={styles.heroTitle}>{t('register.title')}</Text>
          <Text style={styles.heroSubtitle}>{t('register.subtitle')}</Text>
        </View>

        <View style={styles.form}>

          {/* Sélection du rôle */}
          <Text style={styles.sectionTitle}>{t('register.i_am')}</Text>
          <View style={styles.rolesRow}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.value}
                onPress={() => setValue('role', r.value)}
                style={[styles.roleCard, selectedRole === r.value && styles.roleCardActive]}
              >
                <Text style={styles.roleEmoji}>{r.label.split(' ')[0]}</Text>
                <Text style={[styles.roleLabel, selectedRole === r.value && styles.roleLabelActive]}>
                  {r.label.split(' ')[1]}
                </Text>
                <Text style={styles.roleDesc}>{r.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Nom de l'auto-école (affiché uniquement si Gérant) */}
          {selectedRole === 'SCHOOL_ADMIN' && (
            <View style={styles.field}>
              {!showSchoolInput ? (
                <TouchableOpacity 
                  onPress={() => setShowSchoolInput(true)} 
                  style={{
                    backgroundColor: themeColors.primaryLight,
                    padding: 12,
                    borderRadius: Radius.md,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: themeColors.primary
                  }}
                >
                  <Text style={{ color: themeColors.primary, fontWeight: 'bold' }}>{t('register.create_school')}</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <Text style={styles.label}>{t('register.school_name')}</Text>
                  <Controller control={control} name="schoolName" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={[styles.input, errors.schoolName && styles.inputError]} placeholder={t('register.school_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} />
                  )} />
                  {errors.schoolName && <Text style={styles.error}>{errors.schoolName.message}</Text>}
                </>
              )}
            </View>
          )}

          {/* Prénom & Nom */}
          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>{t('register.firstname')}</Text>
              <Controller control={control} name="firstName" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={[styles.input, errors.firstName && styles.inputError]} placeholder={t('register.firstname_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} />
              )} />
              {errors.firstName && <Text style={styles.error}>{errors.firstName.message}</Text>}
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>{t('register.lastname')}</Text>
              <Controller control={control} name="lastName" render={({ field: { onChange, onBlur, value } }) => (
                <TextInput style={[styles.input, errors.lastName && styles.inputError]} placeholder={t('register.lastname_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} />
              )} />
              {errors.lastName && <Text style={styles.error}>{errors.lastName.message}</Text>}
            </View>
          </View>

          {/* Email */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.email')}</Text>
            <Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder={t('register.email_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} keyboardType="email-address" autoCapitalize="none" />
            )} />
            {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}
          </View>

          {/* Téléphone */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.phone')}</Text>
            <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
              <TextInput style={[styles.input, errors.phone && styles.inputError]} placeholder={t('register.phone_placeholder')} placeholderTextColor={themeColors.textMuted} onChangeText={onChange} onBlur={onBlur} value={value} keyboardType="phone-pad" />
            )} />
            {errors.phone && <Text style={styles.error}>{errors.phone.message}</Text>}
          </View>

          {/* Mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.password')}</Text>
            <Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('register.password_placeholder')}
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
            )} />
            {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}
          </View>

          {/* Confirmation */}
          <View style={styles.field}>
            <Text style={styles.label}>{t('register.confirm_password')}</Text>
            <Controller control={control} name="confirmPassword" render={({ field: { onChange, onBlur, value } }) => (
              <View style={[styles.inputContainer, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.inputField}
                  placeholder={t('register.password_placeholder')}
                  placeholderTextColor={themeColors.textMuted}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={themeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            )} />
            {errors.confirmPassword && <Text style={styles.error}>{errors.confirmPassword.message}</Text>}
          </View>

          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>⚠️ {serverError}</Text>
            </View>
          ) : null}

          <Button onPress={handleSubmit(onSubmit)} loading={isSubmitting} fullWidth size="lg" style={{ marginTop: 8 }}>
            {t('register.submit')}
          </Button>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>
              {t('register.already_have_account')} <Text style={styles.loginLinkBold}>{t('register.login_link')}</Text>
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
  hero: { backgroundColor: themeColors.dark, paddingTop: 60, paddingBottom: 32, paddingHorizontal: Spacing.lg, alignItems: 'center' },
  logo: { fontSize: 22, fontWeight: '800', color: themeColors.primary, marginBottom: 16 },
  heroTitle: { ...Typography.h2, color: themeColors.textWhite, marginBottom: 6 },
  heroSubtitle: { ...Typography.body, color: '#9CA3AF', textAlign: 'center' },
  form: { flex: 1, backgroundColor: themeColors.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: Spacing.lg, paddingTop: 28 },
  sectionTitle: { ...Typography.h4, color: themeColors.textPrimary, marginBottom: 12 },
  rolesRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleCard: { flex: 1, padding: 12, borderRadius: Radius.md, borderWidth: 1.5, borderColor: themeColors.border, backgroundColor: themeColors.surface, alignItems: 'center' },
  roleCardActive: { borderColor: themeColors.primary, backgroundColor: '#FFFBEB' },
  roleEmoji: { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: '600', color: themeColors.textSecondary },
  roleLabelActive: { color: themeColors.primary },
  roleDesc: { fontSize: 10, color: themeColors.textMuted, textAlign: 'center', marginTop: 2 },
  row: { flexDirection: 'row' },
  field: { marginBottom: 14 },
  label: { ...Typography.smallMedium, color: themeColors.textPrimary, marginBottom: 6 },
  input: { backgroundColor: themeColors.surface, borderWidth: 1.5, borderColor: themeColors.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: themeColors.textPrimary },
  inputError: { borderColor: themeColors.error },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderWidth: 1.5,
    borderColor: themeColors.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
  },
  inputField: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    color: themeColors.textPrimary,
  },
  eyeButton: {
    padding: 8,
    marginRight: -8,
  },
  error: { color: themeColors.error, fontSize: 11, marginTop: 3 },
  serverErrorBox: { backgroundColor: themeColors.errorLight, borderRadius: Radius.md, padding: 12, marginBottom: 12 },
  serverErrorText: { color: themeColors.error, fontSize: 13 },
  loginLink: { alignItems: 'center', marginTop: 20 },
  loginLinkText: { color: themeColors.textSecondary, fontSize: 14 },
  loginLinkBold: { color: themeColors.primary, fontWeight: '700' },
})
