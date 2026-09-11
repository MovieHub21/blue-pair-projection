'use client'
import { useState } from 'react'
import ContentField from '../../../components/admin/ContentField'
import { useStore } from '../../../store/useStore'
import { supabase } from '../../../lib/supabase/client'
import { Loader2, Info } from 'lucide-react'

const TABS = ['Homepage', 'About', 'Hotel Info', 'Contact', 'FAQ', 'Footer', 'Social Links'] as const

// Fields wired into the live public pages already. Others save correctly but aren't shown on the site yet.
const LIVE_KEYS = new Set(['home_headline', 'home_subtitle', 'about_title'])

export default function WebsiteContentClient({ initialContent }: { initialContent: Record<string, string> }) {
  const [tab, setTab] = useState<typeof TABS[number]>('Homepage')
  const pushToast = useStore(s => s.pushToast)
  const [fields, setFields] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }))

  const TAB_KEYS: Record<typeof TABS[number], string[]> = {
    Homepage: ['home_headline', 'home_subtitle'],
    About: ['about_title'],
    'Hotel Info': ['hotel_address', 'hotel_phone', 'hotel_email'],
    Contact: ['contact_intro'],
    FAQ: ['faq_1'],
    Footer: ['footer_note'],
    'Social Links': ['social_instagram'],
  }

  async function save() {
    setSaving(true)
    const keys = TAB_KEYS[tab]
    const rows = keys.map(k => ({ key: k, value: fields[k] ?? '' }))
    const { error } = await supabase.from('site_content').upsert(rows)
    setSaving(false)
    if (error) { pushToast('Could not save: ' + error.message, 'error'); return }
    pushToast(`${tab} content saved`, 'success')
  }

  const anyLive = TAB_KEYS[tab].some(k => LIVE_KEYS.has(k))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Website Content Management</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={'px-3.5 py-2 rounded-full text-xs font-semibold border ' + (tab===t ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{t}</button>)}
      </div>
      <div className="card p-6 max-w-2xl flex flex-col gap-5">
        {!anyLive && (
          <div className="flex items-start gap-2 text-xs text-navy-500 bg-cream-100 rounded-lg px-3.5 py-2.5">
            <Info size={14} className="text-gold-600 shrink-0 mt-0.5" />
            This saves correctly, but isn't displayed on the public site yet — only Homepage and About are live right now.
          </div>
        )}
        {tab === 'Homepage' && <>
          <ContentField label="Hero headline" value={fields.home_headline ?? ''} onChange={v=>set('home_headline',v)} />
          <ContentField label="Hero subtitle" value={fields.home_subtitle ?? ''} onChange={v=>set('home_subtitle',v)} textarea />
        </>}
        {tab === 'About' && <ContentField label="About page title" value={fields.about_title ?? ''} onChange={v=>set('about_title',v)} />}
        {tab === 'Hotel Info' && <>
          <ContentField label="Address" value={fields.hotel_address ?? ''} onChange={v=>set('hotel_address',v)} />
          <ContentField label="Phone" value={fields.hotel_phone ?? ''} onChange={v=>set('hotel_phone',v)} />
          <ContentField label="Email" value={fields.hotel_email ?? ''} onChange={v=>set('hotel_email',v)} />
        </>}
        {tab === 'Contact' && <ContentField label="Contact page intro" value={fields.contact_intro ?? ''} onChange={v=>set('contact_intro',v)} textarea />}
        {tab === 'FAQ' && <ContentField label="FAQ #1" value={fields.faq_1 ?? ''} onChange={v=>set('faq_1',v)} textarea />}
        {tab === 'Footer' && <ContentField label="Footer note" value={fields.footer_note ?? ''} onChange={v=>set('footer_note',v)} textarea />}
        {tab === 'Social Links' && <ContentField label="Instagram" value={fields.social_instagram ?? ''} onChange={v=>set('social_instagram',v)} />}
        <button onClick={save} disabled={saving} className="btn-primary w-fit disabled:opacity-60 flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Saving…' : 'Save & publish'}
        </button>
      </div>
    </div>
  )
}
