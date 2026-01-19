'use client'

import { useState } from 'react'

interface LyricsDisplayProps {
  lyrics?: string | null
  className?: string
  maxHeight?: string
}

export function LyricsDisplay({ lyrics, className = '', maxHeight = '400px' }: LyricsDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!lyrics || lyrics.trim() === '') {
    return null
  }

  // 解析歌词，保留换行和段落结构
  const lines = lyrics.split('\n').filter(line => line.trim() !== '')

  // 判断是否需要折叠
  const needsCollapse = lines.length > 15
  const displayLines = needsCollapse && !isExpanded ? lines.slice(0, 15) : lines

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">歌词</h3>
        {needsCollapse && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-primary-600 hover:text-primary-700"
          >
            {isExpanded ? '收起' : '展开全部'}
          </button>
        )}
      </div>

      <div
        className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap overflow-y-auto"
        style={{ maxHeight: isExpanded ? 'none' : maxHeight }}
      >
        {displayLines.map((line, index) => {
          // 检测是否是段落标记（如 [Verse 1], [Chorus] 等）
          const isSectionMarker = line.trim().startsWith('[') && line.trim().endsWith(']')

          return (
            <div
              key={index}
              className={`${
                isSectionMarker
                  ? 'font-semibold text-primary-600 mt-4 first:mt-0'
                  : 'text-gray-700'
              }`}
            >
              {line}
            </div>
          )
        })}

        {needsCollapse && !isExpanded && (
          <div className="mt-2 text-center">
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              ... 查看更多
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
