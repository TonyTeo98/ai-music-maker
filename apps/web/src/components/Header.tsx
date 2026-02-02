'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LoginModal } from '@/components/LoginModal'
import { useAuth } from '@/contexts/AuthContext'

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-teal-500',
]

export function Header() {
  const { user, isAuthenticated, isLoading, logout } = useAuth()
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const displayName = user?.nickname || user?.email || '用户'
  const userEmail = user?.email || ''
  const avatarLetter = displayName.charAt(0).toUpperCase()
  const avatarColor = useMemo(() => {
    if (!displayName) {
      return AVATAR_COLORS[0]
    }
    const index = displayName.charCodeAt(0) % AVATAR_COLORS.length
    return AVATAR_COLORS[index]
  }, [displayName])

  useEffect(() => {
    if (!isDropdownOpen) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (isLoginOpen) {
      setIsDropdownOpen(false)
      setIsMobileMenuOpen(false)
    }
  }, [isLoginOpen])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      setIsDropdownOpen(false)
      setIsMobileMenuOpen(false)
    }
  }

  const renderAuthDesktop = () => {
    if (!isAuthenticated) {
      return (
        <button
          type="button"
          onClick={() => setIsLoginOpen(true)}
          className="btn-secondary px-4 py-2 text-sm rounded-xl"
          disabled={isLoading}
        >
          登录
        </button>
      )
    }

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full p-1 hover:bg-[var(--surface-hover)] transition-colors"
          aria-haspopup="menu"
          aria-expanded={isDropdownOpen}
        >
          <span
            className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold ${avatarColor}`}
          >
            {avatarLetter}
          </span>
          <svg
            className={`w-4 h-4 text-muted transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-3 w-48 rounded-xl bg-surface border border-default shadow-soft-lg p-2 animate-fade-in-down">
            <div className="px-3 py-2 text-xs text-muted">{userEmail}</div>
            <Link
              href="/profile"
              className="flex items-center gap-2 px-3 py-2 text-sm text-secondary rounded-lg hover:bg-surface-elevated hover:text-primary transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              个人资料
            </Link>
            <Link
              href="/library"
              className="flex items-center gap-2 px-3 py-2 text-sm text-secondary rounded-lg hover:bg-surface-elevated hover:text-primary transition-colors"
              onClick={() => setIsDropdownOpen(false)}
            >
              作品库
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-error-600 rounded-lg hover:bg-error-50 transition-colors"
            >
              退出
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderMobileMenu = () => {
    if (!isMobileMenuOpen) {
      return null
    }

    return (
      <div className="md:hidden border-t border-subtle px-4 pb-4 pt-3 space-y-3 bg-base">
        {!isAuthenticated ? (
          <button
            type="button"
            onClick={() => setIsLoginOpen(true)}
            className="btn-primary w-full py-3 rounded-xl"
            disabled={isLoading}
          >
            登录
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 rounded-xl bg-surface-elevated px-3 py-2">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${avatarColor}`}
              >
                {avatarLetter}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-primary">{displayName}</span>
                <span className="text-xs text-muted">{userEmail}</span>
              </div>
            </div>
            <Link
              href="/profile"
              className="block w-full rounded-xl px-3 py-2 text-sm text-secondary hover:bg-surface-elevated hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              个人资料
            </Link>
            <Link
              href="/library"
              className="block w-full rounded-xl px-3 py-2 text-sm text-secondary hover:bg-surface-elevated hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              作品库
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-left rounded-xl px-3 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
            >
              退出
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <header className="w-full bg-base border-b border-subtle">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-primary text-white flex items-center justify-center shadow-soft-sm">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="font-semibold text-primary hidden sm:block">AI Music Maker</span>
        </Link>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {renderAuthDesktop()}
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="w-10 h-10 rounded-xl bg-surface-elevated hover:bg-[var(--surface-hover)] transition-colors flex items-center justify-center"
            aria-label="打开菜单"
          >
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {renderMobileMenu()}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </header>
  )
}
