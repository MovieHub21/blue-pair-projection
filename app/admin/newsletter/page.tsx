'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle2, Clock3, Eye, Image as ImageIcon, Mail, Plus, Send, Trash2 } from 'lucide-react'
import ImageUploader from '../../../components/admin/ImageUploader'

type Block = { id: string; type: 'heading' | 'text' | 'image' | 'button'; text: string; url: string; align: 'left' | 'center' | 'right' }
type Campaign = { id: string; subject: string; recipient_mode: 'all' | 'custom'; created_at: string; total: number; queued: number; sent: number; pending: number; failed: number }
const makeBlock = (type: Block['type']): Block => ({ id: `${Date.now()}-${Math.random()}`, type, text: type === 'heading' ? 'A note from Blue Pair' : type === 'text' ? 'Write your message here.' : type === 'button' ? 'Explore Blue Pair' : '', url: type === 'button' ? 'https://bluepairsignature.com' : '', align: type === 'button' ? 'center' : 'left' })
const starterBlocks: Block[] = [{ ...makeBlock('text'), text: 'Hello,' }, makeBlock('heading'), { ...makeBlock('text'), text: 'Share your news, offers and updates with your guests.' }, makeBlock('button')]
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
const safeColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value) ? value : '#c79a3e'

function renderBlocks(blocks: Block[], accent: string, textColor: string) {
  return blocks.map(block => {
    const align = block.align || 'left'
    if (block.type === 'heading') return `<h1 style="margin:12px 0 18px;text-align:${align};font:600 30px/1.2 Georgia,serif;color:${safeColor(textColor)}">${escapeHtml(block.text)}</h1>`
    if (block.type === 'text') return `<p style="margin:0 0 18px;text-align:${align};font:16px/1.75 Arial,sans-serif;color:${safeColor(textColor)};white-space:pre-wrap">${escapeHtml(block.text)}</p>`
    if (block.type === 'image') return block.url ? `<p style="margin:0 0 20px;text-align:${align}"><img src="${escapeHtml(block.url)}" alt="Newsletter image" style="display:inline-block;max-width:100%;height:auto;border-radius:12px" /></p>` : ''
    const url = /^https?:\/\//i.test(block.url) ? block.url : 'https://bluepairsignature.com'
    return `<p style="margin:24px 0;text-align:${align}"><a href="${escapeHtml(url)}" style="display:inline-block;padding:13px 24px;background:${safeColor(accent)};color:#fff;text-decoration:none;border-radius:8px;font:bold 14px Arial,sans-serif">${escapeHtml(block.text || 'Learn more')}</a></p>`
  }).join('\n')
}

