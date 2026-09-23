'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShieldCheck, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase/client'

console.info('[BP-AUTH][staff] login module loaded')

function StaffLoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.info('[BP-AUTH][staff] StaffLoginForm hydrated', { page: window.location.href, timestamp: new Date().toISOString() })
    return () => console.info('[BP-AUTH][staff] StaffLoginForm unmounted')
  }, [])

  async function submit(e: React.FormEvent) {
    console.info('[BP-AUTH][staff] FORM SUBMIT EVENT FIRED', { page: window.location.href, timestamp: new Date().toISOString() })
    e.preventDefault()
    setError(null)
    setLoading(true)

    const startedAt = Date.now()
    const loginEmail = email.trim().toLowerCase()
    console.info('[BP-AUTH][staff] login started', {
      email: loginEmail,
      page: window.location.href,
      timestamp: new Date().toISOString(),
    })

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      console.info('[BP-AUTH][staff] signInWithPassword completed', {
        elapsedMs: Date.now() - startedAt,
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id ?? null,
        error: authError
          ? {
              message: authError.message,
              name: authError.name,
              status: authError.status,
              code: authError.code,
            }
          : null,
      })

      if (authError) {
        console.error('[BP-AUTH][staff] authentication failed', authError)
        setError(authError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : authError.message)
        return
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      console.info('[BP-AUTH][staff] session check after login', {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id ?? null,
        error: sessionError
          ? {
              message: sessionError.message,
              name: sessionError.name,
              status: sessionError.status,
            }
          : null,
      })

      if (sessionError || !sessionData.session) {
        console.error('[BP-AUTH][staff] login returned without a usable session', {
          sessionError,
          hasSession: !!sessionData.session,
        })
        setError(sessionError?.message || 'Login succeeded but no session was created. Please try again.')
        return
      }

      const destination = params.get('redirect') || '/admin/dashboard'
      console.info('[BP-AUTH][staff] navigating after successful login', {
        destination,
        userId: sessionData.session.user.id,
      })

      router.replace(destination)
      return
    } catch (err: any) {
      console.error('[BP-AUTH][staff] unexpected login exception', {
        elapsedMs: Date.now() - startedAt,
        message: err?.message,
        name: err?.name,
        stack: err?.stack,
        error: err,
      })
      setError(err?.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-6 py-16">
      <form onInvalidCapture={(e) => console.warn('[BP-AUTH][staff] FORM VALIDATION BLOCKED SUBMIT', { target: (e.target as HTMLInputElement).name || (e.target as HTMLInputElement).type, valueMissing: (e.target as HTMLInputElement).validity?.valueMissing, typeMismatch: (e.target as HTMLInputElement).validity?.typeMismatch, validationMessage: (e.target as HTMLInputElement).validationMessage })} onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8">
        <div className="flex items-center gap-2 font-display text-lg font-semibold mb-1">
          <ShieldCheck size={18} className="text-gold-500" />Blue Pair Staff Portal
        </div>
        <p className="text-sm text-navy-400 mb-7">Sign in with your staff credentials</p>
        {error && <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
        <label className="field-label">Work email</label>
        <input type="email" name="email" required value={email} onChange={e => setEmail(e.target.value)} className="field-input mb-4" placeholder="you@bluepairhotel.com" />
        <label className="field-label">Password</label>
        <input type="password" name="password" required value={password} onChange={e => setPassword(e.target.value)} className="field-input mb-6" placeholder="••••••••" />
        <button type="submit" disabled={loading} onClick={() => console.info('[BP-AUTH][staff] SIGN IN BUTTON CLICKED', { disabled: loading, timestamp: new Date().toISOString() })} className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2">{loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-[11px] text-navy-400 text-center mt-6">Staff accounts are created by an administrator. Contact HR/IT if you need access.</p>
        <p className="text-[11px] text-navy-300 text-center mt-4">Guest? <Link href="/account/login" className="underline">Sign in to your booking account</Link></p>
      </form>
    </div>
  )
}

export default function StaffLoginPage() {
  return <Suspense><StaffLoginForm /></Suspense>
}
