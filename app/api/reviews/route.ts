import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../lib/supabase/admin'
import { extractReviewKeywords } from '../../../lib/reviews'

export async function POST(request: Request) {
  try {
    const db = createSupabaseServerClient()
    const { data: { user } } = await db.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in to leave a review.' }, { status: 401 })

    const body = await request.json()
    const rating = Number(body.rating)
    const title = String(body.title || '').trim().slice(0, 120)
    const review = String(body.review || '').trim().slice(0, 2000)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: 'Choose a rating from 1 to 5.' }, { status: 400 })
    if (review.length < 10) return NextResponse.json({ error: 'Please write at least 10 characters about your stay.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data: customer } = await admin.from('customers').select('id').eq('user_id', user.id).maybeSingle()
    if (!customer) return NextResponse.json({ error: 'We could not find your guest profile.' }, { status: 400 })

    const { data: eligibleBookings } = await admin.from('bookings').select('id,checked_in_at,check_in,check_out').eq('customer_id', customer.id).not('checked_in_at', 'is', null).order('checked_in_at', { ascending: false })
    const eligible = eligibleBookings?.[0]
    if (!eligible) return NextResponse.json({ error: 'Reviews are available after you have checked in at Blue Pair Hotel.' }, { status: 403 })

    const { data: existing } = await admin.from('guest_reviews').select('id').eq('booking_id', eligible.id).maybeSingle()
    if (existing) return NextResponse.json({ error: 'You have already reviewed this stay.' }, { status: 409 })

    const keywords = extractReviewKeywords(`${title} ${review}`)
    const { data: created, error } = await admin.from('guest_reviews').insert({ user_id: user.id, booking_id: eligible.id, rating, title: title || null, review, keywords, published: true, published_at: new Date().toISOString() }).select('id,rating,title,review,keywords,created_at').single()
    if (error) throw error

    return NextResponse.json({ ok: true, review: created })
  } catch (error: any) {
    console.error('[guest-review]', error)
    return NextResponse.json({ error: error?.message || 'Unable to submit your review.' }, { status: 500 })
  }
}
