'use client'

import Link from 'next/link'
import { ThemeToggle } from '@/components/ThemeToggle'

// Animated sound wave bars component
function SoundWave({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end justify-center gap-1 h-8 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-success)] rounded-full"
          style={{
            height: '100%',
            animation: `soundWave 1s ease-in-out infinite`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

// Feature card component
function FeatureCard({
  icon,
  title,
  description,
  delay = 0,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
}) {
  return (
    <div
      className="card-glass p-6 group cursor-default"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-[var(--accent-primary-light)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
    </div>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* Animated Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary orb */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
            top: '-200px',
            right: '-100px',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        {/* Secondary orb */}
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, var(--accent-success) 0%, transparent 70%)',
            bottom: '-100px',
            left: '-50px',
            animation: 'float 10s ease-in-out infinite reverse',
          }}
        />
      </div>

      {/* Header with Theme Toggle */}
      <header className="relative z-10 flex justify-between items-center p-4 md:p-6">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
              boxShadow: 'var(--shadow-glow-primary)',
            }}
          >
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <span className="font-semibold hidden sm:block" style={{ color: 'var(--text-primary)' }}>
            AI Music Maker
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="max-w-2xl w-full text-center">
          {/* Sound Wave Animation */}
          <div className="flex justify-center mb-8">
            <div className="flex items-end gap-1 h-12">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full"
                  style={{
                    background: `linear-gradient(to top, var(--accent-primary), var(--accent-success))`,
                    height: `${20 + Math.random() * 80}%`,
                    animation: `soundWave ${0.8 + Math.random() * 0.4}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{
              background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--accent-primary) 50%, var(--accent-success) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            将你的哼唱
            <br />
            变成音乐
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl mb-10 max-w-lg mx-auto leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            录制你的旋律灵感,AI 为你编曲配器,
            <br className="hidden sm:block" />
            创作属于你的专属音乐
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/create"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white text-lg transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #9333EA 100%)',
                boxShadow: 'var(--shadow-glow-primary)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              开始创作
            </Link>

            <Link
              href="/library"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl font-medium text-lg transition-all duration-300 flex items-center justify-center gap-3 hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              我的作品
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <FeatureCard
              icon={
                <svg className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              }
              title="录音或上传"
              description="哼唱、清唱、弹奏都可以,支持多种音频格式"
              delay={100}
            />

            <FeatureCard
              icon={
                <svg className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
              title="AI 智能编曲"
              description="自动生成 A/B 两个版本,让你有更多选择"
              delay={200}
            />

            <FeatureCard
              icon={
                <svg className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              }
              title="一键分享"
              description="作品永久保存云端,随时分享给朋友"
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 pb-8 text-center">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: 'var(--accent-success)' }}
          />
          V0.11 · Beta
        </span>
      </footer>

      {/* CSS for sound wave animation */}
      <style jsx>{`
        @keyframes soundWave {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(3deg);
          }
        }
      `}</style>
    </main>
  )
}
