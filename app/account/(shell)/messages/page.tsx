'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ChevronLeft, Clock3, Loader2, MessageSquare, Send, ShieldCheck } from 'lucide-react'

type Conversation = { id: string; subject: string; category: string; status: string; priority: string; guest_name: string; last_message_at: string; created_at: string }
type Message = { id: string; sender_type: 'guest' | 'staff'; message: string; created_at: string }

const statusLabel: Record<string, string> = { open: 'Open', waiting_for_staff: 'Waiting for our team', waiting_for_guest: 'Waiting for your reply', resolved: 'Resolved' }

function formatDate(value: string) { return new Date(value).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) }

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const requestedId = searchParams.get('conversation')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState(requestedId || '')
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Conversation | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function loadConversations(preferredId?: string) {
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/contact/conversations', { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load messages.')
      const list = data.conversations || []
      setConversations(list)
      const nextId = preferredId || selectedId || list[0]?.id || ''
      setSelectedId(nextId)
      if (nextId) await loadConversation(nextId)
    } catch (e: any) { setError(e?.message || 'Unable to load messages.') }
    finally { setLoading(false) }
  }

  async function loadConversation(id: string) {
    setDetailLoading(true); setError('')
    try {
      const response = await fetch(`/api/contact/conversations/${id}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to load the conversation.')
      setSelected(data.conversation); setMessages(data.messages || [])
      setConversations(current => current.map(item => item.id === id ? { ...item, ...data.conversation } : item))
    } catch (e: any) { setError(e?.message || 'Unable to load the conversation.') }
    finally { setDetailLoading(false) }
  }

  useEffect(() => { loadConversations(requestedId || undefined) }, [])

  const sorted = useMemo(() => [...conversations].sort((a, b) => +new Date(b.last_message_at) - +new Date(a.last_message_at)), [conversations])

  async function sendReply() {
    if (!selectedId || !reply.trim()) return
    setSending(true); setError('')
    try {
      const response = await fetch(`/api/contact/conversations/${selectedId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: reply.trim() }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send your reply.')
      setReply('')
      await loadConversation(selectedId)
    } catch (e: any) { setError(e?.message || 'Unable to send your reply.') }
    finally { setSending(false) }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-blue-700 font-semibold">Guest communication</p>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-950 mt-1">Messages</h1>
        <p className="text-slate-500 mt-2">Keep track of your conversations with the Blue Pair Hotel team.</p>
      </div>

      {error && <div className="rounded-xl border border-red-100 bg-red-50 text-red-700 p-3 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-[330px_1fr] gap-5 min-h-[620px]">
        <aside className={`${selectedId ? 'hidden lg:block' : 'block'} rounded-2xl border border-slate-200 bg-white overflow-hidden`}>
          <div className="p-4 border-b border-slate-100 flex items-center justify-between"><div><p className="font-semibold text-slate-900">Your conversations</p><p className="text-xs text-slate-500 mt-0.5">{sorted.length} conversation{sorted.length === 1 ? '' : 's'}</p></div><MessageSquare size={18} className="text-blue-700" /></div>
          {loading ? <div className="p-8 text-center text-slate-500"><Loader2 className="animate-spin mx-auto" size={22} /></div> : sorted.length === 0 ? <div className="p-8 text-center"><MessageSquare size={28} className="mx-auto text-slate-300" /><p className="font-medium mt-3 text-slate-700">No messages yet</p><p className="text-sm text-slate-500 mt-1">Start a conversation from the Contact page.</p></div> : <div className="divide-y divide-slate-100">{sorted.map(item => <button key={item.id} onClick={() => { setSelectedId(item.id); loadConversation(item.id) }} className={`w-full text-left p-4 hover:bg-slate-50 transition ${selectedId === item.id ? 'bg-blue-50/70' : ''}`}><div className="flex items-start justify-between gap-3"><p className="font-semibold text-sm text-slate-900 truncate">{item.subject}</p>{item.priority === 'urgent' && <span className="text-[10px] font-semibold text-red-600">URGENT</span>}</div><p className="text-xs text-slate-500 mt-1">{item.category}</p><div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400"><Clock3 size={12} />{formatDate(item.last_message_at)}</div><span className="inline-flex mt-2 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{statusLabel[item.status] || item.status}</span></button>)}</div>}
        </aside>

        <section className={`${selectedId ? 'block' : 'hidden lg:block'} rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col`}>
          {!selected ? <div className="flex-1 grid place-items-center p-10 text-center"><div><MessageSquare size={36} className="mx-auto text-slate-300" /><p className="font-semibold text-slate-700 mt-3">Select a conversation</p><p className="text-sm text-slate-500 mt-1">Your conversation history will appear here.</p></div></div> : <>
            <div className="p-4 md:p-5 border-b border-slate-100"><button onClick={() => setSelectedId('')} className="lg:hidden inline-flex items-center gap-1 text-sm text-blue-700 mb-3"><ChevronLeft size={16} />Back</button><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-blue-700 font-semibold">{selected.category}</p><h2 className="text-lg md:text-xl font-semibold text-slate-950 mt-1">{selected.subject}</h2><p className="text-xs text-slate-500 mt-1">Started {formatDate(selected.created_at)}</p></div><span className="rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold">{statusLabel[selected.status] || selected.status}</span></div></div>
            <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto min-h-[420px] bg-slate-50/50">{detailLoading ? <div className="grid place-items-center h-full"><Loader2 className="animate-spin text-blue-700" size={24} /></div> : messages.map(message => <div key={message.id} className={`flex ${message.sender_type === 'guest' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] md:max-w-[72%] rounded-2xl px-4 py-3 ${message.sender_type === 'guest' ? 'bg-blue-700 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm'}`}><div className={`text-[11px] font-semibold mb-1 ${message.sender_type === 'guest' ? 'text-blue-100' : 'text-blue-700'}`}>{message.sender_type === 'guest' ? 'You' : 'Blue Pair Hotel'}</div><p className="text-sm leading-6 whitespace-pre-wrap">{message.message}</p><p className={`text-[10px] mt-2 ${message.sender_type === 'guest' ? 'text-blue-100' : 'text-slate-400'}`}>{formatDate(message.created_at)}</p></div></div>)}</div>
            {selected.status !== 'resolved' ? <div className="p-4 border-t border-slate-100 bg-white"><div className="flex items-end gap-2"><textarea value={reply} onChange={e => setReply(e.target.value)} rows={2} maxLength={5000} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') sendReply() }} className="field-input flex-1 !h-auto resize-none" placeholder="Write a reply…" /><button disabled={sending || !reply.trim()} onClick={sendReply} className="btn-primary h-11 px-4 disabled:opacity-50 inline-flex items-center gap-2">{sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}<span className="hidden sm:inline">Send</span></button></div><p className="text-[11px] text-slate-400 mt-2">Blue Pair Hotel will be notified when you reply.</p></div> : <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 size={17} className="text-emerald-600" />This conversation has been resolved. Start a new conversation if you need more help.</div>}
          </>}
        </section>
      </div>
    </div>
  )
}
