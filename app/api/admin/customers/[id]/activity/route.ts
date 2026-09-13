import { NextResponse } from 'next/server'
import { getMyPermissions } from '@/lib/permissions'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

function toTime(value: unknown) {
  const time = value ? new Date(String(value)).getTime() : 0
  return Number.isFinite(time) ? time : 0
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const permissions = await getMyPermissions()
  if (!permissions.allowed('customers')) {
    return NextResponse.json({ error: 'Customer access is not permitted.' }, { status: 403 })
  }

  const customerId = String(params.id || '').trim()
  if (!customerId) return NextResponse.json({ error: 'Customer id is required.' }, { status: 400 })

  const db = createSupabaseAdminClient()

  const [customerResult, bookingsResult, paymentsResult, requestsResult, roomServiceResult, financeResult, activityResult] = await Promise.all([
    db.from('customers').select('*').eq('id', customerId).maybeSingle(),
    db.from('bookings').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    db.from('payments').select('*').eq('customer_id', customerId).order('date', { ascending: false }),
    db.from('guest_requests').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    db.from('room_service_orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
    db.from('financial_transactions').select('*').eq('customer_id', customerId).order('occurred_at', { ascending: false }),
    db.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(1000),
  ])

  if (customerResult.error) return NextResponse.json({ error: customerResult.error.message }, { status: 500 })
  if (!customerResult.data) return NextResponse.json({ error: 'Customer not found.' }, { status: 404 })

  const bookingRefs = new Set((bookingsResult.data ?? []).map((booking: any) => String(booking.reference)))
  const relevantActivity = (activityResult.data ?? []).filter((entry: any) => {
    const row = entry?.metadata?.row ?? {}
    const entityId = String(entry.entity_id ?? '')
    const entityType = String(entry.entity_type ?? '')
    return (
      (entityType === 'customers' && entityId === customerId) ||
      String(row.customer_id ?? '') === customerId ||
      (entityType === 'bookings' && bookingRefs.has(entityId)) ||
      (entityType === 'payments' && String(row.customer_id ?? '') === customerId) ||
      (entityType === 'guest_requests' && String(row.customer_id ?? '') === customerId) ||
      (entityType === 'room_service_orders' && String(row.customer_id ?? '') === customerId) ||
      (entityType === 'financial_transactions' && String(row.customer_id ?? '') === customerId)
    )
  })

  const activity = [
    ...(bookingsResult.data ?? []).map((row: any) => ({ id: `booking-${row.id}`, type: 'booking', title: row.status === 'cancelled' ? 'Booking cancelled' : 'Booking activity', description: `${row.reference} · ₦${Number(row.amount || 0).toLocaleString('en-NG')} · ${String(row.status || '').replace(/_/g, ' ')}`, reference: row.reference, status: row.status, amount: Number(row.amount || 0), occurredAt: row.created_at, source: 'Booking' })),
    ...(paymentsResult.data ?? []).map((row: any) => ({ id: `payment-${row.id}`, type: row.status === 'refunded' ? 'refund' : 'payment', title: row.status === 'refunded' ? 'Payment refunded' : 'Payment recorded', description: `${row.reference} · ${row.method || 'Payment'} · ${String(row.status || '').replace(/_/g, ' ')}`, reference: row.reference, bookingRef: row.booking_ref, status: row.status, amount: Number(row.amount || 0), method: row.method, occurredAt: row.date, source: 'Payment' })),
    ...(requestsResult.data ?? []).map((row: any) => ({ id: `request-${row.id}`, type: 'request', title: 'Guest request', description: row.message || String(row.type || 'Guest request').replace(/_/g, ' '), reference: row.booking_ref || undefined, status: row.status, occurredAt: row.created_at, source: 'Guest request' })),
    ...(roomServiceResult.data ?? []).map((row: any) => ({ id: `room-service-${row.id}`, type: 'room_service', title: 'Room-service order', description: `${row.reference} · Room ${row.room} · ${String(row.status || '').replace(/_/g, ' ')}`, reference: row.reference, status: row.status, amount: Number(row.total || 0), paymentStatus: row.payment_status, occurredAt: row.created_at, source: 'Room service' })),
    ...(financeResult.data ?? []).map((row: any) => ({ id: `finance-${row.id}`, type: row.transaction_type, title: row.transaction_type === 'refund' ? 'Refund ledger entry' : row.transaction_type === 'sale' ? 'Income ledger entry' : 'Financial activity', description: row.description || row.reference || 'Financial transaction', reference: row.reference, status: row.status, amount: Number(row.amount || 0), method: row.method, occurredAt: row.occurred_at, source: 'Finance' })),
  ].sort((a, b) => toTime(b.occurredAt) - toTime(a.occurredAt))

  return NextResponse.json({ customer: customerResult.data, bookings: bookingsResult.data ?? [], payments: paymentsResult.data ?? [], requests: requestsResult.data ?? [], roomServiceOrders: roomServiceResult.data ?? [], financialTransactions: financeResult.data ?? [], audit: relevantActivity, activity })
}
