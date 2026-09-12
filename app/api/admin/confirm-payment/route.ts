import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'

const STAFF_ROLES = new Set(['super_admin', 'manager', 'reception'])
const PAYMENT_METHODS = new Set(['Cash', 'POS'])

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient()
    const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

    const { data: roleRows } = await server.from('user_roles').select('role').eq('user_id', user.id)
    if (!(roleRows ?? []).some((row: any) => STAFF_ROLES.has(row.role))) {
      return NextResponse.json({ error: 'You are not allowed to confirm guest payments.' }, { status: 403 })
    }

    const body = await request.json()
    const bookingId = String(body.bookingId ?? '').trim()
    const method = String(body.method ?? '').trim()
    if (!bookingId || !PAYMENT_METHODS.has(method)) {
      return NextResponse.json({ error: 'Choose Cash or POS before confirming payment.' }, { status: 400 })
    }

    const admin = createSupabaseAdminClient()
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('id,reference,customer_id,amount,payment_status,status')
      .eq('id', bookingId)
      .maybeSingle()
    if (bookingError) throw bookingError
    if (!booking) return NextResponse.json({ error: 'Booking not found.' }, { status: 404 })
    if (booking.payment_status === 'paid') return NextResponse.json({ error: 'This booking is already paid.' }, { status: 409 })
    if (booking.status === 'cancelled') return NextResponse.json({ error: 'A cancelled booking cannot be paid.' }, { status: 400 })

    const { data: customer, error: customerError } = await admin
      .from('customers')
      .select('id,name,email,phone')
      .eq('id', booking.customer_id)
      .single()
    if (customerError) throw customerError

    const paidOn = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const paymentReference = `INV-${booking.reference.replace(/^BPH-/, '')}`

    const { data: existingPayment } = await admin
      .from('payments')
      .select('id')
      .eq('booking_ref', booking.reference)
      .maybeSingle()

    if (existingPayment) {
      const { error } = await admin.from('payments').update({
        customer_id: customer.id,
        amount: booking.amount,
        method,
        status: 'success',
        date: paidOn,
      }).eq('id', existingPayment.id)
      if (error) throw error
    } else {
      const { error } = await admin.from('payments').insert({
        id: `pay_${Date.now()}`,
        reference: paymentReference,
        booking_ref: booking.reference,
        customer_id: customer.id,
        customer: customer.name,
        amount: booking.amount,
        method,
        status: 'success',
        date: paidOn,
      })
      if (error) throw error
    }

    const { error: updateError } = await admin
      .from('bookings')
      .update({ payment_status: 'paid', status: 'confirmed' })
      .eq('id', booking.id)
    if (updateError) throw updateError

    return NextResponse.json({
      bookingId: booking.id,
      reference: booking.reference,
      customer,
      paymentReference,
      method,
      amount: booking.amount,
    })
  } catch (error: any) {
    console.error('[confirm-payment]', error)
    return NextResponse.json({ error: error?.message || 'Unable to confirm payment.' }, { status: 500 })
  }
}
