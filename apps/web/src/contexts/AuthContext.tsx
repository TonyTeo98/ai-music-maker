'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  AuthResponse,
  AuthUser,
  UpdateProfileData,
  getMe,
  login as loginApi,
  logout as logoutApi,
  refresh as refreshApi,
  register as registerApi,
  updateMe,
} from '@/lib/authApi'

interface AuthContextType {
  user: AuthUser | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const setSession = (response: AuthResponse) => {
    setUser(response.user)
    setAccessToken(response.accessToken)
    setIsAuthenticated(true)
    localStorage.setItem('accessToken', response.accessToken)
    localStorage.setItem('refreshToken', response.refreshToken)
  }

  const clearSession = () => {
    setUser(null)
    setAccessToken(null)
    setIsAuthenticated(false)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  useEffect(() => {
    let isMounted = true

    const initialize = async () => {
      const storedAccess = localStorage.getItem('accessToken')
      const storedRefresh = localStorage.getItem('refreshToken')

      if (!storedAccess && !storedRefresh) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        if (storedRefresh) {
          const response = await refreshApi(storedRefresh)
          if (!isMounted) {
            return
          }
          setSession(response)
          return
        }

        if (storedAccess) {
          setAccessToken(storedAccess)
          const profile = await getMe()
          if (!isMounted) {
            return
          }
          setUser(profile)
          setIsAuthenticated(true)
        }
      } catch {
        if (!isMounted) {
          return
        }
        clearSession()
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginApi(email, password)
      setSession(response)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await registerApi(email, password)
      setSession(response)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    setIsLoading(true)
    try {
      if (refreshToken) {
        await logoutApi(refreshToken)
      }
    } finally {
      clearSession()
      setIsLoading(false)
    }
  }

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      clearSession()
      return
    }

    setIsLoading(true)
    try {
      const response = await refreshApi(refreshToken)
      setSession(response)
    } catch {
      clearSession()
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (data: UpdateProfileData) => {
    setIsLoading(true)
    try {
      const profile = await updateMe(data)
      setUser(profile)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshSession,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
