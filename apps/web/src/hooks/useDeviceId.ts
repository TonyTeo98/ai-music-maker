'use client'

import { useState, useEffect } from 'react'

const DEVICE_ID_KEY = 'aimm_device_id'

function generateDeviceId(): string {
  // 生成类似 cuid 格式的 ID
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `dev_${timestamp}${random}`
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 从 localStorage 读取或生成新的 deviceId
    let id = localStorage.getItem(DEVICE_ID_KEY)

    if (!id) {
      id = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, id)
    }

    setDeviceId(id)
    setIsLoading(false)
  }, [])

  return { deviceId, isLoading }
}

// 同步获取 deviceId（用于 API 调用）
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') return null

  let id = localStorage.getItem(DEVICE_ID_KEY)

  if (!id) {
    id = generateDeviceId()
    localStorage.setItem(DEVICE_ID_KEY, id)
  }

  return id
}
