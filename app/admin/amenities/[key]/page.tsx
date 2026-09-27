'use client'
import { useEffect, useState, useCallback } from 'react'
import ContentField from '../../../../components/admin/ContentField'
import { pushToast } from '../../../../components/ui/Toast'
import { supabase } from '../../../../lib/supabase/client'
import { mapAmenity, type Amenity } from '../../../../lib/mappers'

export default function AmenityManagementPage({ params }: { params: { key: string } }) {
  const k = params.key ?? 'vip-lounge'
  const [amenity, setAmenity] = useState<Amenity | null>(null)
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ description: '', hours: '', pricingNote: '', facilities: '' })

  const loadAmenity = useCallback(async () => {
    const { data, error } = await supabase.from('amenities').select('*').eq('key', k).single()
    if (!error && data) {
      const mapped = mapAmenity(data)
      setAmenity(mapped)
      setDraft({
        description: mapped.description,
        hours: mapped.hours,
        pricingNote: mapped.pricingNote,
        facilities: mapped.facilities.join(', '),
      })
    }
    setLoading(false)
  }, [k])

  useEffect(() => {
    loadAmenity()
  }, [loadAmenity])

  async function saveAmenityPatch(patch: Partial<Amenity>): Promise<boolean> {
    const dbPatch: Record<string, unknown> = {}
    if (patch.name !== undefined) dbPatch.name = patch.name
    if (patch.eyebrow !== undefined) dbPatch.eyebrow = patch.eyebrow
    if (patch.description !== undefined) dbPatch.description = patch.description
    if (patch.hours !== undefined) dbPatch.hours = patch.hours
    if (patch.facilities !== undefined) dbPatch.facilities = patch.facilities
    if (patch.pricingNote !== undefined) dbPatch.pricing_note = patch.pricingNote
    if (patch.ctaLabel !== undefined) dbPatch.cta_label = patch.ctaLabel
    if (patch.published !== undefined) dbPatch.published = patch.published
    const { error } = await supabase.from('amenities').update(dbPatch).eq('key', k)
    if (error) return false
    setAmenity(prev => prev ? { ...prev, ...patch } : prev)
    return true
  }

  if (!amenity) {
    return <p className="text-sm text-navy-400">{loading ? 'Loading…' : 'This section was not found.'}</p>
  }

  const gallery = amenity.gallery

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3"><div><h1 className="text-2xl font-semibold">{amenity.name} Management</h1><p className="text-xs text-navy-400 mt-1">Everything here shows on the public {amenity.name} page.</p></div><span className={amenity.published ? 'pill-green' : 'pill-amber'}>{amenity.published ? 'Published' : 'Draft'}</span></div>
      <div className="card p-6 max-w-2xl flex flex-col gap-5">
        <ContentField label="Description" value={draft.description} onChange={v => setDraft({ ...draft, description: v })} textarea />
        <div className="grid grid-cols-2 gap-4"><ContentField label="Opening hours" value={draft.hours} onChange={v => setDraft({ ...draft, hours: v })} /><ContentField label="Pricing note" value={draft.pricingNote} onChange={v => setDraft({ ...draft, pricingNote: v })} /></div>
        <ContentField label="Services & facilities (comma separated)" value={draft.facilities} onChange={v => setDraft({ ...draft, facilities: v })} textarea />
        <div><label className="field-label">Photography</label><div className="grid grid-cols-4 gap-2.5 mb-3">{[amenity.heroImage, ...gallery.filter(src => src !== amenity.heroImage)].filter(Boolean).map((src, i) => <div key={src + i} className="aspect-square rounded-lg overflow-hidden bg-cream-100"><img loading="lazy" decoding="async" src={src} className="w-full h-full object-cover" alt={`${amenity.name} photo ${i + 1}`} /></div>)}</div><div className="rounded-lg border border-black/10 bg-cream-50 p-3 text-xs text-navy-500">Amenity photography is code-managed. Add, remove or reorder images in <code>lib/staticImages.ts</code>. Multiple gallery images are supported.</div></div>
        <div className="flex gap-3 pt-2"><button onClick={async () => { const saved = await saveAmenityPatch({ description: draft.description, hours: draft.hours, pricingNote: draft.pricingNote, facilities: draft.facilities.split(',').map(f => f.trim()).filter(Boolean), published: true }); pushToast(saved ? `${amenity.name} page published` : `Could not publish the ${amenity.name} page. Please try again.`, saved ? 'success' : 'error') }} className="btn-primary">Publish changes</button><button onClick={async () => { if (await saveAmenityPatch({ published: false })) pushToast('Saved as draft', 'info'); else pushToast('Could not save the draft. Please try again.', 'error') }} className="btn-outline">Save as draft</button></div>
      </div>
    </div>
  )
}
