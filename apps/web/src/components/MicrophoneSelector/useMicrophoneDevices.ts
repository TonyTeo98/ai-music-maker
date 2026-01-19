'use client'

import { useState, useEffect, useCallback } from 'react'

export interface MicrophoneDevice {
  deviceId: string
  label: string
  isBluetooth: boolean
  isDefault: boolean
}

interface UseMicrophoneDevicesReturn {
  devices: MicrophoneDevice[]
  selectedDeviceId: string | null
  setSelectedDeviceId: (deviceId: string | null) => void
  hasMultipleDevices: boolean
  hasBluetooth: boolean
  isLoading: boolean
  error: string | null
  refreshDevices: () => Promise<void>
}

const BLUETOOTH_KEYWORDS = ['bluetooth', 'airpods', 'headset', 'buds', 'wireless']

function isBluetooth(label: string): boolean {
  const lower = label.toLowerCase()
  return BLUETOOTH_KEYWORDS.some(keyword => lower.includes(keyword))
}

export function useMicrophoneDevices(): UseMicrophoneDevicesReturn {
  const [devices, setDevices] = useState<MicrophoneDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const enumerateDevices = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 先请求权限以获取完整 label
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())

      const allDevices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = allDevices
        .filter(device => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `麦克风 ${index + 1}`,
          isBluetooth: isBluetooth(device.label),
          isDefault: device.deviceId === 'default' || index === 0,
        }))

      setDevices(audioInputs)

      // 自动选择策略：优先非蓝牙设备
      if (audioInputs.length > 0 && !selectedDeviceId) {
        const nonBluetooth = audioInputs.find(d => !d.isBluetooth)
        setSelectedDeviceId(nonBluetooth?.deviceId ?? audioInputs[0].deviceId)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setError('麦克风权限被拒绝')
      } else {
        setError('无法获取麦克风设备列表')
      }
    } finally {
      setIsLoading(false)
    }
  }, [selectedDeviceId])

  useEffect(() => {
    enumerateDevices()

    // 监听设备热插拔
    const handleDeviceChange = () => {
      enumerateDevices()
    }

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange)
    }
  }, [enumerateDevices])

  const hasMultipleDevices = devices.length > 1
  const hasBluetooth = devices.some(d => d.isBluetooth)

  return {
    devices,
    selectedDeviceId,
    setSelectedDeviceId,
    hasMultipleDevices,
    hasBluetooth,
    isLoading,
    error,
    refreshDevices: enumerateDevices,
  }
}
