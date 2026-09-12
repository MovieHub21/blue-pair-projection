'use client'

import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-black/10 border-t-gold-500 flex items-center justify-center animate-spin">
          <Loader2 size={18} className="text-gold-600" />
        </div>
        <div>
          <p className="font-semibold text-navy-950">Loading hotel data</p>
          <p className="text-xs text-navy-400 mt-1">Please wait while the latest information is loaded.</p>
        </div>
      </div>
    </div>
  )
}
