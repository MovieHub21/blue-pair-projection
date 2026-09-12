import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CalendarDays, BookOpen } from 'lucide-react'
import { getPublishedBlogPosts } from '../../../lib/blog'
import { SITE_URL } from '../../../lib/siteConfig'

export const metadata: Metadata = {
  title: 'Hotel News & Stories | Blue Pair Hotel Uromi',
  description: 'Read the latest stories, hotel news, travel ideas, dining highlights and experiences from Blue Pair Hotel in Uromi, Edo State.',
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: { title: 'Hotel News & Stories | Blue Pair Hotel', description: 'Stories and updates from Blue Pair Hotel in Uromi, Edo State.', url: `${SITE_URL}/blog`, type: 'website' },
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value))
}

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts()
  const [featured, ...rest] = posts

  return (
    <main>
      <section className="relative overflow-hidden bg-navy-950 text-white px-6 md:px-10 py-20 md:py-28">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_75%_25%,#d7b65d,transparent_34%)]" />
        <div className="container-w relative">
          <span className="eyebrow text-gold-400">Blue Pair Journal</span>
          <h1 className="font-display text-4xl md:text-6xl max-w-3xl mt-4 leading-tight">Stories, stays and moments worth sharing.</h1>
          <p className="text-white/65 max-w-2xl mt-5 text-base md:text-lg leading-8">Discover hotel news, dining highlights, event inspiration and simple ideas for making your next stay in Uromi memorable.</p>
        </div>
      </section>

      <section className="section bg-cream-50">
        <div className="container-w">
          {featured ? (
            <Link href={`/blog/${featured.slug}`} className="group grid lg:grid-cols-[1.25fr_.75fr] overflow-hidden rounded-[2rem] bg-white border border-black/5 shadow-card mb-12">
              <div className="min-h-[300px] lg:min-h-[430px] overflow-hidden">
                <img src={featured.image_url} alt={featured.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              </div>
              <div className="p-7 md:p-10 lg:p-12 flex flex-col justify-center">
                <span className="tag w-fit">{featured.category}</span>
                <h2 className="font-display text-3xl md:text-4xl text-navy-950 mt-5 leading-tight">{featured.title}</h2>
                <p className="text-navy-500 leading-7 mt-4">{featured.description}</p>
                <div className="flex items-center gap-4 mt-7 text-xs text-navy-400">
                  <span className="flex items-center gap-1.5"><CalendarDays size={14} />{dateLabel(featured.published_at)}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-navy-800">Read story <ArrowRight size={14} /></span>
                </div>
              </div>
            </Link>
          ) : null}

          <div className="flex items-end justify-between gap-4 mb-6">
            <div><span className="eyebrow">From the hotel</span><h2 className="font-display text-3xl text-navy-950 mt-2">Latest stories</h2></div>
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-navy-400"><BookOpen size={14} /> {posts.length} {posts.length === 1 ? 'story' : 'stories'}</span>
          </div>

          {rest.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {rest.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group glass-card overflow-hidden rounded-2xl">
                  <div className="aspect-[16/10] overflow-hidden"><img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" /></div>
                  <div className="p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 text-[11px] text-navy-400"><span className="tag">{post.category}</span><span>{dateLabel(post.published_at)}</span></div>
                    <h3 className="font-display text-xl text-navy-950 mt-4 leading-snug group-hover:text-navy-700">{post.title}</h3>
                    <p className="text-sm text-navy-500 leading-6 mt-3 line-clamp-3">{post.description}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy-900 mt-5">Read more <ArrowRight size={14} /></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="card p-12 text-center"><BookOpen className="mx-auto text-gold-500" /><h3 className="font-display text-2xl mt-4">Our journal is coming soon</h3><p className="text-sm text-navy-500 mt-2">Check back for hotel news, local stories and inspiration.</p></div>
          ) : null}
        </div>
      </section>
    </main>
  )
}
