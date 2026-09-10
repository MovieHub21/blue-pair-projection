'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'

function StaffLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) { setError(error.message === 'Invalid login credentials' ? 'Incorrect email or password.' : error.message); return }
    router.push(params.get('redirect') || '/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8">
        <div className="flex items-center gap-2 font-display text-lg font-semibold mb-1">
          <ShieldCheck size={18} className="text-gold-500" />Blue Pair Staff Portal
        </div>
        <p className="text-sm text-navy-400 mb-7">Sign in with your staff credentials</p>
        {error && <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
        <label className="field-label">Work email</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="field-input mb-4" placeholder="you@bluepairhotel.com" />
        <label className="field-label">Password</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="field-input mb-6" placeholder="••••••••" />
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2">{loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-[11px] text-navy-400 text-center mt-6">Staff accounts are created by an administrator. Contact HR/IT if you need access.</p>
        <p className="text-[11px] text-navy-300 text-center mt-4">Guest? <Link href="/account/login" className="underline">Sign in to your booking account</Link></p>
      </form>
    </div>
  )
}

export default function StaffLoginPage() {
  return <Suspense><StaffLoginForm /></Suspense>
}
