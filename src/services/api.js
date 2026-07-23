// src/services/api.js
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'

import Constants from 'expo-constants'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

const LOCAL_LAN_IP = '172.18.204.63'

const getDynamicBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL
  if (envUrl && envUrl.trim().length > 0 && envUrl !== 'http://localhost:8080') {
    return envUrl
  }

  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost
  if (hostUri) {
    const hostIp = hostUri.split(':')[0]
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8080`
    }
  }

  if (Platform.OS === 'android' && !Device.isDevice) {
    return 'http://10.0.2.2:8080'
  }

  return `http://${LOCAL_LAN_IP}:8080`
}

const BASE_URL = getDynamicBaseUrl()
console.log("🔗 L'URL de l'API utilisée par l'application est :", BASE_URL)

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

const getCacheKey = (config) => {
  return `cache_${config.method}_${config.url}_${JSON.stringify(config.params || {})}`
}

// Injecter le token JWT automatiquement et vérifier le réseau
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const targetUrl = config.baseURL || BASE_URL
    const isLocalServer = targetUrl.includes('localhost') || 
                          targetUrl.includes('127.0.0.1') || 
                          targetUrl.includes('10.0.2.2') || 
                          targetUrl.includes('172.18.') || 
                          targetUrl.includes('192.168.')

    const netInfo = await NetInfo.fetch()
    const isOffline = !netInfo.isConnected && !isLocalServer

    if (isOffline) {
      if (config.method.toLowerCase() === 'get') {
        const cacheKey = getCacheKey(config)
        const cachedData = await AsyncStorage.getItem(cacheKey)
        if (cachedData) {
          config.adapter = () => Promise.resolve({
            data: JSON.parse(cachedData),
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          })
        } else {
          return Promise.reject(new Error('Hors ligne - Aucune donnée en cache pour cette requête.'))
        }
      } else {
        return Promise.reject(new Error('Vous êtes hors-ligne. Action impossible.'))
      }
    }
  } catch (_) {}
  return config
})

// Intercepteur de réponse pour gestion globale des erreurs et mise en cache
api.interceptors.response.use(
  async (response) => {
    if (response.config.method.toLowerCase() === 'get') {
      try {
        const cacheKey = getCacheKey(response.config)
        await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data))
      } catch (e) {}
    }

    if (response.data && typeof response.data === 'object' && response.data.hasOwnProperty('success')) {
      if (response.data.success) {
        return response.data.data
      } else {
        return Promise.reject(new Error(response.data.message || 'Une erreur est survenue'))
      }
    }
    return response.data
  },
  async (error) => {
    if (!error.response && error.config && error.config.method.toLowerCase() === 'get') {
       try {
          const cacheKey = getCacheKey(error.config)
          const cachedData = await AsyncStorage.getItem(cacheKey)
          if (cachedData) {
            const data = JSON.parse(cachedData)
            if (data && typeof data === 'object' && data.hasOwnProperty('success')) {
              if (data.success) return data.data
            }
            return data
          }
       } catch (e) {}
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Une erreur est survenue'
    return Promise.reject(new Error(message))
  }
)

export default api
