'use client'
import { useState } from 'react'
import ContentField from '../../../components/admin/ContentField'
import { useStore } from '../../../store/useStore'
import { Search } from 'lucide-react'

export default function SeoManagement() {
  const { pushToast } = useStore()
  const [seo, setSeo] = useState({
    title: 'Blue Pair Hotel — Luxury Hotel in Victoria Island, Lagos',
    description: 'Book your stay at Blue Pair Hotel, Lagos\u2019 premium address for rooms, dining, events and more in Victoria Island.',
    slug: '/',
    keywords: 'lagos hotel, victoria island hotel, luxury hotel nigeria, blue pair hotel',
    index: true,
    sitemap: true,
  })

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">SEO Management</h1>
      <div className="grid lg:grid-cols-[1fr,380px] gap-8">
        <div className="card p-6 flex flex-col gap-5">
          <ContentField label="Page title" value={seo.title} onChange={v => setSeo({...seo, title: v})} />
          <ContentField label="Meta description" value={seo.description} onChange={v => setSeo({...seo, description: v})} textarea />
          <ContentField label="URL slug" value={seo.slug} onChange={v => setSeo({...seo, slug: v})} />
          <ContentField label="Keywords" value={seo.keywords} onChange={v => setSeo({...seo, keywords: v})} hint="Comma separated" />
          <div><label className="field-label">Open Graph image</label><div className="h-32 w-56 bg-cream-100 rounded-lg border border-dashed border-black/15 flex items-center justify-center text-navy-300 text-xs">1200×630</div></div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={seo.index} onChange={e=>setSeo({...seo, index: e.target.checked})} />Index this page</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={seo.sitemap} onChange={e=>setSeo({...seo, sitemap: e.target.checked})} />Include in sitemap</label>
          </div>
          <button onClick={() => pushToast('SEO settings saved', 'success')} className="btn-primary w-fit">Save SEO settings</button>
        </div>
        <div>
          <span className="field-label">Search preview</span>
          <div className="card p-5">
            <div className="flex items-center gap-1.5 text-xs text-navy-400 mb-1"><Search size={12}/>bluepairhotel.com{seo.slug}</div>
            <div className="text-blue-700 text-lg leading-snug">{seo.title}</div>
            <div className="text-sm text-navy-500 mt-1 leading-relaxed">{seo.description}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
