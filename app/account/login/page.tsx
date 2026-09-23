'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase/client'
import { Loader2 } from 'lucide-react'

console.info('[BP-AUTH][guest] login module loaded')

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.info('[BP-AUTH][guest] LoginForm hydrated', { page: window.location.href, timestamp: new Date().toISOString() })
    return () => console.info('[BP-AUTH][guest] LoginForm unmounted')
  }, [])

  async function submit(e: React.FormEvent) {
    console.info('[BP-AUTH][guest] FORM SUBMIT EVENT FIRED', { page: window.location.href, timestamp: new Date().toISOString() })
    e.preventDefault()
    setError(null)
    setLoading(true)

    const startedAt = Date.now()
    const loginEmail = email.trim().toLowerCase()
    console.info('[BP-AUTH][guest] login started', {
      email: loginEmail,
      page: window.location.href,
      timestamp: new Date().toISOString(),
    })

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      })

      console.info('[BP-AUTH][guest] signInWithPassword completed', {
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
        console.error('[BP-AUTH][guest] authentication failed', authError)
        setError(authError.message === 'Invalid login credentials' ? 'Incorrect email or password.' : authError.message)
        return
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      console.info('[BP-AUTH][guest] session check after login', {
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
        console.error('[BP-AUTH][guest] login returned without a usable session', {
          sessionError,
          hasSession: !!sessionData.session,
        })
        setError(sessionError?.message || 'Login succeeded but no session was created. Please try again.')
        return
      }

      const destination = params.get('redirect') || '/account/dashboard'
      console.info('[BP-AUTH][guest] navigating after successful login', {
        destination,
        userId: sessionData.session.user.id,
      })

      router.push(destination)
      router.refresh()
    } catch (err: any) {
      console.error('[BP-AUTH][guest] unexpected login exception', {
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
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-5 py-12 sm:px-6 sm:py-16">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-7 sm:p-8">
        <div className="flex justify-center mb-5"><img src="/icon-192.png" alt="Blue Pair Hotel" className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl object-cover" /></div>
        <p className="text-sm text-navy-400 mb-7 text-center">Sign in to manage your bookings</p>
        {error && <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
        <label className="field-label">Email</label>
        <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="field-input mb-4" placeholder="you@email.com" />
        <label className="field-label">Password</label>
        <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="field-input mb-2" placeholder="••••••••" />
        <div className="flex justify-end mb-5"><Link href="/account/forgot-password" className="text-xs font-semibold text-navy-700 hover:text-gold-600">Forgot password?</Link></div>
        <button type="submit" disabled={loading} onClick={() => console.info('[BP-AUTH][guest] SIGN IN BUTTON CLICKED', { disabled: loading, timestamp: new Date().toISOString() })} className="btn-primary w-full justify-center disabled:opacity-60 flex items-center gap-2">{loading && <Loader2 size={15} className="animate-spin" />}{loading ? 'Signing in…' : 'Sign in'}</button>
        <p className="text-xs text-navy-400 text-center mt-5">Don't have an account? <Link href="/account/register" className="text-navy-900 font-semibold">Register</Link></p>
      </form>
    </div>
  )
}

export default function LoginPage() { return <Suspense><LoginForm /></Suspense> }
