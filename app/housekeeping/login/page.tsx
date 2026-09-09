'use client'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export default function HousekeepingLoginPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0A1229' }}>
      <div className="w-full max-w-sm bg-white rounded-xl2 shadow-pop p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-gold-50 text-gold-600 flex items-center justify-center mx-auto mb-4"><Sparkles size={22}/></div>
        <h2 className="text-xl font-semibold mb-1">Housekeeping Portal</h2>
        <p className="text-sm text-navy-400 mb-7">Sign in with your staff account</p>
        <input className="field-input mb-4" placeholder="Staff ID" defaultValue="HK-0512" />
        <input type="password" className="field-input mb-6" placeholder="PIN" defaultValue="••••" />
        <button onClick={() => router.push('/housekeeping/dashboard')} className="btn-primary w-full justify-center">Sign in</button>
        <p className="text-[11px] text-navy-300 mt-6">Prototype — any credentials will sign you in.</p>
      </div>
    </div>
  )
}
