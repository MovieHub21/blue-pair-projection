'use client'

import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-full border-2 border-black/10 border-t-gold-500 animate-spin" />
        <span className="text-sm font-medium text-navy-950">Loading…</span>
        <Loader2 size={14} className="text-gold-600 animate-spin" />
      </div>
    </div>
  )
}
