'use client'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function RouteProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setVisible(true)
    setWidth(20)
    timers.current.push(setTimeout(() => setWidth(65), 120))
    timers.current.push(setTimeout(() => setWidth(85), 350))
    timers.current.push(setTimeout(() => { setWidth(100); }, 550))
    timers.current.push(setTimeout(() => { setVisible(false); setWidth(0) }, 750))
    return () => { timers.current.forEach(clearTimeout) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams?.toString()])

  if (!visible) return null
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2.5px] bg-transparent pointer-events-none">
      <div className="h-full bg-gold-500 transition-all duration-300 ease-out" style={{ width: `${width}%` }} />
    </div>
  )
}
