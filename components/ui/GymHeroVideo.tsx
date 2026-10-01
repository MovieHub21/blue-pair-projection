'use client'

import { useEffect, useRef, useState } from 'react'

type Quality = '1080p' | '720p' | '480p' | '360p'

const SOURCES: Record<Quality, string> = {
  '1080p': '/gym/gym-1080.mp4',
  '720p': '/gym/gym-720.mp4',
  '480p': '/gym/gym-480.mp4',
  '360p': '/gym/gym-360.mp4',
}

function qualityForConnection(): Quality {
  if (typeof navigator === 'undefined') return '720p'

  const connection = (
    navigator as Navigator & {
      connection?: {
        effectiveType?: string
        downlink?: number
        saveData?: boolean
      }
    }
  ).connection

  if (connection?.saveData) return '360p'

  const downlink = connection?.downlink

  if (typeof downlink === 'number') {
    if (downlink >= 8) return '1080p'
    if (downlink >= 4) return '720p'
    if (downlink >= 1.5) return '480p'
    return '360p'
  }

  switch (connection?.effectiveType) {
    case '4g':
      return '720p'
    case '3g':
      return '480p'
    default:
      return '360p'
  }
}

export default function GymHeroVideo({
  poster = '/blue-pair-gym.jpeg',
}: {
  poster?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [quality, setQuality] = useState<Quality>('720p')

  useEffect(() => {
    const updateQuality = () => setQuality(qualityForConnection())

    updateQuality()

    const connection = (
      navigator as Navigator & {
        connection?: EventTarget
      }
    ).connection

    connection?.addEventListener('change', updateQuality)

    return () => connection?.removeEventListener('change', updateQuality)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const currentTime = video.currentTime
    const wasPlaying = !video.paused

    video.src = SOURCES[quality]
    video.load()

    const restorePlayback = () => {
      video.currentTime = currentTime
      if (wasPlaying) void video.play().catch(() => {})
      video.removeEventListener('loadedmetadata', restorePlayback)
    }

    video.addEventListener('loadedmetadata', restorePlayback)

    return () => video.removeEventListener('loadedmetadata', restorePlayback)
  }, [quality])

  return (
    <video
      ref={videoRef}
      className="absolute inset-0 h-full w-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-label="Blue Pair Hotel fitness gym"
    />
  )
}
