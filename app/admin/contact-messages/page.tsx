'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ChevronLeft, Clock3, Loader2, MessageSquare, Send, UserRound } from 'lucide-react'

type Conversation = { id: string; guest_name: string; guest_email: string; guest_phone?: string; subject: string; category: string; status: string; priority: string; last_message_at: string; created_at: string }
type Message = { id: string; sender_type: 'guest' | 'staff'; message: string; created_at: string }
const statuses = [{ value: 'open', label: 'Open' }, { value: 'waiting_for_staff', label: 'Waiting for staff' }, { value: 'waiting_for_guest', label: 'Waiting for guest' }, { value: 'resolved', label: 'Resolved' }]
function formatDate(value: string) { return new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) }
function statusLabel(value: string) { return statuses.find(status => status.value === value)?.label || value }

export default function ContactMessagesPage() {
  const searchParams = useSearchParams()
  const requestedId = searchParams.get('conversation')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState(requestedId || '')
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function loadList(preferredId?: string) {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/admin/contact-messages', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load guest messages.')
      const list = data.conversations || []
      setConversations(list)
      const nextId = preferredId || selectedId || list[0]?.id || ''
      setSelectedId(nextId)
      if (nextId) await loadConversation(nextId)
    } catch (e: any) { setError(e?.message || 'Unable to load guest messages.') }
    finally { setLoading(false) }
  }

  async function loadConversation(id: string) {
    setDetailLoading(true); setError('')
    try {
      const response = await fetch(`/api/admin/contact-messages/${id}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load conversation.')
      setSelected(data.conversation); setMessages(data.messages || [])
      setConversations(current => current.map(item => item.id === id ? { ...item, ...data.conversation } : item))
    } catch (e: any) { setError(e?.message || 'Unable to load conversation.') }
    finally { setDetailLoading(false) }
  }

  useEffect(() => { loadList(requestedId || undefined) }, [])

  const filtered = useMemo(() => conversations.filter(item => (filter === 'all' || item.status === filter) && (!search || `${item.guest_name} ${item.guest_email} ${item.subject} ${item.category}`.toLowerCase().includes(search.toLowerCase()))).sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at)), [conversations, filter, search])
  const counts = useMemo(() => ({ all: conversations.length, waiting: conversations.filter(item => item.status === 'waiting_for_staff').length, urgent: conversations.filter(item => item.priority === 'urgent' && item.status !== 'resolved').length }), [conversations])

  async function updateConversation(payload: { status?: string; priority?: string }) {
    if (!selectedId) return
    const response = await fetch(`/api/admin/contact-messages/${selectedId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Unable to update conversation.')
    setSelected(data.conversation); setConversations(current => current.map(item => item.id === selectedId ? { ...item, ...data.conversation } : item))
  }

  async function sendReply() {
    if (!selectedId || !reply.trim()) return
    setSending(true); setError('')
    try {
      const response = await fetch('/api/admin/contact-messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ conversationId: selectedId, message: reply.trim() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send reply.')
      setReply('')
      await loadConversation(selectedId)
    } catch (e: any) { setError(e?.message || 'Unable to send reply.') }
    finally { setSending(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.22em] text-blue-700 font-semibold">Front desk communication</p><h1 className="text-2xl md:text-3xl font-semibold text-slate-950 mt-1">Guest Messages</h1><p className="text-slate-500 mt-2">Reply to website enquiries and keep every guest conversation in one place.</p></div><div className="flex gap-2 text-xs"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600">{counts.all} total</span><span className="rounded-full bg-blue-50 px-3 py-1.5 text-blue-700">{counts.waiting} need reply</span>{counts.urgent > 0 && <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">{counts.urgent} urgent</span>}</div></div>
      {error && <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 p-3 text-sm">{error}</div>}
      <div className="grid xl:grid-cols-[360px_1fr] gap-5 min-h-[680px]">
        <aside className={`${selectedId ? 'hidden xl:flex' : 'flex'} flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 space-y-3"><input value={search} onChange={e => setSearch(e.target.value)} className="field-input" placeholder="Search guests or subjects…" /><div className="flex gap-1.5 overflow-x-auto">{[['all','All'],['waiting_for_staff','Needs reply'],['waiting_for_guest','Waiting for guest'],['resolved','Resolved']].map(([value,label]) => <button key={value} onClick={() => setFilter(value)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${filter === value ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{label}</button>)}</div></div>
          <div className="flex-1 overflow-y-auto">{loading ? <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-700" /></div> : filtered.length === 0 ? <div className="p-8 text-center text-slate-500"><MessageSquare size={28} className="mx-auto text-slate-300" /><p className="mt-3 text-sm">No conversations found.</p></div> : filtered.map(item => <button key={item.id} onClick={() => { setSelectedId(item.id); loadConversation(item.id) }} className={`w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 ${selectedId === item.id ? 'bg-blue-50/70 border-l-2 border-l-blue-700' : ''}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-sm text-slate-900 truncate">{item.guest_name}</p><p className="text-xs text-slate-500 truncate mt-0.5">{item.subject}</p></div>{item.priority === 'urgent' && <AlertTriangle size={15} className="text-red-600 shrink-0" />}</div><div className="flex items-center justify-between gap-2 mt-2"><span className="text-[11px] text-slate-400">{item.category}</span><span className={`text-[10px] font-semibold ${item.status === 'waiting_for_staff' ? 'text-blue-700' : 'text-slate-500'}`}>{statusLabel(item.status)}</span></div><p className="text-[10px] text-slate-400 mt-1">{formatDate(item.last_message_at)}</p></button>)}</div>}
        </aside>

        <section className={`${selectedId ? 'flex' : 'hidden xl:flex'} flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden`}>
          {!selected ? <div className="flex-1 grid place-items-center text-center p-10"><MessageSquare size={38} className="mx-auto text-slate-300" /><p className="font-semibold text-slate-700 mt-3">Select a guest conversation</p></div> : <>
            <div className="p-4 md:p-5 border-b border-slate-100"><button onClick={() => setSelectedId('')} className="xl:hidden inline-flex items-center gap-1 text-sm text-blue-700 mb-3"><ChevronLeft size={16} />Back</button><div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4"><div><div className="flex items-center gap-2"><UserRound size={16} className="text-blue-700" /><p className="font-semibold text-slate-900">{selected.guest_name}</p>{selected.priority === 'urgent' && <span className="rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-bold">URGENT</span>}</div><p className="text-sm text-slate-500 mt-1">{selected.guest_email}{selected.guest_phone ? ` · ${selected.guest_phone}` : ''}</p><p className="text-xs uppercase tracking-wider text-blue-700 font-semibold mt-3">{selected.category}</p><h2 className="text-lg font-semibold text-slate-950 mt-1">{selected.subject}</h2></div><div className="flex flex-wrap gap-2"><select value={selected.status} onChange={e => updateConversation({ status: e.target.value }).catch((e: any) => setError(e.message))} className="field-input !w-auto text-xs py-2">{statuses.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}</select><button onClick={() => updateConversation({ priority: selected.priority === 'urgent' ? 'normal' : 'urgent' }).catch((e: any) => setError(e.message))} className={`rounded-xl px-3 py-2 text-xs font-semibold border ${selected.priority === 'urgent' ? 'border-red-200 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'}`}>{selected.priority === 'urgent' ? 'Remove urgent' : 'Mark urgent'}</button></div></div></div>
            <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto bg-slate-50/50 min-h-[430px]">{detailLoading ? <div className="grid place-items-center h-full"><Loader2 className="animate-spin text-blue-700" /></div> : messages.map(message => <div key={message.id} className={`flex ${message.sender_type === 'staff' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] md:max-w-[72%] rounded-2xl px-4 py-3 ${message.sender_type === 'staff' ? 'bg-blue-700 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'}`}><div className={`text-[11px] font-semibold mb-1 ${message.sender_type === 'staff' ? 'text-blue-100' : 'text-blue-700'}`}>{message.sender_type === 'staff' ? 'You / Blue Pair Hotel' : selected.guest_name}</div><p className="text-sm leading-6 whitespace-pre-wrap">{message.message}</p><p className={`text-[10px] mt-2 ${message.sender_type === 'staff' ? 'text-blue-100' : 'text-slate-400'}`}>{formatDate(message.created_at)}</p></div></div>)}</div>
            {selected.status !== 'resolved' ? <div className="p-4 border-t border-slate-100 bg-white"><div className="flex items-end gap-2"><textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} maxLength={5000} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendReply() }} className="field-input flex-1 !h-auto resize-none" placeholder="Write your reply…" /><button disabled={sending || !reply.trim()} onClick={sendReply} className="btn-primary h-11 px-4 disabled:opacity-50 inline-flex items-center gap-2">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}<span className="hidden sm:inline">Send reply</span></button></div><p className="text-[11px] text-slate-400 mt-2">The guest will receive an email notification that they have a new message. The email does not include the message content.</p></div> : <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={17} className="text-emerald-600" />Resolved. Change the status back to open if the guest needs further assistance.</div>}
          </>}
        </section>
      </div>
    </div>
  )
}
