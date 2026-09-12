'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle2, MessageSquare, UserRound } from 'lucide-react'
import { useAuth } from '../../../lib/useAuth'

const categories = ['Booking', 'Existing reservation', 'Rooms', 'Restaurant & dining', 'Events', 'Short-let', 'Facilities', 'Payment', 'Complaint', 'General enquiry', 'Other']

export default function ContactForm() {
  const { loading: authLoading, userId, email: accountEmail, profile } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', category: 'General enquiry', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [conversationId, setConversationId] = useState('')
  const [guestAccountRequired, setGuestAccountRequired] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading || !userId) return
    setForm(current => ({
      ...current,
      name: current.name || profile?.name || '',
      email: current.email || accountEmail || '',
      phone: current.phone || profile?.phone || '',
    }))
  }, [authLoading, userId, accountEmail, profile?.name, profile?.phone])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true); setError(''); setSent(false)
    try {
      const response = await fetch('/api/contact/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send your message.')
      setConversationId(data.conversationId || '')
      setGuestAccountRequired(Boolean(data.guestAccountRequired))
      setSent(true)
      setForm(current => ({ ...current, subject: '', category: 'General enquiry', message: '' }))
    } catch (e: any) {
      setError(e?.message || 'Unable to send your message.')
    } finally { setSending(false) }
  }

  const registerUrl = conversationId
    ? `/account/register?email=${encodeURIComponent(form.email)}&name=${encodeURIComponent(form.name)}&redirect=${encodeURIComponent(`/account/messages?conversation=${conversationId}`)}`
    : '/account/register'

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 flex gap-3 text-sm text-slate-700">
        <MessageSquare className="text-blue-700 shrink-0 mt-0.5" size={18} />
        <p>{userId ? 'You are signed in. Your name and email are already filled in, and this conversation will be available in your guest portal.' : 'Send a message and our team can continue the conversation with you. Create a guest account with the same email after sending so you can see replies in your portal.'}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="field-label">Full name</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="field-input" placeholder="Your name" disabled={authLoading || Boolean(userId)} /></div>
        <div><label className="field-label">Email</label><input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="field-input" placeholder="you@email.com" disabled={authLoading || Boolean(userId)} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><label className="field-label">Phone number <span className="text-slate-400">(optional)</span></label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="field-input" placeholder="0800 000 0000" disabled={Boolean(userId)} /></div>
        <div><label className="field-label">What can we help with?</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="field-input"><option value="">Select a category</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></div>
      </div>
      <div><label className="field-label">Subject</label><input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="field-input" placeholder="How can we help?" /></div>
      <div><label className="field-label">Message</label><textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="field-input !h-auto py-2.5" rows={6} maxLength={5000} placeholder="Tell us how we can help…" /></div>
      {error && <div className="rounded-xl bg-red-50 text-red-700 text-sm p-3">{error}</div>}
      {sent && <div className="rounded-xl bg-emerald-50 text-emerald-700 text-sm p-3 flex items-start gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Message sent successfully.</p>{guestAccountRequired ? <><p className="mt-0.5">Your conversation is saved. Create a guest account using <b>{form.email}</b> to see this conversation and future replies in your portal.</p><Link href={registerUrl} className="mt-3 inline-flex items-center gap-2 btn-primary !py-2 !px-3"><UserRound size={15} />Create your guest account</Link></> : <p className="mt-0.5">Blue Pair Hotel has been notified. You will receive an email when the team replies. {conversationId && <Link href={`/account/messages?conversation=${conversationId}`} className="font-semibold underline">Open your conversation</Link>}</p>}</div></div>}
      <button disabled={sending || authLoading} className="btn-primary w-fit disabled:opacity-60 flex items-center gap-2">{sending && <Loader2 size={15} className="animate-spin" />}{sending ? 'Sending…' : 'Send message'}</button>
    </form>
  )
}
