/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 输出独立部署包（适合 Docker）
  output: 'standalone',
}

module.exports = nextConfig
