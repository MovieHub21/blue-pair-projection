'use client'
import { useState } from 'react'
import SectionHeading from '../../../components/ui/SectionHeading'
import Modal from '../../../components/ui/Modal'
import { useStore } from '../../../store/useStore'
import { naira } from '../../../lib/format'
import { Ruler, MapPin } from 'lucide-react'
import type { BillboardSpace } from '../../../data/mock'

export default function BillboardClient({ billboards }: { billboards: BillboardSpace[] }) {
  const pushToast = useStore(s => s.pushToast)
  const [active, setActive] = useState<typeof billboards[0] | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    setSubmitted(true)
    pushToast('Billboard reservation request sent', 'success')
  }

  return (
    <section className="section">
      <div className="container-w">
        <SectionHeading eyebrow="High-visibility spaces" title="Advertise on the Blue Pair campus"
          subtitle="Reach thousands of guests, event attendees, and passers-by across our most visible locations in Uromi, Edo State." />
        <div className="grid md:grid-cols-3 gap-6">
          {billboards.map(b => (
            <div key={b.id} className="card overflow-hidden flex flex-col">
              <div className="h-44 relative">
                <img src={b.image} alt={`Billboard advertising space — ${b.location}`} className="w-full h-full object-cover" />
                <span className={'absolute top-3 left-3 ' + (b.available ? 'pill-green' : 'pill-red') + ' bg-white/95'}>{b.available ? 'Available' : 'Reserved'}</span>
              </div>
              <div className="p-5 flex flex-col gap-2.5 flex-1">
                <h4 className="font-semibold flex items-center gap-1.5"><MapPin size={14} className="text-gold-500" />{b.location}</h4>
                <span className="text-xs text-navy-500 flex items-center gap-1.5"><Ruler size={13} />{b.dimensions}</span>
                <div className="font-display text-lg mt-1">{naira(b.price)}<span className="text-xs text-navy-400 font-body"> /month</span></div>
                <button disabled={!b.available} onClick={() => { setActive(b); setSubmitted(false) }}
                  className={'btn-sm mt-auto justify-center ' + (b.available ? 'btn-gold' : 'btn-outline opacity-50 cursor-not-allowed')}>
                  {b.available ? 'Reserve billboard' : 'Currently reserved'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!active} onClose={() => setActive(null)} title={submitted ? 'Request sent' : `Reserve — ${active?.location}`} subtitle={!submitted ? active?.dimensions : undefined}>
        {submitted ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <p className="text-sm text-navy-500">Our advertising team will contact you within 24 hours to confirm artwork specs and scheduling.</p>
            <button onClick={() => setActive(null)} className="btn-primary mt-6">Done</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div><label className="field-label">Company name</label><input className="field-input" placeholder="Acme Nigeria Ltd" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="field-label">Contact email</label><input className="field-input" placeholder="ads@company.com" /></div>
              <div><label className="field-label">Phone</label><input className="field-input" placeholder="+234 800 000 0000" /></div>
            </div>
            <div><label className="field-label">Preferred duration</label><select className="field-input"><option>1 month</option><option>3 months</option><option>6 months</option><option>12 months</option></select></div>
            <button onClick={submit} className="btn-gold w-full justify-center mt-2">Send reservation request</button>
          </div>
        )}
      </Modal>
    </section>
  )
}
