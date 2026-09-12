'use client'

import { FormEvent, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true); setError(''); setSent(false)
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send your message.')
      setSent(true); setForm({ name: '', email: '', subject: '', message: '' })
    } catch (e: any) {
      setError(e?.message || 'Unable to send your message.')
    } finally { setSending(false) }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="field-label">Full name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="field-input" placeholder="Your name" /></div>
        <div><label className="field-label">Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="field-input" placeholder="you@email.com" /></div>
      </div>
      <div><label className="field-label">Subject</label><input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="field-input" placeholder="How can we help?" /></div>
      <div><label className="field-label">Message</label><textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="field-input !h-auto py-2.5" rows={5} placeholder="Tell us how we can help…" /></div>
      {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
      {sent && <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm p-3 flex items-center gap-2"><CheckCircle2 size={16} />Your message has been sent. Blue Pair Hotel will get back to you.</div>}
      <button disabled={sending} className="btn-primary w-fit disabled:opacity-60 flex items-center gap-2">{sending && <Loader2 size={15} className="animate-spin" />}{sending ? 'Sending…' : 'Send message'}</button>
    </form>
  )
}
