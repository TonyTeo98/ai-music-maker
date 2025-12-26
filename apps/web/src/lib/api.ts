// API 客户端配置

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

// 健康检查
export async function checkHealth() {
  return apiFetch<{ status: string; timestamp: string }>('/health')
}
