'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { supabase } from '../../../../lib/supabase/client'
import { initials } from '../../../../lib/format'

export default function ProfileClient({ name, email, phone }: { name: string; email: string; phone: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name, phone })
  const [country, setCountry] = useState('Nigeria')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const loading = saving || isPending

  async function save() {
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('profiles').update({ name: form.name, phone: form.phone }).eq('id', user.id)
    await supabase.from('customers').update({ name: form.name, phone: form.phone }).eq('user_id', user.id)
    setSaving(false)
    setSaved(true)
    startTransition(() => router.refresh())
  }

  return (
    <div className="card p-6 max-w-lg">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-lg">{initials(form.name || 'G')}</div>
        <div><b className="block">{form.name || 'Guest'}</b><span className="pill-gold">Member</span></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="field-label">Full name</label><input className="field-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><label className="field-label">Phone</label><input className="field-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        <div><label className="field-label">Email</label><input className="field-input" value={email} disabled /></div>
        <div><label className="field-label">Country</label><input className="field-input" value={country} onChange={e => setCountry(e.target.value)} /></div>
      </div>
      <div className="flex items-center gap-3 mt-6">
        <button onClick={save} disabled={loading} className="btn-outline disabled:opacity-60 flex items-center gap-1.5">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? 'Saving…' : 'Save changes'}
        </button>
        {saved && !loading && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
      </div>
    </div>
  )
}
