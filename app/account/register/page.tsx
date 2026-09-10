'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase/client'
import { ensureCustomer } from '../../../lib/useAuth'

function RegisterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { name, phone } },
    })
    if (error) {
      setLoading(false)
      setError(error.message.includes('already registered') || error.message.includes('already been registered')
        ? 'An account with this email already exists.' : error.message)
      return
    }
    const user = data.user
    if (user) {
      await supabase.from('profiles').upsert({ id: user.id, name, email, phone })
      await ensureCustomer(user.id, name, email, phone)
    }
    setLoading(false)
    if (!data.session) { setCheckEmail(true); return }
    router.push(params.get('redirect') || '/account/dashboard')
    router.refresh()
  }

  if (checkEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-navy-950 px-6 py-16">
        <div className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
          <h2 className="font-display text-lg font-semibold mb-2">Check your email</h2>
          <p className="text-sm text-navy-500">We've sent a confirmation link to <b>{email}</b>. Confirm your address, then sign in.</p>
          <Link href="/account/login" className="btn-primary w-full justify-center mt-6">Go to sign in</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-6 py-16">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8">
        <div className="flex items-center gap-2 font-display text-lg font-semibold mb-1"><span className="w-2 h-2 rounded-full bg-gold-500" />Blue Pair Hotel</div>
        <p className="text-sm text-navy-400 mb-7">Create your guest account</p>
        {error && <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
        <label className="field-label">Full name</label><input required value={name} onChange={e => setName(e.target.value)} className="field-input mb-4" placeholder="Your name" />
        <label className="field-label">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="field-input mb-4" placeholder="you@email.com" />
        <label className="field-label">Phone</label><input required value={phone} onChange={e => setPhone(e.target.value)} className="field-input mb-4" placeholder="+234 800 000 0000" />
        <label className="field-label">Password</label><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="field-input mb-6" placeholder="••••••••" />
        <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">{loading ? 'Creating account…' : 'Create account'}</button>
        <p className="text-xs text-navy-400 text-center mt-5">Already registered? <Link href="/account/login" className="text-navy-900 font-semibold">Sign in</Link></p>
      </form>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
