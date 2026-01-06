'use client'

import { useState } from 'react'

export interface AdvancedSettingsData {
  excludeStyles: string[]
  voiceType: 'female' | 'male' | 'instrumental' | null
  textMode: 'exact' | 'auto' | null
  tension: number
  styleLock: number
}

interface AdvancedSettingsProps {
  value: AdvancedSettingsData
  onChange: (value: AdvancedSettingsData) => void
  className?: string
}

const EXCLUDE_STYLE_OPTIONS = [
  { value: 'rap', label: '说唱' },
  { value: 'metal', label: '金属' },
  { value: 'opera', label: '歌剧' },
  { value: 'country', label: '乡村' },
  { value: 'reggae', label: '雷鬼' },
  { value: 'punk', label: '朋克' },
]

const VOICE_TYPE_OPTIONS = [
  { value: 'female', label: '女声', icon: '♀' },
  { value: 'male', label: '男声', icon: '♂' },
  { value: 'instrumental', label: '纯伴奏', icon: '♪' },
] as const

const TEXT_MODE_OPTIONS = [
  { value: 'exact', label: '按我写的来', description: '严格按照歌词生成' },
  { value: 'auto', label: '系统帮我整理', description: 'AI 优化歌词结构' },
] as const

export function AdvancedSettings({ value, onChange, className = '' }: AdvancedSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExcludeStyle = (style: string) => {
    const newExclude = value.excludeStyles.includes(style)
      ? value.excludeStyles.filter((s) => s !== style)
      : [...value.excludeStyles, style]
    onChange({ ...value, excludeStyles: newExclude })
  }

  const setVoiceType = (type: typeof value.voiceType) => {
    onChange({ ...value, voiceType: value.voiceType === type ? null : type })
  }

  const setTextMode = (mode: typeof value.textMode) => {
    onChange({ ...value, textMode: value.textMode === mode ? null : mode })
  }

  const hasSettings =
    value.excludeStyles.length > 0 ||
    value.voiceType !== null ||
    value.textMode !== null ||
    value.tension !== 50 ||
    value.styleLock !== 50

  return (
    <div className={`rounded-2xl border border-neutral-200 overflow-hidden transition-all duration-300 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            hasSettings ? 'bg-primary-100' : 'bg-neutral-200'
          }`}>
            <svg
              className={`w-4 h-4 transition-all duration-300 ${
                hasSettings ? 'text-primary-600' : 'text-neutral-500'
              } ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <div className="text-left">
            <span className="font-medium text-neutral-900">高级设置</span>
            {hasSettings && (
              <span className="ml-2 tag tag-primary text-2xs">已配置</span>
            )}
          </div>
        </div>
        <span className="text-xs text-neutral-400">可选</span>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="p-5 space-y-6 border-t border-neutral-200 animate-fade-in">
          {/* Exclude Styles */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              不想要的风格
            </label>
            <div className="flex flex-wrap gap-2">
              {EXCLUDE_STYLE_OPTIONS.map((option) => {
                const isSelected = value.excludeStyles.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => toggleExcludeStyle(option.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-all duration-200 ${
                      isSelected
                        ? 'border-error-300 bg-error-50 text-error-600'
                        : 'border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Voice Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              成品形态
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VOICE_TYPE_OPTIONS.map((option) => {
                const isSelected = value.voiceType === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setVoiceType(option.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span className={`text-2xl ${isSelected ? 'text-primary-600' : 'text-neutral-400'}`}>
                      {option.icon}
                    </span>
                    <p className={`text-sm mt-2 font-medium ${isSelected ? 'text-primary-700' : 'text-neutral-700'}`}>
                      {option.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Text Mode */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              歌词处理方式
            </label>
            <div className="space-y-2">
              {TEXT_MODE_OPTIONS.map((option) => {
                const isSelected = value.textMode === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setTextMode(option.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-primary-500 bg-primary-500' : 'border-neutral-300'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-neutral-700'}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">{option.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-5">
            {/* Tension Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-700">创作张力</label>
                <span className="text-sm text-primary-600 font-medium">{value.tension}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={value.tension}
                onChange={(e) => onChange({ ...value, tension: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-2">
                <span>保守</span>
                <span>激进</span>
              </div>
            </div>

            {/* Style Lock Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-neutral-700">风格锁定</label>
                <span className="text-sm text-primary-600 font-medium">{value.styleLock}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={value.styleLock}
                onChange={(e) => onChange({ ...value, styleLock: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-neutral-400 mt-2">
                <span>自由发挥</span>
                <span>严格遵循</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const defaultAdvancedSettings: AdvancedSettingsData = {
  excludeStyles: [],
  voiceType: null,
  textMode: null,
  tension: 50,
  styleLock: 50,
}
