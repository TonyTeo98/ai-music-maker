'use client'

import type { MicrophoneDevice } from './useMicrophoneDevices'

interface DeviceItemProps {
  device: MicrophoneDevice
  isSelected: boolean
  onSelect: (deviceId: string) => void
}

function BluetoothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z" />
    </svg>
  )
}

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
    </svg>
  )
}

export function DeviceItem({ device, isSelected, onSelect }: DeviceItemProps) {
  return (
    <button
      onClick={() => onSelect(device.deviceId)}
      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3 ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isSelected ? 'bg-primary-100' : 'bg-neutral-100'
        }`}
      >
        {device.isBluetooth ? (
          <BluetoothIcon
            className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-neutral-500'}`}
          />
        ) : (
          <MicrophoneIcon
            className={`w-5 h-5 ${isSelected ? 'text-primary-600' : 'text-neutral-500'}`}
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium truncate ${
            isSelected ? 'text-primary-700' : 'text-neutral-700'
          }`}
        >
          {device.label}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {device.isDefault && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600">
              默认设备
            </span>
          )}
          {device.isBluetooth && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
              蓝牙
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  )
}
