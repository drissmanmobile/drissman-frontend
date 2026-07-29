// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import NetInfo from '@react-native-community/netinfo'
import {
  login,
  register,
  getProfile,
  saveToken,
  removeToken,
  getToken,
  loginWithGoogle,
  verifyEmail,
  resendOtp,
  saveCachedUser,
  getCachedUser,
  saveOfflineCredentials,
  verifyOfflineCredentials,
  removeCachedUser,
} from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const userRef = useRef(user)

  useEffect(() => {
    userRef.current = user
  }, [user])

  // Écouter les changements d'état du réseau
  useEffect(() => {
    let wasOffline = false
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || state.isInternetReachable === false
      setIsOffline(offline)

      // Refresh user only when network recovers from offline state
      if (wasOffline && !offline && userRef.current) {
        refreshUser().catch(() => {})
      }
      wasOffline = offline
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    // Vérifier si un token ou profil est déjà stocké au démarrage
    async function restoreSession() {
      try {
        const token = await getToken()
        if (token) {
          try {
            const profile = await getProfile()
            setUser(profile)
            await saveCachedUser(profile)
            setIsOffline(false)
          } catch (netError) {
            // En cas d'échec réseau / serveur inaccessible, tenter de récupérer le cache
            const cachedUser = await getCachedUser()
            if (cachedUser) {
              setUser(cachedUser)
              setIsOffline(true)
            } else {
              // Aucun cache disponible pour cet utilisateur
              await removeToken()
              setUser(null)
            }
          }
        }
      } catch (_) {
        await removeToken()
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  async function handleLogin(email, password) {
    const netState = await NetInfo.fetch()
    const isNetworkAvailable = netState.isConnected && netState.isInternetReachable !== false

    if (!isNetworkAvailable) {
      // Tentative de connexion hors-ligne avec identifiants sauvegardés
      const offlineData = await verifyOfflineCredentials(email, password)
      await saveToken(offlineData.token)
      setUser(offlineData.user)
      await saveCachedUser(offlineData.user)
      setIsOffline(true)
      return offlineData.user
    }

    try {
      const data = await login(email, password)
      await saveToken(data.token)
      setUser(data.user)
      await saveCachedUser(data.user)
      await saveOfflineCredentials(email, password, data.token, data.user)
      setIsOffline(false)
      return data.user
    } catch (err) {
      // Si l'erreur est due au réseau indisponible pendant la requête login
      if (err.message && (err.message.toLowerCase().includes('hors-ligne') || err.message.includes('Network Error') || err.message.includes('timeout'))) {
        const offlineData = await verifyOfflineCredentials(email, password)
        await saveToken(offlineData.token)
        setUser(offlineData.user)
        await saveCachedUser(offlineData.user)
        setIsOffline(true)
        return offlineData.user
      }
      throw err
    }
  }

  async function handleGoogleLogin(idToken) {
    const data = await loginWithGoogle(idToken)
    await saveToken(data.token)
    setUser(data.user)
    await saveCachedUser(data.user)
    setIsOffline(false)
    return data.user
  }

  async function handleRegister(formData) {
    const data = await register(formData)
    await saveToken(data.token)
    setUser(data.user)
    await saveCachedUser(data.user)
    if (formData.password) {
      await saveOfflineCredentials(formData.email, formData.password, data.token, data.user)
    }
    setIsOffline(false)
    return data.user
  }

  async function handleLogout() {
    await removeToken()
    await removeCachedUser()
    setUser(null)
    setIsOffline(false)
  }

  async function refreshUser() {
    try {
      const profile = await getProfile()
      setUser(profile)
      await saveCachedUser(profile)
      setIsOffline(false)
      return profile
    } catch (e) {
      const cached = await getCachedUser()
      if (cached) {
        setUser(cached)
        setIsOffline(true)
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOffline,
        login: handleLogin,
        loginWithGoogle: handleGoogleLogin,
        register: handleRegister,
        verifyEmail,
        resendOtp,
        logout: handleLogout,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}

