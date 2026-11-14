'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle, AlignCenter, AlignLeft, AlignRight, Bold, CheckCircle2,
  Clock3, Eye, Image as ImageIcon, Italic, Link2, List, ListOrdered,
  Mail, Redo2, Send, Underline, Undo2
} from 'lucide-react'
import ImageUploader from '../../../components/admin/ImageUploader'

type Campaign = {
  id: string
  subject: string
  recipient_mode: 'all' | 'custom'
  created_at: string
  total: number
  queued: number
  sent: number
  pending: number
  failed: number
}

const initialContent = `<p>Hello,</p><h2>A note from Blue Pair</h2><p>Share your news, offers and updates with your guests. Click here and start writing your newsletter.</p><p style="text-align:center"><a href="https://bluepairsignature.com" style="display:inline-block;padding:13px 24px;background:#c79a3e;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold">Explore Blue Pair</a></p>`
const safeColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value) ? value : '#c79a3e'

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" title={label} aria-label={label} onMouseDown={event => event.preventDefault()} onClick={onClick}
    className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-black/10 bg-white px-2 text-navy-600 transition hover:border-gold-400 hover:bg-gold-50">
    {children}
  </button>
}

export default function NewsletterPage() {
  const editorRef = useRef<HTMLDivElement>(null)
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState(initialContent)
  const [editorVersion, setEditorVersion] = useState(0)
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
      if (!response.ok) throw new Error(payload.error || 'Unable to load newsletter activity.')
      setCampaigns(payload.campaigns ?? [])
    } catch (loadError: any) {
      setError(loadError.message || 'Unable to load newsletter activity.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void loadCampaigns() }, [loadCampaigns])

  function syncEditor() {
    if (editorRef.current) setContent(editorRef.current.innerHTML)
  }

  function format(command: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(command, false, value)
    syncEditor()
  }

  function addLink() {
    const url = window.prompt('Paste the web address for this link')
    if (!url) return
    const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`
    format('createLink', safeUrl)
  }

  function insertImage(url: string) {
    editorRef.current?.focus()
    format('insertHTML', `<p><img src="${url}" alt="Newsletter image" style="max-width:100%;height:auto;border-radius:12px" /></p><p><br></p>`)
  }

  const html = useMemo(() => {
    const body = content.trim()
    return `<div style="font-family:Arial,sans-serif;color:${safeColor(textColor)};line-height:1.7">${body}<p style="margin-top:28px;color:#788095;font-size:12px">Blue Pair Signature Hotel Crown and Suite · Uromi, Edo State</p></div>`
  }, [content, textColor])

  const preview = useMemo(() => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:24px;background:#f5f2eb;font-family:Arial,sans-serif}.frame{max-width:640px;margin:auto;background:#fff;border:1px solid #e9e4d8;border-radius:14px;overflow:hidden}.brand{background:#0b1633;color:#d7ae52;padding:20px 28px;font-size:12px;font-weight:bold;letter-spacing:2px}.content{padding:30px;overflow-wrap:anywhere}.content img{max-width:100%;height:auto}.content a{color:${safeColor(accent)}}.content h1,.content h2,.content h3{font-family:Georgia,serif;line-height:1.25}</style></head><body><div class="frame"><div class="brand">BLUE PAIR SIGNATURE HOTEL CROWN AND SUITE</div><div class="content" style="color:${safeColor(textColor)}">${html}</div></div></body></html>`, [html, accent, textColor])

  async function queueNewsletter() {
    syncEditor()
    const finalContent = editorRef.current?.innerHTML.trim() || content.trim()
    if (!subject.trim() || finalContent.replace(/<[^>]*>/g, '').trim().length < 2) {
      setError('Add an email subject and some newsletter content before sending.')
      return
    }
    if (recipientMode === 'custom' && !customEmails.trim()) {
      setError('Enter at least one email address for your custom audience.')
      return
    }
    setSending(true)
    setError('')
    setMessage('')
    try {
      const bodyHtml = `<div style="font-family:Arial,sans-serif;color:${safeColor(textColor)};line-height:1.7">${finalContent}<p style="margin-top:28px;color:#788095;font-size:12px">Blue Pair Signature Hotel Crown and Suite · Uromi, Edo State</p></div>`
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, html: bodyHtml, recipientMode, customEmails })
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to queue newsletter.')
      setMessage(payload.message || `${payload.recipientCount} eligible email addresses saved. Delivery continues in the background.`)
      setSubject('')
      setCustomEmails('')
      setContent(initialContent)
      setEditorVersion(value => value + 1)
      void loadCampaigns()
    } catch (sendError: any) {
      setError(sendError.message || 'Unable to queue newsletter.')
    } finally {
      setSending(false)
    }
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow">Guest communications</p>
        <h1 className="mt-1 text-2xl font-semibold">Newsletter</h1>
        <p className="mt-1 max-w-3xl text-sm text-navy-500">Create beautiful emails the same way you edit a document. Click into the page, type, format and add pictures. The website turns your design into an email automatically — no code needed.</p>
      </div>
      <button type="button" onClick={() => setShowPreview(value => !value)} className="btn-outline btn-sm self-start sm:self-auto">
        <Eye size={15} />{showPreview ? 'Hide preview' : 'Show preview'}
      </button>
    </div>

    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    <div className={`grid items-start gap-5 ${showPreview ? 'xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]' : 'grid-cols-1'}`}>
      <section className="card overflow-hidden">
        <div className="border-b border-black/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-50 text-gold-700"><Mail size={17} /></span>
            <div><h2 className="font-semibold">Create your email</h2><p className="text-xs text-navy-400">Everything below is what your guests will receive.</p></div>
          </div>
          <label className="mb-4 block">
            <span className="field-label">Email subject</span>
            <input className="field-input" maxLength={180} value={subject} onChange={event => setSubject(event.target.value)} placeholder="A special update from Blue Pair" />
          </label>
          <fieldset className="rounded-xl border border-black/10 p-4">
            <legend className="px-1 text-xs font-semibold text-navy-600">Who should receive this email?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-xl border p-3 ${recipientMode === 'all' ? 'border-gold-500 bg-gold-50/50' : 'border-black/10'}`}>
                <span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="audience" checked={recipientMode === 'all'} onChange={() => setRecipientMode('all')} />All guest emails</span>
                <span className="ml-6 block text-xs text-navy-400">Send to eligible guest addresses</span>
              </label>
              <label className={`cursor-pointer rounded-xl border p-3 ${recipientMode === 'custom' ? 'border-gold-500 bg-gold-50/50' : 'border-black/10'}`}>
                <span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="audience" checked={recipientMode === 'custom'} onChange={() => setRecipientMode('custom')} />A custom list</span>
                <span className="ml-6 block text-xs text-navy-400">Choose specific recipients</span>
              </label>
            </div>
            {recipientMode === 'custom' && <label className="mt-3 block"><span className="field-label">Email addresses</span><textarea value={customEmails} onChange={event => setCustomEmails(event.target.value)} className="field-input min-h-24" placeholder="guest@example.com, another@example.com" /><span className="mt-1 block text-[11px] text-navy-400">Separate addresses with commas or new lines.</span></label>}
          </fieldset>
        </div>

        <div className="border-b border-black/5 bg-[#faf9f6] px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-sm font-semibold text-navy-800">Email editor</p><p className="text-[11px] text-navy-400">Select text to format it, just like WordPress.</p></div>
            <div className="flex items-center gap-2 text-xs text-navy-500">
              <label className="flex items-center gap-1.5">Text <input aria-label="Text color" type="color" value={textColor} onChange={event => setTextColor(event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0" /></label>
              <label className="flex items-center gap-1.5">Links <input aria-label="Link color" type="color" value={accent} onChange={event => setAccent(event.target.value)} className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0" /></label>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <ToolButton label="Bold" onClick={() => format('bold')}><Bold size={15} /></ToolButton>
            <ToolButton label="Italic" onClick={() => format('italic')}><Italic size={15} /></ToolButton>
            <ToolButton label="Underline" onClick={() => format('underline')}><Underline size={15} /></ToolButton>
            <span className="mx-1 hidden h-8 border-l border-black/10 sm:block" />
            <select aria-label="Text style" defaultValue="P" onChange={event => format('formatBlock', event.target.value)} className="h-9 rounded-lg border border-black/10 bg-white px-2 text-xs text-navy-700"><option value="P">Paragraph</option><option value="H1">Heading 1</option><option value="H2">Heading 2</option><option value="H3">Heading 3</option></select>
            <ToolButton label="Bulleted list" onClick={() => format('insertUnorderedList')}><List size={15} /></ToolButton>
            <ToolButton label="Numbered list" onClick={() => format('insertOrderedList')}><ListOrdered size={15} /></ToolButton>
            <span className="mx-1 hidden h-8 border-l border-black/10 sm:block" />
            <ToolButton label="Align left" onClick={() => format('justifyLeft')}><AlignLeft size={15} /></ToolButton>
            <ToolButton label="Align center" onClick={() => format('justifyCenter')}><AlignCenter size={15} /></ToolButton>
            <ToolButton label="Align right" onClick={() => format('justifyRight')}><AlignRight size={15} /></ToolButton>
            <ToolButton label="Add link" onClick={addLink}><Link2 size={15} /></ToolButton>
            <ToolButton label="Undo" onClick={() => format('undo')}><Undo2 size={15} /></ToolButton>
            <ToolButton label="Redo" onClick={() => format('redo')}><Redo2 size={15} /></ToolButton>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <ImageUploader folder="newsletter" label="Add picture" onUploaded={urls => { if (urls[0]) insertImage(urls[0]) }} />
            <span className="text-[11px] text-navy-400"><ImageIcon size={12} className="mr-1 inline" />Pictures appear inside your email.</span>
          </div>
        </div>

        <div className="bg-[#f5f2eb] p-4 sm:p-6">
          <div className="mx-auto max-w-[640px] overflow-hidden rounded-xl border border-[#e9e4d8] bg-white shadow-sm">
            <div className="bg-[#0b1633] px-7 py-5 text-xs font-bold tracking-[2px] text-[#d7ae52]">BLUE PAIR SIGNATURE HOTEL CROWN AND SUITE</div>
            <div
              key={editorVersion}
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncEditor}
              onBlur={syncEditor}
              className="newsletter-visual-editor min-h-[430px] px-6 py-8 text-base leading-7 text-navy-900 outline-none sm:px-8"
              style={{ color: safeColor(textColor) }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
            <div className="border-t border-black/5 px-6 py-4 text-[11px] text-navy-400 sm:px-8">Blue Pair Signature Hotel Crown and Suite · Uromi, Edo State</div>
          </div>
          <p className="mx-auto mt-3 max-w-[640px] text-center text-[11px] text-navy-400">Click anywhere in the white email to write. Use the toolbar to style selected text or add pictures.</p>
        </div>

        <div className="flex flex-col gap-3 border-t border-black/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-xs text-navy-400">When you send, your design is saved as email content and delivery starts in the background. Up to 50 emails are queued per day.</p>
          <button onClick={() => void queueNewsletter()} disabled={sending} className="btn-primary min-w-44 justify-center">
            {sending ? <><Clock3 size={15} />Preparing email…</> : <><Send size={15} />Save &amp; send newsletter</>}
          </button>
        </div>
      </section>

      {showPreview && <section className="card overflow-hidden xl:sticky xl:top-5">
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Live email preview</h2><p className="mt-1 text-xs text-navy-400">{subject || 'Your email subject will appear here'}</p></div><Eye size={17} className="text-gold-600" /></div>
        <iframe title="Newsletter preview" sandbox="" srcDoc={preview} className="h-[680px] w-full border-0 bg-[#f5f2eb]" />
        <p className="border-t border-black/5 px-5 py-3 text-[11px] text-navy-400">Preview updates as you edit. Actual appearance may vary slightly between email apps.</p>
      </section>}
    </div>

    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Newsletter activity</h2><p className="mt-1 text-xs text-navy-400">See which campaigns are queued and delivered.</p></div><Mail size={17} className="text-gold-600" /></div>
      {loading ? <p className="p-8 text-center text-sm text-navy-400">Loading newsletter activity…</p> : campaigns.length ? <div className="divide-y divide-black/5">{campaigns.map(campaign => <div key={campaign.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><b>{campaign.subject}</b><p className="mt-1 text-xs text-navy-400">{new Date(campaign.created_at).toLocaleString('en-NG')} · {campaign.total} recipients · {campaign.recipient_mode === 'custom' ? 'Custom list' : 'All guest emails'}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700"><Clock3 className="mr-1 inline" size={12} />{campaign.queued} queued</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><CheckCircle2 className="mr-1 inline" size={12} />{campaign.sent} sent</span>{campaign.pending > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{campaign.pending} scheduled</span>}{campaign.failed > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700"><AlertCircle className="mr-1 inline" size={12} />{campaign.failed} failed</span>}</div></div>)}</div> : <p className="p-8 text-center text-sm text-navy-400">No newsletters sent yet.</p>}
    </section>
  </div>
}
