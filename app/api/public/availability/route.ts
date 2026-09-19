import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
export const dynamic='force-dynamic'
function validDate(v:string|null){return !!v&&/^\d{4}-\d{2}-\d{2}$/.test(v)}
function effectiveCheckOut(b:any){const actual=b.checked_out_at?String(b.checked_out_at).slice(0,10):'';return actual&&actual<b.check_out?actual:b.check_out}
function overlaps(a:string,b:string,c:string,d:string){return a<d&&b>c}
function bookingOverlaps(b:any,a:string,d:string){return overlaps(a,d,b.check_in,effectiveCheckOut(b))}
function activePending(b:any){return b.status==='pending'&&b.payment_status!=='paid'&&!!b.reservation_expires_at&&new Date(b.reservation_expires_at).getTime()>Date.now()}
function paid(b:any){return b.payment_status==='paid'&&!['cancelled','refunded'].includes(String(b.status))}
export async function GET(request:Request){try{
 const p=new URL(request.url).searchParams;const checkIn=p.get('checkin');const checkOut=p.get('checkout');const roomTypeId=p.get('roomTypeId')
 if(!validDate(checkIn)||!validDate(checkOut)||!checkIn||!checkOut||checkIn>=checkOut)return NextResponse.json({error:'Valid check-in and check-out dates are required.'},{status:400})
 const db=createSupabaseAdminClient()
 let rq=db.from('rooms').select('id,room_number,room_type_id,name,slug,status,image_url,images,floor,payment_lock_booking_id,payment_lock_expires_at').order('room_number');if(roomTypeId)rq=rq.eq('room_type_id',roomTypeId)
 const [{data:rooms,error:re},{data:bookings,error:be},{data:dailyStatuses,error:de}]=await Promise.all([
  rq,
  db.from('bookings').select('id,customer_id,room_id,room_type_id,check_in,check_out,checked_out_at,status,payment_status,reservation_expires_at').lt('check_in',checkOut).gt('check_out',checkIn),
  db.from('room_daily_statuses').select('room_id,status,status_date,notes')
 ])
 if(re)throw re;if(be)throw be;if(de)throw de
 let currentCustomerId:string|null=null
 try{const authDb=createSupabaseServerClient();const{data:{user}}=await authDb.auth.getUser();if(user){const{data:customer}=await db.from('customers').select('id').eq('user_id',user.id).maybeSingle();currentCustomerId=customer?.id??null}}catch{}
 const bookingRows:any[]=bookings??[];const dailyRows:any[]=dailyStatuses??[]
 const own=currentCustomerId?bookingRows.filter(b=>b.customer_id===currentCustomerId&&activePending(b)&&bookingOverlaps(b,checkIn,checkOut)&&b.room_id):[]
 const result=(rooms??[]).map(room=>{
  const rb=bookingRows.filter(b=>b.room_id===room.id);const paidRows=rb.filter(paid).filter(b=>bookingOverlaps(b,checkIn,checkOut));const pending=rb.filter(b=>activePending(b)&&bookingOverlaps(b,checkIn,checkOut));const ownReservation=own.find(b=>b.room_id===room.id);const daily=dailyRows.find(d=>d.room_id===room.id)
  let guestStatus='available';let availableFrom=checkIn;let reason:string|null=null
  if(paidRows.length){const latest=paidRows.reduce((a,b)=>effectiveCheckOut(a)>effectiveCheckOut(b)?a:b);guestStatus='taken';availableFrom=effectiveCheckOut(latest);reason='paid_reservation'}
  else if(pending.length){guestStatus='held';availableFrom=null;reason='payment_hold'}
  else if(room.status==='maintenance'){guestStatus='availableSoon';availableFrom=null;reason='maintenance'}
  else if(room.status==='available_soon'){guestStatus='availableSoon';availableFrom=null;reason='admin_available_soon'}
  else if(daily&&daily.status!=='available'){guestStatus='availableSoon';availableFrom=null;reason=`current_${daily.status}`}
  const adminStatus=paidRows.length?'taken':pending.length?'held':room.status==='maintenance'?'maintenance':room.status==='available_soon'?'available_soon':(daily?.status??'available')
  return {...room,payment_lock_booking_id:undefined,payment_lock_expires_at:room.payment_lock_expires_at,guest_status:ownReservation?'reserved':guestStatus,admin_status:adminStatus,availability_reason:reason,available_from:availableFrom,payment_ready:!!ownReservation,payment_locked:Boolean(room.payment_lock_expires_at&&new Date(room.payment_lock_expires_at).getTime()>Date.now()),payment_locked_by_me:!!ownReservation,pending:pending.length>0,pending_count:pending.length,reservation_id:ownReservation?.id,reservation_expires_at:ownReservation?.reservation_expires_at}
 })
 const byType:Record<string,any>={}
 for(const room of result){const row=byType[room.room_type_id]??{available:0,availableSoon:0,taken:0,reserved:0,pending:0,held:0,earliestAvailable:null};if(room.guest_status==='available')row.available++;else if(room.guest_status==='availableSoon')row.availableSoon++;else if(room.guest_status==='reserved')row.reserved++;else if(room.guest_status==='held'){row.held++;row.pending++}else row.taken++;if(room.available_from&&(!row.earliestAvailable||room.available_from<row.earliestAvailable))row.earliestAvailable=room.available_from;byType[room.room_type_id]=row}
 return NextResponse.json({checkIn,checkOut,checkInTime:'15:00',checkOutTime:'12:00',rooms:result,byType})
}catch(error:any){console.error('[public-availability][error]',{message:error?.message,code:error?.code,details:error?.details,stack:error?.stack});return NextResponse.json({error:error?.message||'Unable to check availability.'},{status:500})}}
