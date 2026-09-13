'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase/client'
import { SITE_URL } from '../../../lib/siteConfig'
import { Loader2, ArrowLeft, Mail } from 'lucide-react'

function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${SITE_URL}/auth/callback?next=/account/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-5 py-12">
      <div className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-7 sm:p-8">
        <Link href="/account/login" className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-navy-900 mb-6"><ArrowLeft size={14} /> Back to sign in</Link>
        <div className="flex items-center gap-2 font-display text-lg font-semibold mb-1"><img src="/icon-192.png" alt="Blue Pair" className="w-8 h-8 rounded-lg object-cover" />Blue Pair Hotel</div>
        <p className="text-sm text-navy-400 mb-7">Reset your guest account password</p>

        {sent ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4"><Mail size={21} /></div>
            <h2 className="font-display text-lg font-semibold mb-2">Check your email</h2>
            <p className="text-sm text-navy-500 leading-relaxed">If an account exists for <b>{email}</b>, we sent a secure password reset link. The link will return you to Blue Pair to choose a new password.</p>
            <Link href="/account/login" className="btn-primary w-full justify-center mt-6">Back to sign in</Link>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
            <label className="field-label">Email address</label>
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="field-input mb-5" placeholder="you@email.com" />
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2">{loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Sending link…' : 'Send reset link'}</button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return <Suspense><ForgotPasswordForm /></Suspense>
}
