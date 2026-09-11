'use client'
import { useEffect, useState } from 'react'
import ContentField from '../../../../components/admin/ContentField'
import ImageUploader from '../../../../components/admin/ImageUploader'
import { useStore } from '../../../../store/useStore'
import { Trash2 } from 'lucide-react'

export default function AmenityManagementPage({ params }: { params: { key: string } }) {
  const k = params.key ?? 'vip-lounge'
  const { pushToast, saveAmenity } = useStore()
  const amenity = useStore(s => s.amenities.find(a => a.key === k))
  const loaded = useStore(s => s.loaded)

  const [draft, setDraft] = useState({ description: '', hours: '', pricingNote: '', facilities: '' })

  useEffect(() => {
    if (amenity) setDraft({
      description: amenity.description,
      hours: amenity.hours,
      pricingNote: amenity.pricingNote,
      facilities: amenity.facilities.join(', '),
    })
  }, [amenity?.key, amenity?.description, amenity?.hours, amenity?.pricingNote, amenity?.facilities.join(',')])

  if (!amenity) {
    return <p className="text-sm text-navy-400">{loaded ? 'This section was not found.' : 'Loading…'}</p>
  }

  const gallery = amenity.gallery

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{amenity.name} Management</h1>
          <p className="text-xs text-navy-400 mt-1">Everything here shows on the public {amenity.name} page.</p>
        </div>
        <span className={amenity.published ? 'pill-green' : 'pill-amber'}>{amenity.published ? 'Published' : 'Draft'}</span>
      </div>

      <div className="card p-6 max-w-2xl flex flex-col gap-5">
        <ContentField label="Description" value={draft.description} onChange={v => setDraft({ ...draft, description: v })} textarea />
        <div className="grid grid-cols-2 gap-4">
          <ContentField label="Opening hours" value={draft.hours} onChange={v => setDraft({ ...draft, hours: v })} />
          <ContentField label="Pricing note" value={draft.pricingNote} onChange={v => setDraft({ ...draft, pricingNote: v })} />
        </div>
        <ContentField label="Services & facilities (comma separated)" value={draft.facilities} onChange={v => setDraft({ ...draft, facilities: v })} textarea />

        <div>
          <label className="field-label">Main (hero) photo</label>
          <div className="flex items-center gap-4">
            <div className="w-40 h-24 rounded-lg overflow-hidden bg-cream-100">
              {amenity.heroImage && <img src={amenity.heroImage} className="w-full h-full object-cover" alt={amenity.name} />}
            </div>
            <ImageUploader folder={`amenities/${k}`} label="Upload from device"
              onUploaded={async urls => {
                if (await saveAmenity(k, { heroImage: urls[0] })) pushToast('Main photo updated', 'success')
                else pushToast('Could not save the main photo. Please try again.', 'error')
              }} />
          </div>
        </div>

        <div>
          <label className="field-label">Gallery photos</label>
          <div className="grid grid-cols-4 gap-2.5 mb-3">
            {gallery.map((src, i) => (
              <div key={src + i} className="relative aspect-square rounded-lg overflow-hidden group">
                <img src={src} className="w-full h-full object-cover" alt={`${amenity.name} photo ${i + 1}`} />
                <button onClick={async () => {
                  if (!(await saveAmenity(k, { gallery: gallery.filter((_, j) => j !== i) }))) pushToast('Could not remove the photo. Please try again.', 'error')
                }}
                  className="absolute top-1 right-1 w-7 h-7 rounded-full bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <ImageUploader folder={`amenities/${k}`} multiple label="Upload photos from device"
            onUploaded={async urls => {
              if (await saveAmenity(k, { gallery: [...gallery, ...urls] })) pushToast('Photos added', 'success')
              else pushToast('Could not save the photos. Please try again.', 'error')
            }} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={async () => {
              const saved = await saveAmenity(k, {
                description: draft.description,
                hours: draft.hours,
                pricingNote: draft.pricingNote,
                facilities: draft.facilities.split(',').map(f => f.trim()).filter(Boolean),
                published: true,
              })
              pushToast(saved ? `${amenity.name} page published` : `Could not publish the ${amenity.name} page. Please try again.`, saved ? 'success' : 'error')
            }}
            className="btn-primary">Publish changes</button>
          <button onClick={async () => {
            if (await saveAmenity(k, { published: false })) pushToast('Saved as draft', 'info')
            else pushToast('Could not save the draft. Please try again.', 'error')
          }} className="btn-outline">Save as draft</button>
        </div>
      </div>
    </div>
  )
}
