'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'

type Props = { eventId: string; eventTitle: string; eventDate: string; price: number; capacity: number }

export default function ReserveSpotButton({ eventId, eventTitle, eventDate, price, capacity }: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ guestName: '', guestEmail: '', guestPhone: '', guestCount: '1', notes: '' })

  function close() { if (!loading) { setOpen(false); setSubmitted(false); setError('') } }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const response = await fetch('/api/event-reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ eventId, ...form, guestCount: Number(form.guestCount) }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to submit reservation.')
      setSubmitted(true)
    } catch (err: any) { setError(err?.message || 'Unable to submit reservation.') } finally { setLoading(false) }
  }

  return <>
    <button onClick={() => setOpen(true)} className="btn-gold btn-sm">Reserve spot</button>
    {open && <div className="fixed inset-0 z-[80] bg-navy-950/65 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={e => { if (e.target === e.currentTarget) close() }}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-black/5 px-6 py-5 flex items-start justify-between">
          <div><span className="eyebrow">Event reservation</span><h2 className="font-display text-2xl text-navy-950 mt-1">{eventTitle}</h2><p className="text-xs text-navy-400 mt-1">{eventDate} · {capacity} capacity · ₦{price.toLocaleString('en-NG')} per person</p></div>
          <button onClick={close} className="p-2 rounded-full hover:bg-black/5"><X size={18} /></button>
        </div>
        {submitted ? <div className="p-8 text-center"><div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4"><CheckCircle2 size={30} /></div><h3 className="font-display text-2xl text-navy-950">Request received</h3><p className="text-sm text-navy-500 leading-6 mt-3">Your request has been sent to the reception team. We have emailed you a confirmation of the request. Your spot is not reserved yet; reception will email you again once it is confirmed.</p><button onClick={close} className="btn-primary mt-6">Done</button></div> : <form onSubmit={submit} className="p-6 grid gap-4">
          <div className="grid sm:grid-cols-2 gap-4"><div><label className="field-label">Full name *</label><input required className="field-input" value={form.guestName} onChange={e=>setForm({...form,guestName:e.target.value})} /></div><div><label className="field-label">Phone number *</label><input required className="field-input" type="tel" value={form.guestPhone} onChange={e=>setForm({...form,guestPhone:e.target.value})} /></div></div>
          <div><label className="field-label">Email address *</label><input required type="email" className="field-input" value={form.guestEmail} onChange={e=>setForm({...form,guestEmail:e.target.value})} /></div>
          <div><label className="field-label">Number of guests *</label><input required min="1" max="50" type="number" className="field-input" value={form.guestCount} onChange={e=>setForm({...form,guestCount:e.target.value})} /></div>
          <div><label className="field-label">Anything reception should know?</label><textarea rows={3} className="field-input !h-auto py-3" placeholder="Optional seating, accessibility or special requests" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
          {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}
          <button disabled={loading} className="btn-primary w-full justify-center">{loading ? <><Loader2 size={16} className="animate-spin" /> Sending request…</> : 'Request my spot'}</button>
          <p className="text-[11px] text-navy-400 text-center">Submitting this form requests a spot. Reception must confirm availability before it becomes reserved.</p>
        </form>}
      </div>
    </div>}
  </>
}
