'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-6 py-16">
      <div className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8">
        <div className="flex items-center gap-2 font-display text-lg font-semibold mb-1"><span className="w-2 h-2 rounded-full bg-gold-500" />Blue Pair Hotel</div>
        <p className="text-sm text-navy-400 mb-7">Create your guest account</p>
        <label className="field-label">Full name</label><input className="field-input mb-4" placeholder="Your name" />
        <label className="field-label">Email</label><input className="field-input mb-4" placeholder="you@email.com" />
        <label className="field-label">Phone</label><input className="field-input mb-4" placeholder="+234 800 000 0000" />
        <label className="field-label">Password</label><input type="password" className="field-input mb-6" placeholder="••••••••" />
        <button onClick={() => router.push('/account/dashboard')} className="btn-primary w-full justify-center">Create account</button>
        <p className="text-xs text-navy-400 text-center mt-5">Already registered? <Link href="/account/login" className="text-navy-900 font-semibold">Sign in</Link></p>
      </div>
    </div>
  )
}
