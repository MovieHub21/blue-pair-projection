import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../lib/supabase/admin'
import { sendResendEmail } from '../../../lib/email/resend'
import { eventReservationGuestEmail, eventReservationReceptionEmail } from '../../../lib/email/templates'

export async function POST(request: Request) {
  try {
    const body=await request.json(); const eventId=String(body.eventId||'').trim(); const guestName=String(body.guestName||'').trim(); const guestEmail=String(body.guestEmail||'').trim().toLowerCase(); const guestPhone=String(body.guestPhone||'').trim(); const guestCount=Math.max(1,Number(body.guestCount||1)); const notes=String(body.notes||'').trim()
    if(!eventId||!guestName||!guestEmail||!guestPhone)return NextResponse.json({error:'Please provide your name, email and phone number.'},{status:400}); if(!/^\S+@\S+\.\S+$/.test(guestEmail))return NextResponse.json({error:'Enter a valid email address.'},{status:400}); if(!Number.isInteger(guestCount)||guestCount<1||guestCount>50)return NextResponse.json({error:'Guest count must be between 1 and 50.'},{status:400})
    const server=createSupabaseServerClient(); const {data:{user}}=await server.auth.getUser(); const admin=createSupabaseAdminClient(); const {data:event}=await admin.from('events').select('id,title,date,price,capacity,published').eq('id',eventId).maybeSingle(); if(!event||!event.published)return NextResponse.json({error:'This event is no longer available for reservations.'},{status:404})
    const {data:reservation,error}=await admin.from('event_reservations').insert({event_id:eventId,user_id:user?.id??null,guest_name:guestName,guest_email:guestEmail,guest_phone:guestPhone,guest_count:guestCount,notes:notes||null,status:'pending'}).select('id').single(); if(error)throw error
    const {data:receptionStaff}=await admin.from('staff').select('email').eq('role','Reception').eq('status','active').not('email','is',null); let receptionEmails=[...new Set((receptionStaff??[]).map((s:any)=>s.email).filter(Boolean))]
    if(receptionEmails.length===0){const {data:siteEmail}=await admin.from('site_content').select('value').eq('key','hotel_email').maybeSingle(); if(siteEmail?.value)receptionEmails=[siteEmail.value]}
    await sendResendEmail({to:guestEmail,...eventReservationGuestEmail({guestName,reservationId:reservation.id,eventTitle:event.title,eventDate:event.date,guestCount,status:'pending'})})
    const receptionContent=eventReservationReceptionEmail({guestName,guestEmail,guestPhone,reservationId:reservation.id,eventTitle:event.title,eventDate:event.date,guestCount,notes}); for(const to of receptionEmails)await sendResendEmail({to,...receptionContent})
    return NextResponse.json({ok:true,reservationId:reservation.id,message:'Your reservation request has been sent to our reception team. We will email you when your spot is reserved.'})
  }catch(error:any){console.error('[event-reservation]',error);return NextResponse.json({error:error?.message||'Unable to submit reservation.'},{status:500})}
}
