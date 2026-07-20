// src/services/auth.service.js
import api from './api'
import * as SecureStore from 'expo-secure-store'

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
