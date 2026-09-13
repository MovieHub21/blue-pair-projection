'use client'

import { ArrowLeft } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

interface BackButtonProps {
  fallback?: string
  className?: string
}

export default function BackButton({ fallback = '/', className = '' }: BackButtonProps) {
  const router = useRouter()
  const pathname = usePathname()

  if (pathname === '/') return null

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push(fallback)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back to the previous page"
      className={
        'group inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 px-3.5 py-2 text-[12px] font-semibold text-navy-700 shadow-[0_8px_30px_rgba(10,24,48,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-x-0.5 hover:border-navy-900/15 hover:bg-white hover:text-navy-950 hover:shadow-[0_12px_34px_rgba(10,24,48,0.12)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold-400/60 ' + className
      }
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-950 text-white transition-transform duration-300 group-hover:-translate-x-0.5">
        <ArrowLeft size={13} strokeWidth={2.4} />
      </span>
      <span>Back</span>
    </button>
  )
}
