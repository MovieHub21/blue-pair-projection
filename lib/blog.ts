import { createSupabasePublicClient } from './supabase/server'

export type BlogPost = {
  id: string
  title: string
  slug: string
  description: string
  content: string
  image_url: string
  category: string
  published: boolean
  published_at: string
  created_at: string
  updated_at: string
}

export async function getPublishedBlogPosts(limit?: number) {
  const supabase = createSupabasePublicClient()
  let query = supabase.from('blog_posts').select('*').eq('published', true).order('published_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) {
    console.error('[blog] failed to load posts', error.message)
    return [] as BlogPost[]
  }
  return (data ?? []) as BlogPost[]
}

export async function getPublishedBlogPost(slug: string) {
  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('published', true).maybeSingle()
  if (error) console.error('[blog] failed to load post', error.message)
  return (data as BlogPost | null) ?? null
}
