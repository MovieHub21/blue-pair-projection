'use client'

import { useEffect, useRef } from 'react'

export default function GymHeroVideo({
  poster = '/blue-pair-gym.jpeg',
}: {
  poster?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.src = 'GYMRUN.mp4'
    video.load()
  }, [])

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
