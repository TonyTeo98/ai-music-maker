'use client'

import { useEffect, useMemo, useState, type FormEvent, type MouseEvent } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { googleAuthUrl } from '@/lib/authApi'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

type AuthMode = 'login' | 'register'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const formatApiError = (error: unknown, mode: AuthMode) => {
  if (error instanceof Error) {
    const message = error.message
    if (message.includes('401')) {
      return '邮箱或密码错误'
    }
    if (message.includes('409')) {
      return '该邮箱已被注册'
    }
    if (message.includes('400')) {
      return '请输入有效的邮箱和密码'
    }
    if (message.includes('429')) {
      return '请求过于频繁，请稍后再试'
    }
  }
  return mode === 'login' ? '登录失败，请稍后重试' : '注册失败，请稍后重试'
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const title = mode === 'login' ? '登录' : '注册'
  const ctaLabel = mode === 'login' ? '登录' : '创建账号'

  const isEmailValid = useMemo(() => EMAIL_REGEX.test(email.trim()), [email])
  const isPasswordValid = useMemo(() => password.trim().length >= 6, [password])

  const resetForm = () => {
    setMode('login')
    setEmail('')
    setPassword('')
    setError(null)
    setIsSubmitting(false)
  }

  useEffect(() => {
    if (!isOpen) {
      resetForm()
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('请输入邮箱')
      return
    }
    if (!isEmailValid) {
      setError('邮箱格式不正确')
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    if (!isPasswordValid) {
      setError('密码至少 6 位')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register(email.trim(), password)
      }
      onClose()
    } catch (err) {
      setError(formatApiError(err, mode))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  const handleGoogleLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = googleAuthUrl()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      <div
        className="relative w-full h-full sm:h-auto sm:max-w-md bg-surface border border-default shadow-soft-lg sm:rounded-2xl px-6 py-8 sm:py-10 animate-fade-in-up overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-primary hover:bg-[var(--surface-hover)] transition-colors"
          aria-label="关闭登录窗口"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center justify-between mb-6">
          <h2 id="login-modal-title" className="text-xl font-semibold text-primary">
            {title}
          </h2>
          <div className="flex items-center gap-2 bg-surface-elevated rounded-full p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                mode === 'login'
                  ? 'bg-accent-primary text-white shadow-soft-sm'
                  : 'text-muted hover:text-primary'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError(null)
              }}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                mode === 'register'
                  ? 'bg-accent-primary text-white shadow-soft-sm'
                  : 'text-muted hover:text-primary'
              }`}
            >
              注册
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-secondary" htmlFor="login-email">
              邮箱
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              className={`input ${
                error && !isEmailValid ? 'border-error-500 focus:border-error-500' : ''
              }`}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-secondary" htmlFor="login-password">
              密码
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                if (error) {
                  setError(null)
                }
              }}
              className={`input ${
                error && !isPasswordValid ? 'border-error-500 focus:border-error-500' : ''
              }`}
              placeholder="至少 6 位"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full text-base py-3 rounded-xl"
          >
            {isSubmitting ? '处理中...' : ctaLabel}
          </button>
        </form>

        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-xs text-muted">或</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="btn-secondary w-full py-3 rounded-xl"
          >
            使用 Google 登录
          </button>
        </div>
      </div>
    </div>
  )
}
