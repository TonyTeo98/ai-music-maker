import { apiFetch } from './api'

export interface AuthUser {
  id: string
  email: string
  nickname?: string
  avatar?: string
  bio?: string
  emailVerified: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface UpdateProfileData {
  nickname?: string
  bio?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const getAccessToken = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('accessToken')
}

const authHeaders = (): Record<string, string> => {
  const token = getAccessToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function register(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout(refreshToken: string) {
  return apiFetch<{ success: boolean }>('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export async function refresh(refreshToken: string) {
  return apiFetch<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

export async function getMe() {
  return apiFetch<AuthUser>('/users/me', {
    headers: authHeaders(),
  })
}

export async function updateMe(data: UpdateProfileData) {
  return apiFetch<AuthUser>('/users/me', {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
}

export function googleAuthUrl() {
  return `${API_BASE_URL}/auth/google`
}
