import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays } from 'lucide-react'
import { notFound } from 'next/navigation'
import { getPublishedBlogPost, getPublishedBlogPosts } from '../../../../lib/blog'
import { SITE_URL } from '../../../../lib/siteConfig'

type Props = { params: { slug: string } }

export async function generateStaticParams() {
  const posts = await getPublishedBlogPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedBlogPost(params.slug)
  if (!post) return { title: 'Story not found | Blue Pair Hotel' }
  return {
    title: `${post.title} | Blue Pair Hotel`,
    description: post.description,
    alternates: { canonical: `${SITE_URL}/blog/${post.slug}` },
    openGraph: { title: post.title, description: post.description, url: `${SITE_URL}/blog/${post.slug}`, images: [{ url: post.image_url, alt: post.title }] },
  }
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

export default async function BlogStoryPage({ params }: Props) {
  const post = await getPublishedBlogPost(params.slug)
  if (!post) notFound()
  const paragraphs = post.content.split(/\n\s*\n/)

  return (
    <main className="bg-cream-50 min-h-screen">
      <article>
        <div className="relative h-[48vh] min-h-[360px] max-h-[620px] overflow-hidden bg-navy-950">
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/35 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-10 pb-10 md:pb-14">
            <div className="container-w">
              <span className="tag bg-white/15 border-white/20 text-white backdrop-blur">{post.category}</span>
              <h1 className="font-display text-4xl md:text-6xl text-white max-w-4xl mt-5 leading-tight">{post.title}</h1>
              <div className="flex items-center gap-2 text-white/65 text-xs mt-5"><CalendarDays size={14} />{dateLabel(post.published_at)}</div>
            </div>
          </div>
        </div>

        <div className="container-w px-6 md:px-10 py-12 md:py-16 grid lg:grid-cols-[minmax(0,760px)_260px] gap-12">
          <div>
            <p className="text-xl md:text-2xl text-navy-700 leading-9 font-display mb-8">{post.description}</p>
            <div className="space-y-6 text-[15px] md:text-base text-navy-600 leading-8">
              {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
            <div className="mt-12 pt-7 border-t border-black/10 flex items-center justify-between gap-4">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800"><ArrowLeft size={15} />All stories</Link>
              <Link href="/booking" className="btn-gold btn-sm">Plan your stay <ArrowRight size={14} /></Link>
            </div>
          </div>
          <aside className="hidden lg:block"><div className="glass-card rounded-2xl p-6 sticky top-28"><span className="eyebrow">Blue Pair Hotel</span><h2 className="font-display text-2xl mt-2 text-navy-950">Make your next visit memorable.</h2><p className="text-sm text-navy-500 leading-6 mt-3">Rooms, dining, leisure and events — all in one welcoming destination in Uromi.</p><Link href="/booking" className="btn-primary btn-sm w-full mt-5">Book a room</Link></div></aside>
        </div>
      </article>
    </main>
  )
}
