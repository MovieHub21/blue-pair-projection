'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle, CheckCircle2, Clock3, Copy, Eye, LayoutTemplate, Mail,
  Pencil, Plus, Send, Trash2, WandSparkles
} from 'lucide-react'
import ImageUploader from '../../../components/admin/ImageUploader'

type Design = {
  headerText: string
  footerText: string
  backgroundColor: string
  cardColor: string
  headerColor: string
  accentColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
  layout: 'classic' | 'centered'
  showHeader: boolean
  showFooter: boolean
}

type Template = {
  id: string
  name: string
  design: Design
  created_at: string
  updated_at: string
}

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

type Tab = 'templates' | 'compose' | 'campaigns'

const defaultDesign: Design = {
  headerText: 'BLUE PAIR SIGNATURE',
  footerText: 'Blue Pair Signature Hotel Crown and Suite · Uromi, Edo State',
  backgroundColor: '#f5f2eb',
  cardColor: '#ffffff',
  headerColor: '#0b1633',
  accentColor: '#d7ae52',
  textColor: '#101a35',
  buttonColor: '#c79a3e',
  buttonTextColor: '#ffffff',
  layout: 'classic',
  showHeader: true,
  showFooter: true,
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!))

function safeUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : ''
  } catch {
    return ''
  }
}

function makeEmailHtml(design: Design, fields: { heading: string; intro: string; body: string; imageUrl: string; buttonText: string; buttonUrl: string }) {
  const align = design.layout === 'centered' ? 'center' : 'left'
  const image = fields.imageUrl.trim() && safeUrl(fields.imageUrl)
    ? `<img src="${escapeHtml(safeUrl(fields.imageUrl))}" alt="" style="display:block;width:100%;height:auto;border-radius:10px;margin:0 0 24px" />`
    : ''
  const paragraphs = fields.body.split(/\n\s*\n/).map(part => part.trim()).filter(Boolean)
    .map(part => `<p style="margin:0 0 16px;line-height:1.75">${escapeHtml(part).replace(/\n/g, '<br>')}</p>`).join('')
  const button = fields.buttonText.trim() && safeUrl(fields.buttonUrl)
    ? `<p style="text-align:${align};margin:28px 0"><a href="${escapeHtml(safeUrl(fields.buttonUrl))}" style="display:inline-block;padding:13px 24px;background:${design.buttonColor};color:${design.buttonTextColor};text-decoration:none;border-radius:7px;font-weight:bold">${escapeHtml(fields.buttonText)}</a></p>`
    : ''
  return `<div style="margin:0;padding:28px 12px;background:${design.backgroundColor};font-family:Arial,Helvetica,sans-serif;color:${design.textColor}">
    <div style="max-width:640px;margin:0 auto;background:${design.cardColor};border-radius:14px;overflow:hidden">
      ${design.showHeader ? `<div style="background:${design.headerColor};color:${design.accentColor};padding:22px 28px;font-size:12px;font-weight:bold;letter-spacing:2px;text-align:${align}">${escapeHtml(design.headerText)}</div>` : ''}
      <div style="padding:32px 28px;text-align:${align}">
        ${image}
        <h1 style="font-family:Georgia,serif;font-size:28px;line-height:1.25;margin:0 0 16px;color:${design.textColor}">${escapeHtml(fields.heading)}</h1>
        ${fields.intro.trim() ? `<p style="font-size:17px;line-height:1.6;margin:0 0 20px">${escapeHtml(fields.intro)}</p>` : ''}
        ${paragraphs}
        ${button}
      </div>
      ${design.showFooter ? `<div style="border-top:1px solid #eeeeee;padding:18px 28px;color:#788095;font-size:12px;line-height:1.6;text-align:center">${escapeHtml(design.footerText)}</div>` : ''}
    </div>
  </div>`
}

