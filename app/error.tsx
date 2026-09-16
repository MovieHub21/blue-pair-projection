'use client'

import { useEffect } from 'react'
import { AlertTriangle, ArrowLeft, Home, RefreshCw } from 'lucide-react'

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep technical error details out of the UI. Next.js/Vercel can still
    // capture the underlying error through its normal server logging.
    console.error('Blue Pair application error', { digest: error?.digest })
  }, [])

  return (
    <main className="min-h-screen bg-[#070d1a] px-5 py-12 text-white flex items-center justify-center">
      <section className="w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
          <AlertTriangle className="h-7 w-7 text-[#d4b06a]" aria-hidden="true" />
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-[#d4b06a]">Blue Pair</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Something went wrong</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/60 sm:text-base">
          We couldn’t complete that request right now. Your information has not been intentionally exposed. Please try again.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => reset()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#d4b06a] px-6 py-3 text-sm font-semibold text-[#070d1a] transition hover:brightness-110">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
          <a href="/" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]">
            <Home className="h-4 w-4" aria-hidden="true" /> Go home
          </a>
          <button onClick={() => window.history.back()} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/[0.06]">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Go back
          </button>
        </div>
      </section>
    </main>
  )
}
