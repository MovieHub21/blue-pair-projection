'use client'
import { useState } from 'react'
import ContentField from '../../../../components/admin/ContentField'
import { useStore } from '../../../../store/useStore'

interface AmenityDraft { description: string; hours: string; pricing: string; services: string }

const DEFAULTS: Record<string, AmenityDraft> = {
  'vip-lounge': { description: 'A members-style lounge for hotel guests and VIP cardholders — private seating, a curated drinks list, and a dedicated host from check-in to last call.', hours: 'Daily, 6:00 PM – 3:00 AM', pricing: 'Free entry for hotel guests. ₦20,000 minimum spend for walk-ins.', services: 'Private booth seating, dedicated host, premium spirits list, cigar terrace access' },
  'gym': { description: 'A full-equipment fitness studio overlooking the pool deck, with personal trainers available on request.', hours: 'Daily, 5:00 AM – 10:00 PM', pricing: 'Complimentary for hotel guests. Day pass: ₦10,000.', services: 'Free weights, cardio machines, personal trainers, towel service' },
  'pool': { description: 'A temperature-controlled indoor pool with a dedicated kids\\u2019 section and poolside service.', hours: 'Daily, 6:00 AM – 9:00 PM', pricing: 'Complimentary for hotel guests. Day pass: ₦15,000.', services: 'Lifeguard on duty, poolside food & drink, sun loungers, cabanas' },
  'games': { description: 'A dedicated games room with pool tables, table tennis, board games, and a sports lounge.', hours: 'Daily, 10:00 AM – 12:00 AM', pricing: 'Pool table: ₦3,000/hr. Table tennis: ₦2,000/hr.', services: 'Pool tables, table tennis, board games, console gaming corner' },
  'club': { description: 'Edo State\\u2019s after-dark address — resident and guest DJs, bottle service, and a terrace onto the pool deck.', hours: 'Thu – Sun, 9:00 PM – 4:00 AM', pricing: 'Entry: ₦10,000 (redeemable at bar). VIP tables from ₦150,000.', services: 'Resident & guest DJs, bottle service, VIP booths, outdoor terrace' },
}

const NAMES: Record<string, string> = { 'vip-lounge': 'VIP Lounge', gym: 'Gym', pool: 'Pool', games: 'Games', club: 'Club' }

export default function AmenityManagementPage({ params }: { params: { key: string } }) {
  const k = params.key ?? 'vip-lounge'
  const { pushToast } = useStore()
  const [draft, setDraft] = useState<AmenityDraft>(DEFAULTS[k] ?? DEFAULTS['vip-lounge'])
  const [published, setPublished] = useState(true)

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">{NAMES[k] ?? 'Amenity'} Management</h1>
        <span className={published ? 'pill-green' : 'pill-amber'}>{published ? 'Published' : 'Draft'}</span>
      </div>
      <div className="card p-6 max-w-2xl flex flex-col gap-5">
        <ContentField label="Description" value={draft.description} onChange={v => setDraft({...draft, description: v})} textarea />
        <div className="grid grid-cols-2 gap-4">
          <ContentField label="Opening hours" value={draft.hours} onChange={v => setDraft({...draft, hours: v})} />
          <ContentField label="Pricing note" value={draft.pricing} onChange={v => setDraft({...draft, pricing: v})} />
        </div>
        <ContentField label="Services & facilities (comma separated)" value={draft.services} onChange={v => setDraft({...draft, services: v})} textarea />
        <div>
          <label className="field-label">Images</label>
          <div className="grid grid-cols-4 gap-2.5">
            {[1,2,3].map(i => <div key={i} className="aspect-square bg-cream-100 rounded-lg border border-dashed border-black/15 flex items-center justify-center text-navy-300 text-xs">Image {i}</div>)}
            <button className="aspect-square rounded-lg border border-dashed border-black/15 flex items-center justify-center text-navy-400 text-xs">+ Upload</button>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => { setPublished(true); pushToast(`${NAMES[k]} page published`, 'success') }} className="btn-primary">Publish changes</button>
          <button onClick={() => setPublished(false)} className="btn-outline">Save as draft</button>
        </div>
      </div>
    </div>
  )
}
