import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
export const dynamic = 'force-dynamic'
function validDate(value: string | null) { return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) }
function effectiveCheckOut(b: any) { const actual = b.checked_out_at ? String(b.checked_out_at).slice(0,10) : ''; return actual && actual < b.check_out ? actual : b.check_out }
function overlaps(start: string, end: string, bookingStart: string, bookingEnd: string) { return start < bookingEnd && end > bookingStart }
function activePending(b: any) { return b.status === 'pending' && b.payment_status !== 'paid' && !!b.reservation_expires_at && new Date(b.reservation_expires_at).getTime() > Date.now() }
function paidReservation(b: any) { return b.payment_status === 'paid' && !['cancelled','refunded'].includes(String(b.status)) }
function bookingOverlaps(b: any, checkIn: string, checkOut: string) { return overlaps(checkIn, checkOut, b.check_in, effectiveCheckOut(b)) }
function guestStatus(room: any, bookings: any[], checkIn: string, checkOut: string) {
  const paid = bookings.filter(paidReservation)
  const overlappingPaid = paid.filter(b => bookingOverlaps(b, checkIn, checkOut))
  if (overlappingPaid.length) {
    const latest = overlappingPaid.reduce((a,b) => effectiveCheckOut(a) > effectiveCheckOut(b) ? a : b)
    return { status: 'taken', availableFrom: effectiveCheckOut(latest) }
  }
  const pending = bookings.filter(b => activePending(b) && bookingOverlaps(b, checkIn, checkOut))
  if (pending.length) return { status: 'held', availableFrom: null }
  if (room.status === 'available_soon') return { status: 'availableSoon', availableFrom: null }
  // Cleaning is intentionally not a guest-facing inventory block. Housekeeping uses the checkout gap.
  if (room.status === 'maintenance') return { status: 'availableSoon', availableFrom: null }
  if (room.status === 'available' || room.status === 'cleaning' || room.status === 'cleaning_required') return { status: 'available', availableFrom: checkIn }
  return { status: 'availableSoon', availableFrom: null }
}
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams
    const checkIn = params.get('checkin'); const checkOut = params.get('checkout'); const roomTypeId = params.get('roomTypeId')
    if (!validDate(checkIn) || !validDate(checkOut) || !checkIn || !checkOut || checkIn >= checkOut) return NextResponse.json({ error: 'Valid check-in and check-out dates are required.' }, { status: 400 })
    const db = createSupabaseAdminClient()
    let roomsQuery = db.from('rooms').select('id,room_number,room_type_id,name,slug,status,image_url,images,floor,payment_lock_booking_id,payment_lock_expires_at').order('room_number')
    if (roomTypeId) roomsQuery = roomsQuery.eq('room_type_id', roomTypeId)
    const [{ data: rooms, error: roomsError }, { data: bookings, error: bookingsError }] = await Promise.all([
      roomsQuery,
      db.from('bookings').select('id,customer_id,room_id,room_type_id,check_in,check_out,checked_out_at,status,payment_status,reservation_expires_at').lt('check_in', checkOut).gt('check_out', checkIn),
    ])
    if (roomsError) throw roomsError; if (bookingsError) throw bookingsError
    const bookingRows = (bookings ?? []) as any[]
    let currentCustomerId: string | null = null
    try {
      const authDb = createSupabaseServerClient(); const { data:{user} } = await authDb.auth.getUser()
      if (user) { const { data: customer } = await db.from('customers').select('id').eq('user_id',user.id).maybeSingle(); currentCustomerId = customer?.id ?? null }
    } catch {}
    const ownReservations = currentCustomerId ? bookingRows.filter(b => b.customer_id === currentCustomerId && activePending(b) && bookingOverlaps(b,checkIn,checkOut) && b.room_id) : []
    const result = (rooms ?? []).map(room => {
      const roomBookings = bookingRows.filter(b => b.room_id === room.id); const state = guestStatus(room,roomBookings,checkIn,checkOut)
      const pendingHolds = roomBookings.filter(b => activePending(b) && bookingOverlaps(b,checkIn,checkOut)); const ownReservation = ownReservations.find(b=>b.room_id===room.id)
      const paymentLockActive = Boolean(room.payment_lock_expires_at && new Date(room.payment_lock_expires_at).getTime()>Date.now()); const paymentLockedByMe = paymentLockActive && ownReservation?.id===room.payment_lock_booking_id
      const lockExpiresAt = paymentLockActive ? room.payment_lock_expires_at : null
      if (ownReservation) return {...room,payment_lock_booking_id:undefined,payment_lock_expires_at:lockExpiresAt,guest_status:'reserved',available_from:state.availableFrom,reservation_id:ownReservation.id,reservation_expires_at:ownReservation.reservation_expires_at,payment_ready:true,payment_locked:paymentLockActive,payment_locked_by_me:paymentLockedByMe,pending:true,pending_count:pendingHolds.length}
      return {...room,payment_lock_booking_id:undefined,payment_lock_expires_at:lockExpiresAt,guest_status:state.status,available_from:state.availableFrom,payment_ready:false,payment_locked:paymentLockActive,payment_locked_by_me:false,pending:pendingHolds.length>0,pending_count:pendingHolds.length}
    })
    const byType: Record<string,{available:number;availableSoon:number;taken:number;reserved:number;pending:number;held:number;earliestAvailable:string|null}> = {}
    for (const room of result) { const row=byType[room.room_type_id]??{available:0,availableSoon:0,taken:0,reserved:0,pending:0,held:0,earliestAvailable:null}; if(room.guest_status==='available')row.available++;else if(room.guest_status==='availableSoon')row.availableSoon++;else if(room.guest_status==='reserved')row.reserved++;else if(room.guest_status==='held'){row.held++;row.pending++}else row.taken++;if(room.available_from&&(!row.earliestAvailable||room.available_from<row.earliestAvailable))row.earliestAvailable=room.available_from;byType[room.room_type_id]=row }
    return NextResponse.json({checkIn,checkOut,checkInTime:'15:00',checkOutTime:'12:00',rooms:result,byType})
  } catch (error:any) { console.error('[public-availability]',error); return NextResponse.json({error:error?.message||'Unable to check availability.'},{status:500}) }
}
