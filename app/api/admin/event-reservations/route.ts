import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { eventReservationStatusEmail } from '../../../../lib/email/templates'

const STAFF_ROLES = new Set(['super_admin','manager','reception'])
export async function GET() {
  try { const server=createSupabaseServerClient(); const {data:{user}}=await server.auth.getUser(); if(!user)return NextResponse.json({error:'Authentication required.'},{status:401}); const {data:roles}=await server.from('user_roles').select('role').eq('user_id',user.id); if(!(roles??[]).some((r:any)=>STAFF_ROLES.has(r.role)))return NextResponse.json({error:'Not allowed.'},{status:403}); const admin=createSupabaseAdminClient(); const {data,error}=await admin.from('event_reservations').select('*, events(title,date,price,image,capacity)').order('created_at',{ascending:false}); if(error)throw error; return NextResponse.json({reservations:data??[]}) } catch(error:any){return NextResponse.json({error:error?.message||'Unable to load reservations.'},{status:500})}
}
export async function PATCH(request:Request){
  try {
    const server=createSupabaseServerClient(); const {data:{user}}=await server.auth.getUser(); if(!user)return NextResponse.json({error:'Authentication required.'},{status:401}); const {data:roles}=await server.from('user_roles').select('role').eq('user_id',user.id); if(!(roles??[]).some((r:any)=>STAFF_ROLES.has(r.role)))return NextResponse.json({error:'Not allowed.'},{status:403})
    const {reservationId,status,staffNote}=await request.json(); if(!reservationId||!['reserved','declined','cancelled'].includes(status))return NextResponse.json({error:'Invalid reservation update.'},{status:400})
    const admin=createSupabaseAdminClient(); const {data:reservation}=await admin.from('event_reservations').select('*, events(title,date,price,image,capacity)').eq('id',reservationId).maybeSingle(); if(!reservation)return NextResponse.json({error:'Reservation not found.'},{status:404})
    if(status==='reserved' && reservation.status!=='reserved') { const {data:reservedRows}=await admin.from('event_reservations').select('guest_count').eq('event_id',reservation.event_id).eq('status','reserved').neq('id',reservation.id); const already=(reservedRows??[]).reduce((sum:any,row:any)=>sum+Number(row.guest_count||0),0); if(already+Number(reservation.guest_count)>Number(reservation.events?.capacity||0)) return NextResponse.json({error:`There is not enough remaining capacity for ${reservation.guest_count} guest(s).`},{status:409}) }
    const {error}=await admin.from('event_reservations').update({status,staff_note:String(staffNote||'').trim()||null,reserved_by:status==='reserved'?user.id:reservation.reserved_by}).eq('id',reservationId); if(error)throw error
    const content=eventReservationStatusEmail({guestName:reservation.guest_name,reservationId:reservation.id,eventTitle:reservation.events?.title||'Event',eventDate:reservation.events?.date||'',guestCount:reservation.guest_count,status,staffNote:String(staffNote||'').trim()}); await sendResendEmail({to:reservation.guest_email,...content}); return NextResponse.json({ok:true})
  } catch(error:any){console.error('[admin-event-reservation]',error);return NextResponse.json({error:error?.message||'Unable to update reservation.'},{status:500})}
}
