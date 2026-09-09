'use client'
import { useState } from 'react'
import ContentField from '../../../components/admin/ContentField'
import { useStore } from '../../../store/useStore'

const TABS = ['Homepage', 'About', 'Amenities', 'Hotel Info', 'Contact', 'FAQ', 'Footer', 'Social Links'] as const

export default function WebsiteContent() {
  const [tab, setTab] = useState<typeof TABS[number]>('Homepage')
  const { pushToast } = useStore()
  const [fields, setFields] = useState({
    headline: 'Premium hospitality, the Blue Pair way.',
    sub: "Sixty rooms and suites, a resident restaurant and bar, an indoor pool, and a private Annex for extended stays.",
    aboutTitle: 'A homegrown luxury brand, built for Lagos',
    address: '17 Ozumba Mbadiwe Ave, Victoria Island, Lagos',
    phone: '+234 901 234 5678',
    email: 'reservations@bluepairhotel.com',
    faq1: 'What time is check-in? — Check-in is from 2:00 PM, check-out by 12:00 PM.',
    footerNote: "Lagos' premium address for stays, dining and events.",
    instagram: 'instagram.com/bluepairhotel',
  })
  const set = (k: string, v: string) => setFields({...fields, [k]: v})

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Website Content Management</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => <button key={t} onClick={() => setTab(t)} className={'px-3.5 py-2 rounded-full text-xs font-semibold border ' + (tab===t ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{t}</button>)}
      </div>
      <div className="card p-6 max-w-2xl flex flex-col gap-5">
        {tab === 'Homepage' && <>
          <ContentField label="Hero headline" value={fields.headline} onChange={v=>set('headline',v)} />
          <ContentField label="Hero subtitle" value={fields.sub} onChange={v=>set('sub',v)} textarea />
        </>}
        {tab === 'About' && <ContentField label="About page title" value={fields.aboutTitle} onChange={v=>set('aboutTitle',v)} />}
        {tab === 'Amenities' && <p className="text-sm text-navy-500">Individual amenities are managed under Outlets → VIP Lounge / Gym / Pool / Games / Club in the sidebar.</p>}
        {tab === 'Hotel Info' && <>
          <ContentField label="Address" value={fields.address} onChange={v=>set('address',v)} />
          <ContentField label="Phone" value={fields.phone} onChange={v=>set('phone',v)} />
          <ContentField label="Email" value={fields.email} onChange={v=>set('email',v)} />
        </>}
        {tab === 'Contact' && <ContentField label="Contact page intro" value="Send us a message and our team will respond within 24 hours." onChange={()=>{}} textarea />}
        {tab === 'FAQ' && <ContentField label="FAQ #1" value={fields.faq1} onChange={v=>set('faq1',v)} textarea />}
        {tab === 'Footer' && <ContentField label="Footer note" value={fields.footerNote} onChange={v=>set('footerNote',v)} textarea />}
        {tab === 'Social Links' && <ContentField label="Instagram" value={fields.instagram} onChange={v=>set('instagram',v)} />}
        <div className="flex gap-3 pt-2">
          <button onClick={() => pushToast(`${tab} content published to live site`, 'success')} className="btn-primary">Publish</button>
          <button className="btn-outline">Save draft</button>
        </div>
      </div>
    </div>
  )
}
