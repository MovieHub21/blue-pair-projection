import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../lib/supabase/admin'
import { readSanitizedJson } from '../../../lib/security/input'
import { getGoogleReviewUrl } from '../../../lib/googleReviews'

async function getUser() {
  const db = createSupabaseServerClient()
  const { data: { user } } = await db.auth.getUser()
  return user
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ review: null })
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin.from('guest_reviews')
      .select('id,rating,title,review,keywords,created_at,updated_at,published,booking_id')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (error) throw error
    return NextResponse.json({ review: data ?? null })
  } catch (error) {
    console.error('[guest-review:get]', error)
    return NextResponse.json({ error: 'Unable to load your review.' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Guest reviews are now submitted directly on Google.', reviewUrl: getGoogleReviewUrl() }, { status: 410 })
}

export async function PUT() {
  return NextResponse.json({ error: 'Guest reviews are now submitted directly on Google.', reviewUrl: getGoogleReviewUrl() }, { status: 410 })
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to delete your review.' }, { status: 401 })
    const body = await readSanitizedJson<{ id?: string }>(request).catch((): { id?: string } => ({}))
    const reviewId = String(body.id || '')
    if (!reviewId) return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 })
    const admin = createSupabaseAdminClient()
    const { data: existing, error: findError } = await admin.from('guest_reviews').select('id')
      .eq('id', reviewId).eq('user_id', user.id).maybeSingle()
    if (findError) throw findError
    if (!existing) return NextResponse.json({ error: 'Review not found or you do not have permission to delete it.' }, { status: 404 })
    const { error } = await admin.from('guest_reviews').delete().eq('id', reviewId).eq('user_id', user.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[guest-review:delete]', error)
    return NextResponse.json({ error: 'Unable to delete your review.' }, { status: 500 })
  }
}
