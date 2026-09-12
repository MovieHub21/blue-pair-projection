'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import ImageUploader from '../../../components/admin/ImageUploader'
import { useAuth } from '../../../lib/useAuth'
import { CalendarDays, Edit3, Eye, EyeOff, FileText, Loader2, Plus, Search, Trash2, X } from 'lucide-react'

type Post = {
  id: string; title: string; slug: string; description: string; content: string; image_url: string
  category: string; published: boolean; published_at: string; created_at: string
}

type Form = Omit<Post, 'id' | 'created_at' | 'published_at'>
const emptyForm: Form = { title: '', slug: '', description: '', content: '', image_url: '', category: 'Hotel News', published: true }

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90)
}
function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export default function BlogManagement() {
  const auth = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [form, setForm] = useState<Form>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('blog_posts').select('*').order('published_at', { ascending: false })
    if (error) setMessage(error.message)
    setPosts((data ?? []) as Post[])
    setLoading(false)
  }
  useEffect(() => { void load() }, [])

  const categories = useMemo(() => ['All', ...Array.from(new Set(posts.map(p => p.category))).sort()], [posts])
  const filtered = useMemo(() => posts.filter(p => {
    const q = search.toLowerCase().trim()
    const matchesSearch = !q || `${p.title} ${p.description} ${p.category}`.toLowerCase().includes(q)
    return matchesSearch && (category === 'All' || p.category === category)
  }), [posts, search, category])

  function openCreate() {
    setEditingId(null); setForm(emptyForm); setShowForm(true); setMessage('')
  }
  function openEdit(post: Post) {
    setEditingId(post.id)
    setForm({ title: post.title, slug: post.slug, description: post.description, content: post.content, image_url: post.image_url, category: post.category, published: post.published })
    setShowForm(true); setMessage('')
  }
  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    setForm(current => ({ ...current, [key]: value }))
  }
  async function savePost() {
    if (!form.title.trim() || !form.description.trim() || !form.content.trim() || !form.image_url.trim()) {
      setMessage('Please add a title, description, story, and image.'); return
    }
    setSaving(true); setMessage('')
    const payload = { ...form, title: form.title.trim(), slug: slugify(form.slug || form.title), description: form.description.trim(), content: form.content.trim(), image_url: form.image_url.trim() }
    const result = editingId
      ? await supabase.from('blog_posts').update(payload).eq('id', editingId)
      : await supabase.from('blog_posts').insert(payload)
    if (result.error) setMessage(result.error.message)
    else { setMessage(editingId ? 'Story updated.' : 'Story published.'); setShowForm(false); await load() }
    setSaving(false)
  }
  async function togglePublished(post: Post) {
    const { error } = await supabase.from('blog_posts').update({ published: !post.published, published_at: !post.published ? new Date().toISOString() : post.published_at }).eq('id', post.id)
    if (!error) await load(); else setMessage(error.message)
  }
  async function remove(post: Post) {
    if (!confirm(`Delete “${post.title}”? This cannot be undone.`)) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', post.id)
    if (!error) await load(); else setMessage(error.message)
  }

  if (auth.loading || loading) return <div className="max-w-6xl mx-auto"><div className="h-8 w-52 bg-black/5 rounded-lg animate-pulse" /><div className="h-56 mt-6 bg-black/5 rounded-2xl animate-pulse" /></div>

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
        <div><span className="eyebrow">Content</span><h1 className="text-3xl font-semibold mt-1">Blog &amp; Stories</h1><p className="text-sm text-navy-400 mt-2 max-w-xl">Publish hotel news, dining stories, event ideas and guest experiences. Published stories appear on the public website automatically.</p></div>
        <button onClick={openCreate} className="btn-gold"><Plus size={16} />New story</button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-4"><span className="text-xs text-navy-400">Total stories</span><b className="block text-2xl mt-1">{posts.length}</b></div>
        <div className="card p-4"><span className="text-xs text-navy-400">Published</span><b className="block text-2xl mt-1">{posts.filter(p => p.published).length}</b></div>
        <div className="card p-4"><span className="text-xs text-navy-400">Drafts</span><b className="block text-2xl mt-1">{posts.filter(p => !p.published).length}</b></div>
      </div>

      <div className="card p-3 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300" /><input value={search} onChange={e => setSearch(e.target.value)} className="field-input pl-9" placeholder="Search stories…" /></div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="field-input sm:w-48">{categories.map(c => <option key={c}>{c}</option>)}</select>
      </div>

      {message && !showForm && <div className="mb-5 rounded-xl bg-navy-50 text-navy-700 text-sm px-4 py-3">{message}</div>}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(post => (
          <article key={post.id} className="card overflow-hidden group">
            <div className="aspect-[16/9] overflow-hidden relative bg-navy-100">
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className={'absolute top-3 left-3 pill ' + (post.published ? 'pill-green' : 'pill-amber')}>{post.published ? 'Published' : 'Draft'}</span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between gap-3 text-[11px] text-navy-400"><span className="tag">{post.category}</span><span className="flex items-center gap-1"><CalendarDays size={12} />{dateLabel(post.published_at)}</span></div>
              <h2 className="font-display text-xl text-navy-950 mt-4 leading-snug">{post.title}</h2>
              <p className="text-sm text-navy-500 leading-6 mt-2 line-clamp-2">{post.description}</p>
              <div className="flex gap-2 mt-5 pt-4 border-t border-black/5">
                <button onClick={() => openEdit(post)} className="btn-outline btn-sm"><Edit3 size={13} />Edit</button>
                <button onClick={() => togglePublished(post)} className="btn-outline btn-sm" title={post.published ? 'Unpublish' : 'Publish'}>{post.published ? <EyeOff size={13} /> : <Eye size={13} />}{post.published ? 'Hide' : 'Publish'}</button>
                <button onClick={() => remove(post)} className="ml-auto w-9 h-9 rounded-full border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50"><Trash2 size={13} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && <div className="card p-12 text-center"><FileText className="mx-auto text-gold-500" /><h3 className="font-display text-2xl mt-3">No stories found</h3><p className="text-sm text-navy-400 mt-2">Try another search or create your first story.</p></div>}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-navy-950/45 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-cream-50 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between sticky top-0 bg-cream-50/95 backdrop-blur z-10"><div><span className="eyebrow">Journal editor</span><h2 className="text-xl font-semibold">{editingId ? 'Edit story' : 'Create a new story'}</h2></div><button onClick={() => setShowForm(false)} className="w-9 h-9 rounded-full border border-black/10 flex items-center justify-center"><X size={16} /></button></div>
            <div className="p-6 grid lg:grid-cols-[1fr_300px] gap-7">
              <div className="space-y-4">
                <div><label className="field-label">Heading</label><input value={form.title} onChange={e => { setField('title', e.target.value); if (!editingId && !form.slug) setField('slug', slugify(e.target.value)) }} className="field-input" placeholder="A beautiful new story about Blue Pair Hotel" /></div>
                <div><label className="field-label">Short description</label><textarea value={form.description} onChange={e => setField('description', e.target.value)} className="field-input min-h-24 py-3" maxLength={240} placeholder="A concise introduction that appears on cards and in search previews." /></div>
                <div><label className="field-label">Story</label><textarea value={form.content} onChange={e => setField('content', e.target.value)} className="field-input min-h-[300px] py-3 leading-7" placeholder="Write the full story. Use a blank line between paragraphs." /></div>
              </div>
              <div className="space-y-4">
                <div className="card p-4"><label className="field-label">Cover image</label>{form.image_url ? <div className="relative rounded-xl overflow-hidden aspect-[16/10] mb-3"><img src={form.image_url} alt="Cover preview" className="w-full h-full object-cover" /><button onClick={() => setField('image_url', '')} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center"><X size={14} /></button></div> : <div className="aspect-[16/10] rounded-xl bg-navy-50 border border-dashed border-black/10 flex items-center justify-center mb-3 text-xs text-navy-400">Choose a cover photo</div>}<ImageUploader folder="blog" label="Upload cover image" onUploaded={urls => setField('image_url', urls[0] ?? '')} /></div>
                <div><label className="field-label">Category</label><input value={form.category} onChange={e => setField('category', e.target.value)} className="field-input" placeholder="Hotel News" /></div>
                <div><label className="field-label">URL slug</label><input value={form.slug} onChange={e => setField('slug', slugify(e.target.value))} className="field-input" /></div>
                <label className="card p-4 flex items-center justify-between cursor-pointer"><div><b className="text-sm">Publish now</b><p className="text-xs text-navy-400 mt-1">Make this story visible on the website.</p></div><input type="checkbox" checked={form.published} onChange={e => setField('published', e.target.checked)} className="w-4 h-4 accent-navy-900" /></label>
              </div>
            </div>
            <div className="px-6 py-5 border-t border-black/5 flex justify-end gap-3"><button onClick={() => setShowForm(false)} className="btn-outline">Cancel</button><button onClick={savePost} disabled={saving} className="btn-gold min-w-32">{saving ? <><Loader2 size={14} className="animate-spin" />Saving…</> : editingId ? 'Save changes' : 'Publish story'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