const starterFields = {
  heading: 'A little update from Blue Pair',
  intro: 'Good things are happening, and we wanted you to hear it from us first.',
  body: 'Hello,\n\nShare your latest news, offers and updates with your guests here. This text can be changed every time you create a newsletter.',
  imageUrl: '',
  buttonText: 'Explore Blue Pair',
  buttonUrl: 'https://bluepairsignature.com',
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-lg border border-black/10 bg-white px-3 py-2">
    <span className="text-xs font-medium text-navy-600">{label}</span>
    <input aria-label={label} type="color" value={value} onChange={event => onChange(event.target.value)} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" />
  </label>
}

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>('templates')
  const [templates, setTemplates] = useState<Template[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [design, setDesign] = useState<Design>(defaultDesign)
  const [templateName, setTemplateName] = useState('Blue Pair Newsletter')
  const [editingId, setEditingId] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [fields, setFields] = useState(starterFields)
  const [subject, setSubject] = useState('')
  const [recipientMode, setRecipientMode] = useState<'all' | 'custom'>('all')
  const [customEmails, setCustomEmails] = useState('')
  const [showPreview, setShowPreview] = useState(true)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadTemplates = useCallback(async () => {
    const response = await fetch('/api/admin/newsletter/templates', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Unable to load templates.')
    setTemplates(payload.templates ?? [])
  }, [])

  const loadCampaigns = useCallback(async () => {
    const response = await fetch('/api/admin/newsletter', { cache: 'no-store' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error || 'Unable to load newsletter activity.')
    setCampaigns(payload.campaigns ?? [])
  }, [])

  useEffect(() => {
    Promise.all([loadTemplates(), loadCampaigns()])
      .catch(loadError => setError(loadError.message || 'Unable to load newsletter data.'))
      .finally(() => setLoading(false))
  }, [loadTemplates, loadCampaigns])

  const preview = useMemo(() => makeEmailHtml(design, fields), [design, fields])

  function updateDesign<K extends keyof Design>(key: K, value: Design[K]) {
    setDesign(current => ({ ...current, [key]: value }))
  }

  function updateField(key: keyof typeof starterFields, value: string) {
    setFields(current => ({ ...current, [key]: value }))
  }

  function startNewTemplate() {
    setEditingId('')
    setTemplateName('New newsletter template')
    setDesign(defaultDesign)
    setTab('templates')
    setMessage('')
    setError('')
  }

  function editTemplate(template: Template) {
    setEditingId(template.id)
    setTemplateName(template.name)
    setDesign({ ...defaultDesign, ...template.design })
    setTab('templates')
    setMessage('')
    setError('')
  }

  function useTemplate(template: Template) {
    setSelectedId(template.id)
    setDesign({ ...defaultDesign, ...template.design })
    setFields(starterFields)
    setSubject('')
    setTab('compose')
    setMessage('')
    setError('')
  }

  async function saveTemplate() {
    if (!templateName.trim()) {
      setError('Give this template a name before saving.')
      return
    }
    setSavingTemplate(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch('/api/admin/newsletter/templates', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId || undefined, name: templateName, design }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to save template.')
      await loadTemplates()
      setEditingId(payload.template.id)
      setMessage('Template saved. You can reuse it whenever you create a newsletter.')
    } catch (saveError: any) {
      setError(saveError.message || 'Unable to save template.')
    } finally {
      setSavingTemplate(false)
    }
  }

  async function deleteTemplate(template: Template) {
    if (!window.confirm(`Delete the "${template.name}" template?`)) return
    setError('')
    setMessage('')
    try {
      const response = await fetch(`/api/admin/newsletter/templates?id=${encodeURIComponent(template.id)}`, { method: 'DELETE' })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to delete template.')
      setTemplates(current => current.filter(item => item.id !== template.id))
      if (editingId === template.id) {
        setEditingId('')
        setTemplateName('New newsletter template')
        setDesign(defaultDesign)
      }
      if (selectedId === template.id) setSelectedId('')
      setMessage('Template deleted.')
    } catch (deleteError: any) {
      setError(deleteError.message || 'Unable to delete template.')
    }
  }

  async function duplicateTemplate(template: Template) {
    setError('')
    try {
      const response = await fetch('/api/admin/newsletter/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${template.name} copy`, design: template.design }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to duplicate template.')
      await loadTemplates()
      setMessage('Template duplicated.')
    } catch (duplicateError: any) {
      setError(duplicateError.message || 'Unable to duplicate template.')
    }
  }

  async function sendNewsletter() {
    if (!selectedId) {
      setError('Choose a saved template before creating your newsletter.')
      return
    }
    if (!subject.trim() || !fields.heading.trim() || (!fields.body.trim() && !fields.intro.trim())) {
      setError('Add an email subject, heading and some newsletter text.')
      return
    }
    if (fields.buttonText.trim() && !safeUrl(fields.buttonUrl)) {
      setError('Enter a valid website link for the newsletter button.')
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
      const response = await fetch('/api/admin/newsletter', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject.trim(),
          html: preview,
          recipientMode,
          customEmails,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Unable to queue newsletter.')
      setMessage(payload.message || `${payload.recipientCount} eligible email addresses saved.`)
      setSubject('')
      setCustomEmails('')
      setFields(starterFields)
      await loadCampaigns()
      setTab('campaigns')
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
        <p className="mt-1 max-w-3xl text-sm text-navy-500">Design an email once, save it as a template, then reuse the same layout whenever you have a new update to send.</p>
      </div>
      <button type="button" onClick={() => setShowPreview(value => !value)} className="btn-outline btn-sm self-start sm:self-auto">
        <Eye size={15} />{showPreview ? 'Hide preview' : 'Show preview'}
      </button>
    </div>

    <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3">
      <button type="button" onClick={() => setTab('templates')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'templates' ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 hover:bg-gold-50'}`}><LayoutTemplate size={15} className="mr-2 inline" />Templates</button>
      <button type="button" onClick={() => setTab('compose')} disabled={!templates.length} className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-40 ${tab === 'compose' ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 hover:bg-gold-50'}`}><Pencil size={15} className="mr-2 inline" />Create newsletter</button>
      <button type="button" onClick={() => setTab('campaigns')} className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === 'campaigns' ? 'bg-navy-900 text-white' : 'bg-white text-navy-600 hover:bg-gold-50'}`}><Mail size={15} className="mr-2 inline" />Campaigns</button>
    </div>

    {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</div>}
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

    {tab === 'templates' && <div className="grid items-start gap-5 xl:grid-cols-[minmax(320px,.8fr)_minmax(0,1.2fr)]">
      <section className="card space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div><h2 className="font-semibold">{editingId ? 'Edit template design' : 'Design a reusable template'}</h2><p className="mt-1 text-xs text-navy-400">Set the layout and brand styling once.</p></div>
          <WandSparkles size={19} className="text-gold-600" />
        </div>
        <label className="block"><span className="field-label">Template name</span><input className="field-input" maxLength={100} value={templateName} onChange={event => setTemplateName(event.target.value)} placeholder="e.g. Monthly hotel newsletter" /></label>
        <label className="block"><span className="field-label">Header text</span><input className="field-input" maxLength={100} value={design.headerText} onChange={event => updateDesign('headerText', event.target.value)} /></label>
        <label className="block"><span className="field-label">Footer text</span><textarea className="field-input min-h-20" maxLength={220} value={design.footerText} onChange={event => updateDesign('footerText', event.target.value)} /></label>
        <div><p className="field-label mb-2">Email layout</p><div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => updateDesign('layout', 'classic')} className={`rounded-xl border p-3 text-left text-sm ${design.layout === 'classic' ? 'border-gold-500 bg-gold-50' : 'border-black/10'}"><b>Classic</b><span className="mt-1 block text-xs text-navy-400">Left aligned content</span></button>
          <button type="button" onClick={() => updateDesign('layout', 'centered')} className={`rounded-xl border p-3 text-left text-sm ${design.layout === 'centered' ? 'border-gold-500 bg-gold-50' : 'border-black/10'}"><b>Centered</b><span className="mt-1 block text-xs text-navy-400">Centered content</span></button>
        </div></div>
        <div className="grid grid-cols-2 gap-2">
          <ColorField label="Page background" value={design.backgroundColor} onChange={value => updateDesign('backgroundColor', value)} />
          <ColorField label="Email card" value={design.cardColor} onChange={value => updateDesign('cardColor', value)} />
          <ColorField label="Header background" value={design.headerColor} onChange={value => updateDesign('headerColor', value)} />
          <ColorField label="Header accent" value={design.accentColor} onChange={value => updateDesign('accentColor', value)} />
          <ColorField label="Text colour" value={design.textColor} onChange={value => updateDesign('textColor', value)} />
          <ColorField label="Button background" value={design.buttonColor} onChange={value => updateDesign('buttonColor', value)} />
        </div>
        <div className="space-y-2 rounded-xl border border-black/10 p-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={design.showHeader} onChange={event => updateDesign('showHeader', event.target.checked)} />Show branded header</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={design.showFooter} onChange={event => updateDesign('showFooter', event.target.checked)} />Show hotel footer</label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => void saveTemplate()} disabled={savingTemplate} className="btn-primary justify-center"><CheckCircle2 size={15} />{savingTemplate ? 'Saving…' : editingId ? 'Update template' : 'Save template'}</button>
          <button type="button" onClick={startNewTemplate} className="btn-outline btn-sm"><Plus size={15} />New design</button>
        </div>
      </section>

      <div className="space-y-5">
        {showPreview && <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Design preview</h2><p className="mt-1 text-xs text-navy-400">Sample content shows how your saved layout will look.</p></div><Eye size={17} className="text-gold-600" /></div>
          <iframe title="Template design preview" sandbox="" srcDoc={makeEmailHtml(design, starterFields)} className="h-[570px] w-full border-0 bg-[#f5f2eb]" />
        </section>}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Saved templates</h2><p className="mt-1 text-xs text-navy-400">Choose one when you are ready to prepare an email.</p></div><span className="rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">{templates.length} saved</span></div>
          {loading ? <p className="p-8 text-center text-sm text-navy-400">Loading templates…</p> : templates.length ? <div className="divide-y divide-black/5">{templates.map(template => <div key={template.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-400"><Mail size={18} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{template.name}</p><p className="text-xs text-navy-400">Updated {new Date(template.updated_at).toLocaleDateString('en-NG')}</p></div></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => useTemplate(template)} className="btn-primary btn-sm">Use template</button><button type="button" onClick={() => editTemplate(template)} className="btn-outline btn-sm"><Pencil size={13} />Edit</button><button type="button" onClick={() => void duplicateTemplate(template)} className="btn-outline btn-sm" title="Duplicate"><Copy size={13} /></button><button type="button" onClick={() => void deleteTemplate(template)} className="btn-outline btn-sm text-red-600" title="Delete"><Trash2 size={13} /></button></div>
          </div>)}</div> : <div className="p-8 text-center"><LayoutTemplate size={28} className="mx-auto text-navy-300" /><p className="mt-3 text-sm font-medium">No saved templates yet</p><p className="mt-1 text-xs text-navy-400">Set your colours and layout, then save your first template.</p></div>}
        </section>
      </div>
    </div>}

    {tab === 'compose' && <div className={`grid items-start gap-5 ${showPreview ? 'xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)]' : 'grid-cols-1'}`}>
      <section className="card space-y-5 p-5">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold">Create newsletter</h2><p className="mt-1 text-xs text-navy-400">The template design stays the same. Just update this email's content.</p></div><Mail size={19} className="text-gold-600" /></div>
        <label className="block"><span className="field-label">Choose saved template</span><select className="field-input" value={selectedId} onChange={event => { const item = templates.find(template => template.id === event.target.value); if (item) useTemplate(item) }}><option value="">Select a template</option>{templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
        <label className="block"><span className="field-label">Email subject</span><input className="field-input" maxLength={180} value={subject} onChange={event => setSubject(event.target.value)} placeholder="A special update from Blue Pair" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2"><span className="field-label">Main heading</span><input className="field-input" maxLength={160} value={fields.heading} onChange={event => updateField('heading', event.target.value)} placeholder="Your newsletter heading" /></label>
          <label className="block sm:col-span-2"><span className="field-label">Intro text</span><textarea className="field-input min-h-20" maxLength={500} value={fields.intro} onChange={event => updateField('intro', event.target.value)} placeholder="A short introduction for your guests" /></label>
          <label className="block sm:col-span-2"><span className="field-label">Newsletter content</span><textarea className="field-input min-h-44" value={fields.body} onChange={event => updateField('body', event.target.value)} placeholder="Write your newsletter here. Leave a blank line between paragraphs." /><span className="mt-1 block text-[11px] text-navy-400">Each new paragraph is spaced automatically.</span></label>
          <div className="sm:col-span-2"><span className="field-label">Newsletter image (optional)</span><div className="flex flex-wrap items-center gap-3"><ImageUploader folder="newsletter" label="Upload image" onUploaded={urls => { if (urls[0]) updateField('imageUrl', urls[0]) }} /><span className="text-xs text-navy-400">Upload a banner or campaign picture.</span></div><input className="field-input mt-2" value={fields.imageUrl} onChange={event => updateField('imageUrl', event.target.value)} placeholder="Or paste an image URL" /></div>
          <label className="block"><span className="field-label">Button text (optional)</span><input className="field-input" maxLength={60} value={fields.buttonText} onChange={event => updateField('buttonText', event.target.value)} placeholder="Explore Blue Pair" /></label>
          <label className="block"><span className="field-label">Button link</span><input className="field-input" value={fields.buttonUrl} onChange={event => updateField('buttonUrl', event.target.value)} placeholder="https://bluepairsignature.com" /></label>
        </div>
        <fieldset className="rounded-xl border border-black/10 p-4">
          <legend className="px-1 text-xs font-semibold text-navy-600">Who should receive this email?</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={`cursor-pointer rounded-xl border p-3 ${recipientMode === 'all' ? 'border-gold-500 bg-gold-50/50' : 'border-black/10'}"><span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="audience" checked={recipientMode === 'all'} onChange={() => setRecipientMode('all')} />All guest emails</span><span className="ml-6 block text-xs text-navy-400">Send to eligible guest addresses</span></label>
            <label className={`cursor-pointer rounded-xl border p-3 ${recipientMode === 'custom' ? 'border-gold-500 bg-gold-50/50' : 'border-black/10'}"><span className="flex items-center gap-2 text-sm font-semibold"><input type="radio" name="audience" checked={recipientMode === 'custom'} onChange={() => setRecipientMode('custom')} />A custom list</span><span className="ml-6 block text-xs text-navy-400">Choose specific recipients</span></label>
          </div>
          {recipientMode === 'custom' && <label className="mt-3 block"><span className="field-label">Email addresses</span><textarea value={customEmails} onChange={event => setCustomEmails(event.target.value)} className="field-input min-h-24" placeholder="guest@example.com, another@example.com" /><span className="mt-1 block text-[11px] text-navy-400">Separate addresses with commas or new lines.</span></label>}
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-4"><p className="max-w-sm text-xs text-navy-400">Your email will use the selected template. Sending keeps the existing 50-recipient daily queue limit.</p><button type="button" onClick={() => void sendNewsletter()} disabled={sending || !templates.length} className="btn-primary min-w-44 justify-center">{sending ? <><Clock3 size={15} />Preparing email…</> : <><Send size={15} />Send newsletter</>}</button></div>
      </section>
      {showPreview && <section className="card overflow-hidden xl:sticky xl:top-5"><div className="border-b border-black/5 px-5 py-4"><h2 className="font-semibold">Live email preview</h2><p className="mt-1 text-xs text-navy-400">{subject || 'Your email subject will appear here'}</p></div><iframe title="Newsletter preview" sandbox="" srcDoc={preview} className="h-[760px] w-full border-0 bg-[#f5f2eb]" /><p className="border-t border-black/5 px-5 py-3 text-[11px] text-navy-400">Preview updates as you edit. Email apps may display some details slightly differently.</p></section>}
    </div>}

    {tab === 'campaigns' && <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 px-5 py-4"><div><h2 className="font-semibold">Newsletter campaigns</h2><p className="mt-1 text-xs text-navy-400">See which campaigns are queued and delivered.</p></div><Mail size={17} className="text-gold-600" /></div>
      {loading ? <p className="p-8 text-center text-sm text-navy-400">Loading newsletter activity…</p> : campaigns.length ? <div className="divide-y divide-black/5">{campaigns.map(campaign => <div key={campaign.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><b>{campaign.subject}</b><p className="mt-1 text-xs text-navy-400">{new Date(campaign.created_at).toLocaleString('en-NG')} · {campaign.total} recipients · {campaign.recipient_mode === 'custom' ? 'Custom list' : 'All guest emails'}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700"><Clock3 className="mr-1 inline" size={12} />{campaign.queued} queued</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700"><CheckCircle2 className="mr-1 inline" size={12} />{campaign.sent} sent</span>{campaign.pending > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">{campaign.pending} scheduled</span>}{campaign.failed > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 text-red-700"><AlertCircle className="mr-1 inline" size={12} />{campaign.failed} failed</span>}</div></div>)}</div> : <div className="p-8 text-center"><Mail size={28} className="mx-auto text-navy-300" /><p className="mt-3 text-sm font-medium">No newsletters sent yet</p><button type="button" onClick={() => setTab(templates.length ? 'compose' : 'templates')} className="btn-outline btn-sm mt-3">{templates.length ? 'Create newsletter' : 'Create your first template'}</button></div>}
    </section>}
  </div>
}
