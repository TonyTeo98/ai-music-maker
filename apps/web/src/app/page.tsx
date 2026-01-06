import Link from 'next/link'

// Sound wave animation component
function SoundWave({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-end gap-1 h-8 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="sound-wave-bar"
          style={{
            height: `${60 + Math.random() * 40}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  )
}

// Floating music note
function MusicNote({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg
      className={`w-6 h-6 text-primary-300 animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
    </svg>
  )
}

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-warm" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />

      {/* Floating music notes */}
      <MusicNote className="absolute top-[15%] left-[10%] opacity-40" delay={0} />
      <MusicNote className="absolute top-[25%] right-[15%] opacity-30" delay={0.5} />
      <MusicNote className="absolute bottom-[30%] left-[20%] opacity-25" delay={1} />
      <MusicNote className="absolute top-[60%] right-[10%] opacity-35" delay={1.5} />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* Logo/Brand */}
          <div className="mb-8 animate-fade-in-down">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-primary shadow-glow-primary mb-6">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 animate-fade-in-up text-balance">
            <span className="text-neutral-900">将你的</span>
            <span className="text-gradient">哼唱</span>
            <br className="hidden sm:block" />
            <span className="text-neutral-900">变成音乐</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-neutral-500 mb-10 animate-fade-in-up max-w-md mx-auto" style={{ animationDelay: '0.1s' }}>
            录制你的旋律灵感，AI 为你编曲配器，创作属于你的专属音乐
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link
              href="/create"
              className="group relative w-full sm:w-auto"
            >
              <div className="absolute -inset-0.5 bg-gradient-primary rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
              <div className="relative btn btn-lg bg-gradient-primary text-white w-full sm:w-auto px-8">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                开始创作
              </div>
            </Link>

            <Link
              href="/library"
              className="btn btn-lg btn-secondary w-full sm:w-auto px-8"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              我的作品
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="group p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 hover:bg-white hover:shadow-soft-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">录音或上传</h3>
              <p className="text-sm text-neutral-500">哼唱、清唱都可以</p>
            </div>

            <div className="group p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 hover:bg-white hover:shadow-soft-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">AI 编曲</h3>
              <p className="text-sm text-neutral-500">生成 A/B 两个版本</p>
            </div>

            <div className="group p-5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 hover:bg-white hover:shadow-soft-md transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-success-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">一键分享</h3>
              <p className="text-sm text-neutral-500">作品库永久保存</p>
            </div>
          </div>

          {/* Version tag */}
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <span className="tag tag-primary">
              V0.11 · Beta
            </span>
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
    </main>
  )
}
