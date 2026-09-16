'use client'

import { useState } from 'react'
import { CheckCircle2, Clock3, Loader2, ShieldAlert, XCircle } from 'lucide-react'

export default function RateLimitTestPage() {
  const [results, setResults] = useState<Array<{ n: number; status: number }>>([])
  const [running, setRunning] = useState(false)

  async function runTest() {
    setRunning(true)
    setResults([])
    const next: Array<{ n: number; status: number }> = []

    for (let n = 1; n <= 6; n += 1) {
      const response = await fetch('/api/rate-limit-test', { method: 'POST' })
      next.push({ n, status: response.status })
      setResults([...next])
    }

    setRunning(false)
  }

  return (
    <main className="min-h-screen bg-navy-950 px-5 py-12 text-white sm:px-6 sm:py-16">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10 text-gold-300 ring-1 ring-gold-400/20">
            <ShieldAlert size={26} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-gold-300">Blue Pair Developer Test</p>
          <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Rate-limit experience</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/60">This development-only page sends six requests so you can see exactly what a guest sees when the fifth request has been reached.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur-xl sm:p-7">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-sm font-semibold">Limit: 5 requests / minute</p>
              <p className="mt-1 text-xs text-white/45">The sixth request should return HTTP 429.</p>
            </div>
            <Clock3 size={20} className="text-gold-300" />
          </div>

          <button type="button" onClick={runTest} disabled={running} className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gold-400 px-5 py-3.5 text-sm font-bold text-navy-950 transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
            {running ? <Loader2 size={17} className="animate-spin" /> : <ShieldAlert size={17} />}
            {running ? 'Testing rate limit…' : 'Run 6-request test'}
          </button>

          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              {results.map(result => (
                <div key={result.n} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm">
                  <span className="text-white/70">Request {result.n}</span>
                  <span className={result.status === 429 ? 'flex items-center gap-1.5 font-semibold text-red-300' : 'flex items-center gap-1.5 font-semibold text-emerald-300'}>
                    {result.status === 429 ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                    HTTP {result.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-white/35">Developer test only. The test endpoint returns 404 outside development and has no booking, payment, or email side effects.</p>
      </div>
    </main>
  )
}
