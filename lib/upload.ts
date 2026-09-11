'use client'
import { supabase } from './supabase/client'

const BUCKET = 'site-images'
// Long-lived signed link (10 years) so uploaded images render on the public site.
const LINK_TTL = 60 * 60 * 24 * 365 * 10

/** Uploads an image picked from the user's device and returns a public-usable URL. */
export async function uploadImage(file: File, folder = 'misc'): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  })
  if (error) throw new Error(error.message)

  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, LINK_TTL)
  if (signErr || !data?.signedUrl) throw new Error(signErr?.message ?? 'Could not create image link')
  return data.signedUrl
}
