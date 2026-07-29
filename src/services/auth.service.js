// src/services/auth.service.js
import api from './api'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'

export async function login(email, password) {
  return api.post('/api/auth/login', { email, password })
}

export async function loginWithGoogle(idToken) {
  return api.post('/api/auth/google', { idToken })
}

export async function register(data) {
  return api.post('/api/auth/register', data)
}

export async function verifyEmail(email, code) {
  // Non implémenté dans le nouveau backend, retour succès direct
  return { message: 'ok' }
}

export async function resendOtp(email) {
  // Non implémenté dans le nouveau backend, retour succès direct
  return { message: 'ok' }
}

export async function getProfile() {
  return api.get('/api/users/me')
}

export async function updateProfile(data) {
  return api.put('/api/users/me', data)
}

export async function saveToken(token) {
  await SecureStore.setItemAsync('auth_token', token)
}

export async function removeToken() {
  await SecureStore.deleteItemAsync('auth_token')
}

export async function getToken() {
  return SecureStore.getItemAsync('auth_token')
}

function sanitizeKey(key) {
  return key.replace(/[^a-zA-Z0-9.\-_]/g, '_')
}

export async function hashPassword(password) {
  if (!password) return ''
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password)
}

export async function saveCachedUser(user) {
  if (!user) return
  try {
    await SecureStore.setItemAsync('cached_user_profile', JSON.stringify(user))
  } catch (e) {
    console.error('Erreur de sauvegarde du profil en cache', e)
  }
}

export async function getCachedUser() {
  try {
    const data = await SecureStore.getItemAsync('cached_user_profile')
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

export async function saveOfflineCredentials(email, password, token, user) {
  if (!email || !password) return
  try {
    const lowerEmail = email.trim().toLowerCase()
    const passwordHash = await hashPassword(password)
    const payload = JSON.stringify({
      email: lowerEmail,
      hash: passwordHash,
      token,
      user
    })
    const storeKey = `offline_creds_${sanitizeKey(lowerEmail)}`
    await SecureStore.setItemAsync(storeKey, payload)
    await SecureStore.setItemAsync('last_offline_email', lowerEmail)
  } catch (e) {
    console.error('Erreur sauvegarde identifiants hors-ligne', e)
  }
}

export async function verifyOfflineCredentials(email, password) {
  if (!email || !password) {
    throw new Error('Identifiant ou mot de passe invalide.')
  }
  const lowerEmail = email.trim().toLowerCase()
  const storeKey = `offline_creds_${sanitizeKey(lowerEmail)}`
  const raw = await SecureStore.getItemAsync(storeKey)

  if (!raw) {
    throw new Error('Aucune session enregistrée hors-ligne pour cet identifiant. Une première connexion en ligne est requise.')
  }

  const storedCreds = JSON.parse(raw)
  const inputHash = await hashPassword(password)

  if (inputHash !== storedCreds.hash) {
    throw new Error('Mot de passe incorrect en mode hors-ligne.')
  }

  return {
    token: storedCreds.token,
    user: storedCreds.user || storedCreds
  }
}

export async function removeCachedUser() {
  try {
    await SecureStore.deleteItemAsync('cached_user_profile')
  } catch (e) {}
}

