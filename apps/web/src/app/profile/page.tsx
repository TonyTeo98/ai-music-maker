'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthUser, UpdateProfileData } from '@/lib/authApi'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const MAX_NICKNAME = 20
const MAX_BIO = 200

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoading, isAuthenticated, updateProfile, logout } = useAuth()
  const [profile, setProfile] = useState({ nickname: '', bio: '' })
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)
  const saveStatusRef = useRef<SaveStatus>('idle')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef(false)
  const dirtyRef = useRef(false)
  const profileRef = useRef(profile)
  const userRef = useRef<AuthUser | null>(null)

  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true)
    }
  }, [isLoading, hasCheckedAuth])

  useEffect(() => {
    if (user && !dirtyRef.current) {
      setProfile({ nickname: user.nickname ?? '', bio: user.bio ?? '' })
    }
  }, [user?.nickname, user?.bio])

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (hasCheckedAuth && !isLoading && !isAuthenticated) {
      router.replace('/')
    }
  }, [hasCheckedAuth, isLoading, isAuthenticated, router])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const displayName = useMemo(() => {
    const trimmedNickname = profile.nickname.trim()
    if (trimmedNickname) {
      return trimmedNickname
    }
    if (user?.nickname) {
      return user.nickname
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return '用户'
  }, [profile.nickname, user?.nickname, user?.email])

  const avatarLetter = displayName.trim().charAt(0).toUpperCase()

  const resetSaveState = () => {
    if (saveStatus !== 'idle') {
      saveStatusRef.current = 'idle'
      setSaveStatus('idle')
    }
    if (saveError) {
      setSaveError(null)
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
  }

  const handleFieldChange = (field: 'nickname' | 'bio') => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value
    setProfile(prev => {
      const next = { ...prev, [field]: value }
      profileRef.current = next
      return next
    })
    dirtyRef.current = true
    if (saveStatusRef.current === 'saving') {
      pendingSaveRef.current = true
    }
    if (saveStatusRef.current === 'saved' || saveStatusRef.current === 'error' || saveError) {
      resetSaveState()
    }
  }

  const applySaveStatus = () => {
    saveStatusRef.current = 'saved'
    setSaveStatus('saved')
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveStatusRef.current = 'idle'
      setSaveStatus('idle')
      saveTimeoutRef.current = null
    }, 2000)
  }

  const handleSave = async (force = false) => {
    const currentUser = userRef.current
    if (!currentUser) return
    if (!force && saveStatusRef.current === 'saving') {
      pendingSaveRef.current = true
      return
    }

    const currentProfile = profileRef.current
    const nextNickname = currentProfile.nickname.trim()
    const nextBio = currentProfile.bio.trim()
    const payload: UpdateProfileData = {}
    const currentNickname = currentUser.nickname ?? ''
    const currentBio = currentUser.bio ?? ''

    if (nextNickname !== currentNickname) {
      payload.nickname = nextNickname
    }
    if (nextBio !== currentBio) {
      payload.bio = nextBio
    }

    if (Object.keys(payload).length === 0) {
      dirtyRef.current = false
      pendingSaveRef.current = false
      return
    }

    if (nextNickname !== currentProfile.nickname || nextBio !== currentProfile.bio) {
      const nextProfile = { nickname: nextNickname, bio: nextBio }
      profileRef.current = nextProfile
      setProfile(nextProfile)
    }

    saveStatusRef.current = 'saving'
    setSaveStatus('saving')
    setSaveError(null)
    let didFail = false

    try {
      await updateProfile(payload)
      const hasPending = pendingSaveRef.current
      dirtyRef.current = hasPending
      userRef.current = { ...currentUser, ...payload }
      if (!hasPending) {
        applySaveStatus()
      }
    } catch (error) {
      didFail = true
      saveStatusRef.current = 'error'
      setSaveStatus('error')
      setSaveError(error instanceof Error ? error.message : '保存失败')
    } finally {
      if (pendingSaveRef.current && !didFail) {
        pendingSaveRef.current = false
        await handleSave(true)
      } else if (didFail) {
        pendingSaveRef.current = false
      }
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      router.replace('/')
    }
  }

  if (!hasCheckedAuth) {
    return (
      <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div
              className="w-10 h-10 rounded-full animate-spin"
              style={{
                border: '3px solid var(--bg-elevated)',
                borderTopColor: 'var(--accent-primary)',
              }}
            />
          </div>
        </div>
      </main>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg-base)' }}>
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              个人资料
            </h1>
            <p className="mt-1 text-sm md:text-base" style={{ color: 'var(--text-muted)' }}>
              管理你的昵称和个人简介
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm" aria-live="polite">
            {saveStatus === 'saving' && (
              <>
                <span
                  className="w-4 h-4 rounded-full animate-spin"
                  style={{
                    border: '2px solid var(--bg-elevated)',
                    borderTopColor: 'var(--accent-primary)',
                  }}
                />
                <span style={{ color: 'var(--text-muted)' }}>保存中...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <svg className="w-4 h-4" style={{ color: 'var(--accent-success)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span style={{ color: 'var(--accent-success)' }}>已保存</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <svg className="w-4 h-4" style={{ color: 'var(--color-error)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
                </svg>
                <span style={{ color: 'var(--color-error)' }}>{saveError || '保存失败'}</span>
              </>
            )}
            {saveStatus === 'idle' && (
              <span style={{ color: 'var(--text-subtle)' }}>自动保存</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <div className="card-glass p-6">
            <div className="flex flex-col items-center text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-semibold mb-4"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-success) 100%)',
                  color: 'white',
                  boxShadow: 'var(--shadow-glow-primary)',
                }}
              >
                {avatarLetter}
              </div>
              <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                {displayName}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
              {user?.emailVerified === false && (
                <span className="mt-3 tag" style={{ color: 'var(--color-warning)' }}>
                  邮箱未验证
                </span>
              )}
            </div>
          </div>

          <div className="card-glass p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  昵称
                </label>
                <input
                  className="input"
                  value={profile.nickname}
                  onChange={handleFieldChange('nickname')}
                  onBlur={() => handleSave()}
                  placeholder="请输入昵称"
                  maxLength={MAX_NICKNAME}
                />
                <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <span>最多 {MAX_NICKNAME} 个字符</span>
                  <span>{profile.nickname.length}/{MAX_NICKNAME}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  邮箱
                </label>
                <input
                  className="input"
                  value={user?.email ?? ''}
                  readOnly
                  disabled
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                  个人简介
                </label>
                <textarea
                  className="input min-h-[140px] resize-none"
                  value={profile.bio}
                  onChange={handleFieldChange('bio')}
                  onBlur={() => handleSave()}
                  placeholder="写点关于你的音乐灵感"
                  maxLength={MAX_BIO}
                />
                <div className="mt-2 flex justify-between text-xs" style={{ color: 'var(--text-subtle)' }}>
                  <span>最多 {MAX_BIO} 个字符</span>
                  <span>{profile.bio.length}/{MAX_BIO}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={handleLogout}
            className="btn-secondary w-full sm:w-auto"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.4)',
              color: 'var(--color-error)',
            }}
          >
            退出登录
          </button>
        </div>
      </div>
    </main>
  )
}
