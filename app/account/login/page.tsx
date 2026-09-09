'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-6 py-16">
      <div className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8">
        <div className="flex items-center gap-2 font-display text-lg font-semibold mb-1"><span className="w-2 h-2 rounded-full bg-gold-500" />Blue Pair Hotel</div>
        <p className="text-sm text-navy-400 mb-7">Sign in to manage your bookings</p>
        <label className="field-label">Email</label>
        <input className="field-input mb-4" placeholder="you@email.com" defaultValue="adaeze.okonkwo@gmail.com" />
        <label className="field-label">Password</label>
        <input type="password" className="field-input mb-6" defaultValue="••••••••" />
        <button onClick={() => router.push('/account/dashboard')} className="btn-primary w-full justify-center">Sign in</button>
        <p className="text-xs text-navy-400 text-center mt-5">Don't have an account? <Link href="/account/register" className="text-navy-900 font-semibold">Register</Link></p>
        <p className="text-[11px] text-navy-300 text-center mt-6">Prototype — any credentials will sign you in.</p>
      </div>
    </div>
  )
}
