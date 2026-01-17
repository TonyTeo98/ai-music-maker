'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'

type Size = 'small' | 'medium' | 'large'

interface CoverImageProps {
  imageUrl?: string | null
  imageLargeUrl?: string | null
  alt: string
  size?: Size
  className?: string
}

const sizeConfig: Record<Size, { width: number; height: number; className: string }> = {
  small: { width: 48, height: 48, className: 'w-12 h-12' },
  medium: { width: 96, height: 96, className: 'w-24 h-24' },
  large: { width: 192, height: 192, className: 'w-48 h-48' },
}

export function CoverImage({
  imageUrl,
  imageLargeUrl,
  alt,
  size = 'medium',
  className = '',
}: CoverImageProps) {
  const [hasError, setHasError] = useState(false)
  const config = sizeConfig[size]

  const src = size === 'large' && imageLargeUrl ? imageLargeUrl : imageUrl

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  const showFallback = hasError || !src

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${config.className} ${className}`}
    >
      {showFallback ? (
        <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500" />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={config.width}
          height={config.height}
          className="object-cover w-full h-full"
          onError={handleError}
          unoptimized={src.startsWith('http')}
        />
      )}
    </div>
  )
}
