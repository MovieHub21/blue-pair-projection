import { createSupabasePublicClient } from './supabase/server'
import { createSupabaseAdminClient } from './supabase/admin'

export type EventReservation = { id:string; event_id:string; user_id:string|null; guest_name:string; guest_email:string; guest_phone:string; guest_count:number; notes:string|null; status:'pending'|'reserved'|'declined'|'cancelled'; staff_note:string|null; created_at:string; updated_at:string; reserved_at:string|null; reserved_by:string|null; event?:{title:string;date:string;price:number;image:string;capacity:number}|null }
export async function getMyEventReservations() {
  const db=createSupabasePublicClient(); const {data:{user}}=await db.auth.getUser(); if(!user)return [] as EventReservation[]
  const {data:profile}=await db.from('profiles').select('email').eq('id',user.id).maybeSingle(); const email=profile?.email||user.email
  const admin=createSupabaseAdminClient(); let query=admin.from('event_reservations').select('*, events(title,date,price,image,capacity)').order('created_at',{ascending:false})
  if(email) query=query.or(`user_id.eq.${user.id},guest_email.eq.${email}`); else query=query.eq('user_id',user.id)
  const {data}=await query
  return ((data??[]) as any[]).map(row=>({...row,event:row.events?{title:row.events.title,date:row.events.date,price:row.events.price,image:row.events.image,capacity:row.events.capacity}:null})) as EventReservation[]
}
