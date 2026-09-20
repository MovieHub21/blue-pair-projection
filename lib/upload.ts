'use client'
import { supabase } from './supabase/client'

const BUCKET = 'site-images'
// Long-lived signed link (10 years) so uploaded images render on the public site.
const LINK_TTL = 60 * 60 * 24 * 365 * 10

// Uploaded photos are resized and re-encoded as WebP in the browser before they are stored, so
// visitors download a few hundred KB instead of the multi-megabyte original from a phone/camera.
const MAX_DIMENSION = 1920
const WEBP_QUALITY = 0.82
const SKIP_BELOW_BYTES = 150 * 1024

/**
 * Returns a smaller copy of the image (longest side <= MAX_DIMENSION, WebP). Falls back to the
 * original file whenever optimising is not possible or would not make the file smaller
 * (GIF/SVG, tiny files, browsers that cannot encode WebP, decode errors).
 */
export async function optimizeImage(file: File): Promise<File> {
  try {
    if (typeof window === 'undefined' || typeof createImageBitmap !== 'function') return file
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file

    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size <= SKIP_BELOW_BYTES) {
      bitmap.close?.()
      return file
    }

    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) {
      bitmap.close?.()
      return file
    }
    context.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', WEBP_QUALITY))
    // Browsers that cannot encode WebP silently return PNG; keep the original in that case.
    if (!blob || blob.type !== 'image/webp' || blob.size >= file.size) return file

    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${baseName}.webp`, { type: 'image/webp' })
  } catch {
    return file
  }
}

/** Uploads an image picked from the user's device and returns a public-usable URL. */
export async function uploadImage(original: File, folder = 'misc'): Promise<string> {
  const file = await optimizeImage(original)
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
