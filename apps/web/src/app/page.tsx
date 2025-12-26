export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          AI Music Maker
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          将你的哼唱变成音乐
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/create"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            开始创作
          </a>
        </div>
        <p className="mt-8 text-sm text-gray-400">
          V0.1 - 开发中
        </p>
      </div>
    </main>
  )
}
