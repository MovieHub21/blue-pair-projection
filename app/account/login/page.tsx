'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase/client'
import { Loader2 } from 'lucide-react'

function LoginForm() {
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
    router.push(params.get('redirect') || '/account/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8">
        <div className="flex items-center gap-2 font-display text-lg font-semibold mb-1"><img src="/icon-192.png" alt="Blue Pair" className="w-8 h-8 rounded-lg object-cover" />Blue Pair Hotel</div>
        <p className="text-sm text-navy-400 mb-7">Sign in to manage your bookings</p>
        {error && <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
        <label className="field-label">Email</label>
        <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="field-input mb-4" placeholder="you@email.com" />
        <label className="field-label">Password</label>
        <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="field-input mb-2" placeholder="••••••••" />
        <div className="flex justify-end mb-5"><Link href="/account/forgot-password" className="text-xs font-semibold text-navy-700 hover:text-gold-600">Forgot password?</Link></div>
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2">{loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-xs text-navy-400 text-center mt-5">Don't have an account? <Link href="/account/register" className="text-navy-900 font-semibold">Register</Link></p>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
