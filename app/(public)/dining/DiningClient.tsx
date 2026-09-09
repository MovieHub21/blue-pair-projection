'use client'
import { useState } from 'react'
import SectionHeading from '../../../components/ui/SectionHeading'
import { menuItems } from '../../../data/mock'
import { naira } from '../../../lib/format'
import { Clock } from 'lucide-react'

export default function DiningClient() {
  const [outlet, setOutlet] = useState<'Blue Pair Restaurant' | 'Outdoor Bar & Eatery'>('Blue Pair Restaurant')
  const items = menuItems.filter(m => m.outlet === outlet)
  const categories = Array.from(new Set(items.map(i => i.category)))

  return (
    <section className="section">
      <div className="container-w">
        <div className="flex gap-3 mb-10">
          {(['Blue Pair Restaurant', 'Outdoor Bar & Eatery'] as const).map(o => (
            <button key={o} onClick={() => setOutlet(o)} className={'px-5 py-3 rounded-full text-sm font-semibold border ' + (outlet===o ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15 text-navy-700')}>{o}</button>
          ))}
        </div>
        <SectionHeading eyebrow={outlet === 'Blue Pair Restaurant' ? 'Fine dining' : 'Casual & al fresco'} title={outlet}
          subtitle={outlet === 'Blue Pair Restaurant' ? 'Open daily 7:00 AM – 11:00 PM. A market-driven menu of Nigerian classics and continental favourites, in the heart of Uromi.' : 'Open daily 4:00 PM – 2:00 AM. Small chops, suya, and cold drinks on the outdoor terrace.'} />
        {categories.map(cat => (
          <div key={cat} className="mb-10">
            <h4 className="text-lg font-semibold mb-4">{cat}</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              {items.filter(i => i.category === cat).map(item => (
                <div key={item.id} className="card p-4 flex gap-4 items-center">
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <b className="text-sm">{item.name}</b>
                      <span className="font-display text-sm shrink-0">{naira(item.price)}</span>
                    </div>
                    <span className={'mt-1.5 inline-block ' + (item.available ? 'pill-green' : 'pill-red')}>{item.available ? 'Available' : 'Sold out'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="card p-6 flex items-center gap-3 text-sm text-navy-500 mt-4"><Clock size={16} className="text-gold-500" /> Prices include VAT. A 10% service charge applies to all dine-in orders.</div>
      </div>
    </section>
  )
}
