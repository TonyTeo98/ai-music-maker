'use client'

import { useEffect, useCallback } from 'react'
import { DeviceItem } from './DeviceItem'
import type { MicrophoneDevice } from './useMicrophoneDevices'

interface MicrophoneSelectorProps {
  isOpen: boolean
  onClose: () => void
  devices: MicrophoneDevice[]
  selectedDeviceId: string | null
  onSelect: (deviceId: string) => void
  hasBluetooth: boolean
  isLoading: boolean
  error: string | null
}

export function MicrophoneSelector({
  isOpen,
  onClose,
  devices,
  selectedDeviceId,
  onSelect,
  hasBluetooth,
  isLoading,
  error,
}: MicrophoneSelectorProps) {
  const handleSelect = useCallback(
    (deviceId: string) => {
      onSelect(deviceId)
      onClose()
    },
    [onSelect, onClose]
  )

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 面板 */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-soft-lg animate-slide-up safe-bottom">
        {/* 拖拽指示器 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* 标题栏 */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h3 className="text-lg font-semibold text-neutral-900">选择麦克风</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 transition-colors"
          >
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 内容区 */}
        <div className="px-5 pb-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="py-8 text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-neutral-500 mt-3">正在获取设备列表...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-error-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-error-600">{error}</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-neutral-500">未检测到麦克风设备</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devices.map(device => (
                <DeviceItem
                  key={device.deviceId}
                  device={device}
                  isSelected={device.deviceId === selectedDeviceId}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {/* 蓝牙警告 */}
          {hasBluetooth && !isLoading && !error && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-yellow-700">
                  蓝牙设备可能导致录音问题。如遇到无声或卡顿，请切换到内置或有线麦克风。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