export default function NewsletterPage() {
  const [subject, setSubject] = useState('')
  const [blocks, setBlocks] = useState<Block[]>(starterBlocks)
  const [accent, setAccent] = useState('#c79a3e')
  const [textColor, setTextColor] = useState('#101a35')
  const [recipientMode, setRecipientMode] = useState<'all' | 'custom'>('all')
  const [customEmails, setCustomEmails] = useState('')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [showPreview, setShowPreview] = useState(true)

  const loadCampaigns = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/newsletter', { cache: 'no-store' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to load newsletter log.')
      setCampaigns(payload.campaigns ?? [])
    } catch (loadError: any) { setError(loadError.message || 'Unable to load newsletter log.') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { void loadCampaigns() }, [loadCampaigns])

  const html = useMemo(() => {
    const body = renderBlocks(blocks, accent, textColor)
    return `<div style="font-family:Arial,sans-serif;color:${safeColor(textColor)};line-height:1.7">${body}<p style="margin-top:28px;color:#788095;font-size:12px">Blue Pair Signature Hotel Crown and Suite · Uromi, Edo State</p></div>`
  }, [blocks, accent, textColor])
  const preview = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:24px;background:#f5f2eb;font-family:Arial,sans-serif}.frame{max-width:640px;margin:auto;background:#fff;border:1px solid #e9e4d8;border-radius:14px;overflow:hidden}.brand{background:#0b1633;color:#d7ae52;padding:20px 28px;font-size:12px;font-weight:bold;letter-spacing:2px}.content{padding:30px}img{max-width:100%;height:auto}</style></head><body><div class="frame"><div class="brand">BLUE PAIR SIGNATURE HOTEL CROWN AND SUITE </div><div class="content">${html}</div></div></body></html>`

  function updateBlock(id: string, changes: Partial<Block>) { setBlocks(current => current.map(block => block.id === id ? { ...block, ...changes } : block)) }
  function moveBlock(index: number, direction: -1 | 1) { setBlocks(current => { const target = index + direction; if (target < 0 || target >= current.length) return current; const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next }) }

  async function queueNewsletter() {
    if (!subject.trim() || !blocks.some(block => block.type !== 'image' ? !!block.text.trim() : !!block.url)) { setError('Add a subject and at least one content block.'); return }
    if (recipientMode === 'custom' && !customEmails.trim()) { setError('Enter at least one email address for your custom audience.'); return }
    setSending(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/admin/newsletter', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, html, recipientMode, customEmails }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to queue newsletter.')
      setMessage(payload.message || payload.error || `${payload.recipientCount} eligible email addresses saved. ${payload.queuedToday} are queued today; remaining addresses continue in daily batches of 50. Delivery continues in the background.`)
      setSubject(''); setCustomEmails(''); setBlocks(starterBlocks)
      void loadCampaigns()
    } catch (sendError: any) { setError(sendError.message || 'Unable to queue newsletter.') }
    finally { setSending(false) }
  }

  return <div className="space-y-6">
    <div><p className="eyebrow">Guest communications</p><h1 className="mt-1 text-2xl font-semibold">Newsletter</h1><p className="mt-1 max-w-3xl text-sm text-navy-500">Build your email visually, preview it as you work, then send to all eligible guests or a custom list. A maximum of 50 newsletter emails are queued per day.</p></div>
    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="card space-y-5 p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Compose newsletter</h2><button onClick={() => setShowPreview(value => !value)} className="btn-outline btn-sm xl:hidden"><Eye size={14} />{showPreview ? 'Hide preview' : 'Preview'}</button></div>
        <label className="block"><span className="field-label">Email subject</span><input className="field-input" maxLength={180} value={subject} onChange={event => setSubject(event.target.value)} placeholder="A special update from Blue Pair" /></label>

        <fieldset className="rounded-2xl border border-black/10 p-4"><legend className="px-1 text-xs font-semibold text-navy-600">Who should receive it?</legend><div className="grid gap-3 sm:grid-cols-2"><label className={`cursor-pointer rounded-xl border p-3 ${recipientMode === 'all' ? 'border-gold-500 bg-gold-50/50' : 'border-black/10'}`}><span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="audience" checked={recipientMode === 'all'} onChange={() => setRecipientMode('all')} />All guest emails</span><span className="ml-6 block text-xs text-navy-400">Customer emails excluding @bluepairsignature.com</span></label><label className={`cursor-pointer rounded-xl border p-3 ${recipientMode === 'custom' ? 'border-gold-500 bg-gold-50/50' : 'border-black/10'}`}><span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="audience" checked={recipientMode === 'custom'} onChange={() => setRecipientMode('custom')} />Custom email list</span><span className="ml-6 block text-xs text-navy-400">Choose specific recipients</span></label></div>{recipientMode === 'custom' && <label className="mt-3 block"><span className="field-label">Email addresses</span><textarea value={customEmails} onChange={event => setCustomEmails(event.target.value)} className="field-input min-h-24" placeholder="guest@example.com, another@example.com" /><span className="mt-1 block text-[11px] text-navy-400">Separate addresses with commas, spaces or new lines. Company addresses are automatically excluded.</span></label>}</fieldset>

        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">Email design</h3><div className="flex items-center gap-3 text-xs text-navy-500"><label className="flex items-center gap-1.5">Button color <input aria-label="Button color" type="color" value={accent} onChange={event => setAccent(event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0" /></label><label className="flex items-center gap-1.5">Text color <input aria-label="Text color" type="color" value={textColor} onChange={event => setTextColor(event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0" /></label></div></div>
        <div className="space-y-3">{blocks.map((block, index) => <article key={block.id} className="rounded-2xl border border-black/10 p-4"><div className="mb-3 flex items-center justify-between gap-3"><span className="rounded-full bg-navy-50 px-2.5 py-1 text-[11px] font-semibold capitalize text-navy-600">{block.type === 'text' ? 'Paragraph' : block.type}</span><div className="flex items-center gap-1"><button disabled={index === 0} onClick={() => moveBlock(index, -1)} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50 disabled:opacity-30" aria-label="Move block up"><ArrowUp size={14} /></button><button disabled={index === blocks.length - 1} onClick={() => moveBlock(index, 1)} className="rounded-lg p-2 text-navy-500 hover:bg-navy-50 disabled:opacity-30" aria-label="Move block down"><ArrowDown size={14} /></button><button onClick={() => setBlocks(current => current.filter(item => item.id !== block.id))} className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label="Remove block"><Trash2 size={14} /></button></div></div>
          {block.type === 'image' ? <div className="space-y-2">{block.url ? <img src={block.url} alt="Newsletter block" className="max-h-48 rounded-xl object-cover" /> : <div className="flex h-24 items-center justify-center rounded-xl bg-navy-50 text-sm text-navy-400"><ImageIcon size={18} className="mr-2" />Upload an image for this block</div>}<ImageUploader folder="newsletter" label={block.url ? 'Replace image' : 'Upload image'} onUploaded={urls => updateBlock(block.id, { url: urls[0] })} /></div> : <><textarea value={block.text} onChange={event => updateBlock(block.id, { text: event.target.value })} rows={block.type === 'text' ? 4 : 2} className="field-input !h-auto py-2.5" placeholder={block.type === 'heading' ? 'Section heading' : block.type === 'button' ? 'Button label' : 'Write your message'} />{block.type === 'button' && <input value={block.url} onChange={event => updateBlock(block.id, { url: event.target.value })} className="field-input mt-2" placeholder="Button link, e.g. https://bluepairsignature.com" />}</>}
          <label className="mt-3 flex items-center gap-2 text-xs text-navy-500">Align this block <select value={block.align} onChange={event => updateBlock(block.id, { align: event.target.value as Block['align'] })} className="input !w-auto"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></label>
        </article>)}</div>
        <div className="flex flex-wrap gap-2"><button onClick={() => setBlocks(current => [...current, makeBlock('heading')])} className="btn-outline btn-sm"><Plus size={14} />Heading</button><button onClick={() => setBlocks(current => [...current, makeBlock('text')])} className="btn-outline btn-sm"><Plus size={14} />Paragraph</button><button onClick={() => setBlocks(current => [...current, makeBlock('image')])} className="btn-outline btn-sm"><Plus size={14} />Image</button><button onClick={() => setBlocks(current => [...current, makeBlock('button')])} className="btn-outline btn-sm"><Plus size={14} />Button</button></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4"><p className="max-w-sm text-xs text-navy-400">Sending starts as soon as the campaign is saved. Emails are delivered in the background, up to 50 recipients per day.</p><button onClick={() => void queueNewsletter()} disabled={sending} className="btn-primary min-w-40 justify-center">{sending ? <><Clock3 size={15} />Starting…</> : <><Send size={15} />Send newsletter</>}</button></div>
      </section>

      <section className={`card overflow-hidden ${!showPreview ? 'hidden xl:block' : ''}`}><div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Email preview</h2><p className="mt-1 text-xs text-navy-400">{subject || 'Your email subject'}</p></div><Eye size={17} className="text-gold-600" /></div><iframe title="Newsletter preview" sandbox="" srcDoc={preview} className="h-[720px] w-full border-0 bg-[#f5f2eb]" /></section>
    </div>

    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Newsletter activity</h2><p className="mt-1 text-xs text-navy-400">Queued and delivered email batches.</p></div><Mail size={17} className="text-gold-600" /></div>{loading ? <p className="p-8 text-center text-sm text-navy-400">Loading newsletter log…</p> : campaigns.length ? <div className="divide-y divide-black/5">{campaigns.map(campaign => <div key={campaign.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><b>{campaign.subject}</b><p className="mt-1 text-xs text-navy-400">{new Date(campaign.created_at).toLocaleString('en-NG')} · {campaign.total} recipients · {campaign.recipient_mode === 'custom' ? 'Custom list' : 'All guest emails'}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700"><Clock3 className="mr-1 inline" size={12} />{campaign.queued} queued</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><CheckCircle2 className="mr-1 inline" size={12} />{campaign.sent} sent</span>{campaign.pending > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{campaign.pending} scheduled</span>}{campaign.failed > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700"><AlertCircle className="mr-1 inline" size={12} />{campaign.failed} failed</span>}</div></div>)}</div> : <p className="p-8 text-center text-sm text-navy-400">No newsletters sent yet.</p>}</section>
  </div>
}
