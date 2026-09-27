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
// site-images is currently restricted to 10 MB per object in Supabase Storage.
const MAX_STORED_BYTES = 9.5 * 1024 * 1024

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
  if (!original.type.startsWith('image/')) {
    throw new Error('Please select an image file.')
  }

  const file = await optimizeImage(original)

  if (file.size > MAX_STORED_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error('This image is still ' + sizeMb + ' MB after optimization. Please choose a smaller image (maximum 9.5 MB).')
  }

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
    contentType: file.type || undefined,
  })

  if (error) {
    const code = (error as any).error || (error as any).statusCode
    if (code === 'EntityTooLarge' || (error as any).statusCode === 413) {
      throw new Error('This image is too large for the image storage limit. Please choose a smaller image.')
    }
    if ((error as any).statusCode === 401 || (error as any).statusCode === 403) {
      throw new Error('Image upload is not permitted for this staff account. Please check the staff role assigned to this account.')
    }
    throw new Error(error.message)
  }

  const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, LINK_TTL)
  if (signErr || !data?.signedUrl) {
    try { await supabase.storage.from(BUCKET).remove([path]) } catch {}
    throw new Error(signErr?.message ?? 'Image uploaded, but its display link could not be created.')
  }

  return data.signedUrl
}


/** Deletes an image previously uploaded to the site-images bucket. Safe for signed or public Supabase Storage URLs. */
export async function deleteImage(url: string | null | undefined): Promise<void> {
  if (!url) return
  const parsed = new URL(url)
  const marker = '/storage/v1/object/'
  const markerIndex = parsed.pathname.indexOf(marker)
  if (markerIndex === -1) return
  const remainder = parsed.pathname.slice(markerIndex + marker.length)
  const parts = remainder.split('/')
  const mode = parts.shift()
  const bucket = parts.shift()
  if (!bucket || bucket !== BUCKET || !mode || !['sign', 'public'].includes(mode)) return
  const path = parts.join('/')
  if (!path) return
  const { error } = await supabase.storage.from(BUCKET).remove([decodeURIComponent(path)])
  if (error) throw error
}
