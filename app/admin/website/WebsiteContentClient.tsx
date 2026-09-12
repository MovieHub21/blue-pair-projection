'use client'
import { useState } from 'react'
import ContentField from '../../../components/admin/ContentField'
import { useStore } from '../../../store/useStore'
import { supabase } from '../../../lib/supabase/client'
import { Loader2, Check, EyeOff } from 'lucide-react'

const TABS = ['Homepage', 'About', 'Hotel Info', 'Contact', 'FAQ', 'Footer', 'Social Links'] as const

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/bluepairhotel' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/bluepairhotel' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@bluepairhotel' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/blue-pair-hotel' },
  { key: 'other', label: 'Other', placeholder: 'https://example.com/bluepair' },
] as const

const TAB_KEYS: Record<typeof TABS[number], string[]> = {
  Homepage: ['home_headline', 'home_subtitle'],
  About: ['about_title'],
  'Hotel Info': ['hotel_address', 'hotel_phone', 'hotel_email'],
  Contact: ['contact_intro'],
  FAQ: ['faq_1'],
  Footer: ['footer_note'],
  'Social Links': SOCIALS.flatMap(s => [`social_${s.key}_enabled`, `social_${s.key}_url`, ...(s.key === 'other' ? ['social_other_label'] : [])]),
}

export default function WebsiteContentClient({ initialContent }: { initialContent: Record<string, string> }) {
  const [tab, setTab] = useState<typeof TABS[number]>('Homepage')
  const pushToast = useStore(s => s.pushToast)
  const [fields, setFields] = useState(initialContent)
  const [saving, setSaving] = useState(false)
  const set = (key: string, value: string) => setFields(f => ({ ...f, [key]: value }))

  async function save() {
    setSaving(true)
    const rows = TAB_KEYS[tab].map(key => ({ key, value: fields[key] ?? '' }))
    const { error } = await supabase.from('site_content').upsert(rows)
    setSaving(false)
    if (error) {
      pushToast('Could not save: ' + error.message, 'error')
      return
    }
    pushToast(`${tab} content published`, 'success')
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Website Content Management</h1>
        <p className="text-sm text-navy-400 mt-1">Changes here are used by the public website instead of requiring code edits.</p>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={'px-3.5 py-2 rounded-full text-xs font-semibold border ' + (tab === t ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{t}</button>)}
      </div>
      <div className="card p-6 max-w-3xl flex flex-col gap-5">
        {tab === 'Homepage' && <>
          <ContentField label="Hero headline" value={fields.home_headline ?? ''} onChange={v => set('home_headline', v)} />
          <ContentField label="Hero subtitle" value={fields.home_subtitle ?? ''} onChange={v => set('home_subtitle', v)} textarea />
        </>}
        {tab === 'About' && <ContentField label="About page title" value={fields.about_title ?? ''} onChange={v => set('about_title', v)} />}
        {tab === 'Hotel Info' && <>
          <ContentField label="Address" value={fields.hotel_address ?? ''} onChange={v => set('hotel_address', v)} />
          <ContentField label="Phone" value={fields.hotel_phone ?? ''} onChange={v => set('hotel_phone', v)} />
          <ContentField label="Email" value={fields.hotel_email ?? ''} onChange={v => set('hotel_email', v)} />
        </>}
        {tab === 'Contact' && <ContentField label="Contact page introduction" value={fields.contact_intro ?? ''} onChange={v => set('contact_intro', v)} textarea />}
        {tab === 'FAQ' && <ContentField label="FAQ content" value={fields.faq_1 ?? ''} onChange={v => set('faq_1', v)} textarea />}
        {tab === 'Footer' && <ContentField label="Footer note" value={fields.footer_note ?? ''} onChange={v => set('footer_note', v)} textarea />}
        {tab === 'Social Links' && <>
          <div className="rounded-xl bg-navy-50 p-4 text-sm text-navy-600">Turn a platform on to display it across the public website wherever social links are used. Turn it off to hide it without deleting the URL.</div>
          <div className="grid gap-4">
            {SOCIALS.map(s => {
              const enabled = (fields[`social_${s.key}_enabled`] ?? 'false') === 'true'
              return (
                <div key={s.key} className="rounded-2xl border border-black/10 p-4">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div><div className="font-semibold text-sm">{s.label}</div><div className="text-xs text-navy-400">{enabled ? 'Visible on the public website' : 'Hidden from the public website'}</div></div>
                    <button type="button" onClick={() => set(`social_${s.key}_enabled`, enabled ? 'false' : 'true')} className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-black/5 text-navy-500'}`}>
                      {enabled ? <Check size={13} /> : <EyeOff size={13} />}{enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  {s.key === 'other' && <ContentField label="Display name" value={fields.social_other_label ?? ''} onChange={v => set('social_other_label', v)} />}
                  <div className={s.key === 'other' ? 'mt-4' : ''}><ContentField label={`${s.label} URL`} value={fields[`social_${s.key}_url`] ?? ''} onChange={v => set(`social_${s.key}_url`, v)} hint={s.placeholder} /></div>
                </div>
              )
            })}
          </div>
        </>}
        <button onClick={() => void save()} disabled={saving} className="btn-primary w-fit disabled:opacity-60 flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Publishing…' : 'Save & publish'}
        </button>
      </div>
    </div>
  )
}
