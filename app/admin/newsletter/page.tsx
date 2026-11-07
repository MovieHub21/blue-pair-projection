'use client'

import { useCallback, useEffect, useState } from 'react'
import { Send, Eye, Loader2, Mail, Clock3, CheckCircle2, AlertCircle } from 'lucide-react'
import ImageUploader from '../../../components/admin/ImageUploader'

const defaultBody = `<div style="font-family:Arial,sans-serif;color:#101a35;line-height:1.7"><p>Hello,</p><h1 style="font-size:28px;color:#101a35">A note from Blue Pair</h1><p>Write your newsletter here. Add headings, links, images and any HTML design you need.</p><p><a href="https://bluepairsignature.com" style="display:inline-block;padding:12px 20px;background:#c79a3e;color:#fff;text-decoration:none;border-radius:8px">Visit Blue Pair</a></p></div>`

type Campaign = { id: string; subject: string; created_at: string; total: number; queued: number; sent: number; pending: number; failed: number }

export default function NewsletterPage() {
  const [subject, setSubject] = useState('')
  const [html, setHtml] = useState(defaultBody)
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
    } catch (error: any) {
      setError(error.message || 'Unable to load newsletter log.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadCampaigns() }, [loadCampaigns])

  function addBlock(block: string) { setHtml(current => `${current}\n${block}`) }

  async function queueNewsletter() {
    if (!subject.trim() || !html.trim()) { setError('Add an email subject and message first.'); return }
    setSending(true); setError(''); setMessage('')
    try {
      const response = await fetch('/api/admin/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject, html }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to queue newsletter.')
      setMessage(`Newsletter queued for ${payload.recipientCount} eligible email addresses. ${payload.queuedToday} will be sent today; the rest will be queued in batches of 50 on following days.`)
      setSubject('');
      await loadCampaigns()
    } catch (error: any) { setError(error.message || 'Unable to queue newsletter.') }
    finally { setSending(false) }
  }

  const preview = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:24px;background:#f5f2eb;font-family:Arial,sans-serif}.frame{max-width:640px;margin:auto;background:#fff;border:1px solid #e9e4d8;border-radius:14px;overflow:hidden}.brand{background:#0b1633;color:#d7ae52;padding:20px 28px;font-size:12px;font-weight:bold;letter-spacing:2px}.content{padding:30px}img{max-width:100%;height:auto}</style></head><body><div class="frame"><div class="brand">BLUE PAIR SIGNATURE</div><div class="content">${html}</div></div></body></html>`

  return <div className="space-y-6">
    <div><p className="eyebrow">Guest communications</p><h1 className="mt-1 text-2xl font-semibold">Newsletter</h1><p className="mt-1 max-w-3xl text-sm text-navy-500">Design a message, preview it beside the editor, and queue it for guests. The daily newsletter limit is 50; remaining recipients continue on following days. Company email addresses are excluded.</p></div>
    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Compose newsletter</h2><button onClick={() => setShowPreview(value => !value)} className="btn-outline btn-sm xl:hidden"><Eye size={14} />{showPreview ? 'Hide preview' : 'Preview'}</button></div>
        <label className="block"><span className="field-label">Email subject</span><input className="field-input" maxLength={180} value={subject} onChange={event => setSubject(event.target.value)} placeholder="A special update from Blue Pair" /></label>
        <div className="flex flex-wrap gap-2"><button onClick={() => addBlock('<h2 style="font-size:24px;color:#101a35">Your heading</h2>')} className="btn-outline btn-sm">Add heading</button><button onClick={() => addBlock('<p style="font-size:16px;line-height:1.7">Write a paragraph here.</p>')} className="btn-outline btn-sm">Add paragraph</button><button onClick={() => addBlock('<a href="https://bluepairsignature.com" style="display:inline-block;padding:12px 20px;background:#c79a3e;color:#fff;text-decoration:none;border-radius:8px">Explore Blue Pair</a>')} className="btn-outline btn-sm">Add button</button><ImageUploader folder="newsletter" label="Upload image" onUploaded={urls => addBlock(`<p><img src="${urls[0]}" alt="Newsletter image" style="display:block;width:100%;height:auto;border-radius:10px" /></p>`)} /></div>
        <label className="block"><span className="field-label">Email design (HTML)</span><textarea className="field-input min-h-[340px] font-mono text-xs leading-5" value={html} onChange={event => setHtml(event.target.value)} spellCheck={false} /></label>
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-navy-400">Recipients are pulled from customer email records. @bluepairsignature.com addresses are excluded.</p><button onClick={() => void queueNewsletter()} disabled={sending} className="btn-primary min-w-40 justify-center">{sending ? <><Loader2 size={15} className="animate-spin" />Queueing…</> : <><Send size={15} />Queue newsletter</>}</button></div>
      </section>
      <section className={`card overflow-hidden ${!showPreview ? 'hidden xl:block' : ''}`}><div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Email preview</h2><p className="mt-1 text-xs text-navy-400">{subject || 'Your email subject'}</p></div><Eye size={17} className="text-gold-600" /></div><iframe title="Newsletter preview" sandbox="" srcDoc={preview} className="h-[620px] w-full border-0 bg-[#f5f2eb]" /></section>
    </div>
    <section className="card overflow-hidden"><div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Newsletter activity</h2><p className="mt-1 text-xs text-navy-400">Queued and delivered email batches.</p></div><Mail size={17} className="text-gold-600" /></div>{loading ? <p className="p-8 text-center text-sm text-navy-400">Loading newsletter log…</p> : campaigns.length ? <div className="divide-y divide-black/5">{campaigns.map(campaign => <div key={campaign.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><b>{campaign.subject}</b><p className="mt-1 text-xs text-navy-400">{new Date(campaign.created_at).toLocaleString('en-NG')} · {campaign.total} recipients</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700"><Clock3 className="mr-1 inline" size={12} />{campaign.queued} queued</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><CheckCircle2 className="mr-1 inline" size={12} />{campaign.sent} sent</span>{campaign.pending > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{campaign.pending} scheduled</span>}{campaign.failed > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700"><AlertCircle className="mr-1 inline" size={12} />{campaign.failed} failed</span>}</div></div>)}</div> : <p className="p-8 text-center text-sm text-navy-400">No newsletters sent yet.</p>}</section>
  </div>
}
