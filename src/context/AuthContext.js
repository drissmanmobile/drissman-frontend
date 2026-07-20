// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react'
import { login, register, getProfile, saveToken, removeToken, getToken, loginWithGoogle, verifyEmail, resendOtp } from '../services/auth.service'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si un token est déjà stocké au démarrage
    async function restoreSession() {
      try {
        const token = await getToken()
        if (token) {
          const profile = await getProfile()
          setUser(profile)
        }
      } catch (_) {
        await removeToken()
      } finally {
        setLoading(false)
      }
    }
    restoreSession()
  }, [])

  async function handleLogin(email, password) {
    const data = await login(email, password)
    await saveToken(data.token)
    setUser(data.user)
    return data.user
  }

  async function handleGoogleLogin(idToken) {
    const data = await loginWithGoogle(idToken)
    await saveToken(data.token)
    setUser(data.user)
    return data.user
  }

  async function handleRegister(formData) {
    const data = await register(formData)
    await saveToken(data.token)
    setUser(data.user)
    return data.user
  }

  async function handleLogout() {
    await removeToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        loginWithGoogle: handleGoogleLogin,
        register: handleRegister,
        verifyEmail,
        resendOtp,
        logout: handleLogout,
        isAuthenticated: !!user,
        refreshUser: async () => {
          const profile = await getProfile()
          setUser(profile)
        }
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
