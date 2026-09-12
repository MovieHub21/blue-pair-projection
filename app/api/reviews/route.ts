import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../lib/supabase/admin'
import { extractReviewKeywords } from '../../../lib/reviews'

async function getUser() {
  const db = createSupabaseServerClient()
  const { data: { user } } = await db.auth.getUser()
  return user
}

async function validateReviewInput(body: any) {
  const rating = Number(body.rating)
  const title = String(body.title || '').trim().slice(0, 120)
  const review = String(body.review || '').trim().slice(0, 2000)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('Choose a rating from 1 to 5.')
  if (review.length < 10) throw new Error('Please write at least 10 characters about your stay.')
  return { rating, title, review, keywords: extractReviewKeywords(`${title} ${review}`) }
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
  } catch (error: any) {
    console.error('[guest-review:get]', error)
    return NextResponse.json({ error: error?.message || 'Unable to load your review.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to leave a review.' }, { status: 401 })
    const input = await validateReviewInput(await request.json())
    const admin = createSupabaseAdminClient()
    const { data: customer } = await admin.from('customers').select('id').eq('user_id', user.id).maybeSingle()
    if (!customer) return NextResponse.json({ error: 'We could not find your guest profile.' }, { status: 400 })

    const { data: eligibleBookings, error: bookingError } = await admin.from('bookings')
      .select('id,checked_in_at,check_in,check_out,status').eq('customer_id', customer.id)
      .or('checked_in_at.not.is.null,status.in.(checked_in,checked_out)')
      .order('checked_in_at', { ascending: false, nullsFirst: false }).order('check_in', { ascending: false })
    if (bookingError) throw bookingError
    const eligible = eligibleBookings?.[0]
    if (!eligible) return NextResponse.json({ error: 'Reviews are available after you have checked in at Blue Pair Hotel.' }, { status: 403 })

    const { data: existing } = await admin.from('guest_reviews').select('id').eq('booking_id', eligible.id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'You have already reviewed this stay. You can edit or delete your existing review below.' }, { status: 409 })

    const { data: created, error } = await admin.from('guest_reviews').insert({
      user_id: user.id, booking_id: eligible.id, rating: input.rating, title: input.title || null,
      review: input.review, keywords: input.keywords, published: true, published_at: new Date().toISOString(),
    }).select('id,rating,title,review,keywords,created_at,updated_at,published,booking_id').single()
    if (error) throw error
    return NextResponse.json({ ok: true, review: created })
  } catch (error: any) {
    console.error('[guest-review:post]', error)
    return NextResponse.json({ error: error?.message || 'Unable to submit your review.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to edit your review.' }, { status: 401 })
    const body = await request.json()
    const reviewId = String(body.id || '')
    if (!reviewId) return NextResponse.json({ error: 'Review ID is required.' }, { status: 400 })
    const input = await validateReviewInput(body)
    const admin = createSupabaseAdminClient()
    const { data: existing, error: findError } = await admin.from('guest_reviews').select('id')
      .eq('id', reviewId).eq('user_id', user.id).maybeSingle()
    if (findError) throw findError
    if (!existing) return NextResponse.json({ error: 'Review not found or you do not have permission to edit it.' }, { status: 404 })

    const { data: updated, error } = await admin.from('guest_reviews').update({
      rating: input.rating, title: input.title || null, review: input.review, keywords: input.keywords,
      updated_at: new Date().toISOString(), published: true, published_at: new Date().toISOString(),
    }).eq('id', reviewId).eq('user_id', user.id)
      .select('id,rating,title,review,keywords,created_at,updated_at,published,booking_id').single()
    if (error) throw error
    return NextResponse.json({ ok: true, review: updated })
  } catch (error: any) {
    console.error('[guest-review:put]', error)
    return NextResponse.json({ error: error?.message || 'Unable to update your review.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to delete your review.' }, { status: 401 })
    const body = await request.json().catch(() => ({}))
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
  } catch (error: any) {
    console.error('[guest-review:delete]', error)
    return NextResponse.json({ error: error?.message || 'Unable to delete your review.' }, { status: 500 })
  }
}
