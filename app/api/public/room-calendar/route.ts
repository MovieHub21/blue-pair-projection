import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
export const dynamic='force-dynamic'
function validDate(v:string|null){return !!v&&/^\d{4}-\d{2}-\d{2}$/.test(v)}
function effectiveCheckOut(b:any){const actual=b.checked_out_at?String(b.checked_out_at).slice(0,10):'';return actual&&actual<b.check_out?actual:b.check_out}
function overlaps(a:string,b:string,c:string,d:string){return a<d&&b>c}
function addDays(date:string,n:number){const d=new Date(`${date}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function paidReservation(b:any){return b.payment_status==='paid'&&!['cancelled','refunded'].includes(String(b.status))}
function bookingOverlaps(b:any,from:string,to:string){return overlaps(from,to,b.check_in,effectiveCheckOut(b))}
export async function GET(request:Request){try{
 const p=new URL(request.url).searchParams;const roomId=p.get('roomId');const from=p.get('from');const to=p.get('to');const adminMode=p.get('admin')==='1'
 if(!roomId||!validDate(from)||!validDate(to)||!from||!to||from>=to)return NextResponse.json({error:'Valid room and calendar range are required.'},{status:400})
 const db=createSupabaseAdminClient()
 const [{data:room,error:roomError},{data:bookings,error:bookingError},{data:daily,error:dailyError}]=await Promise.all([
  db.from('rooms').select('id,room_number,status,room_type_id').eq('id',roomId).maybeSingle(),
  db.from('bookings').select('id,reference,check_in,check_out,checked_out_at,status,payment_status,reservation_expires_at,source,customer_id').eq('room_id',roomId).lt('check_in',to).gt('check_out',from).order('check_in',{ascending:true}),
  db.from('room_daily_statuses').select('status,status_date,notes').eq('room_id',roomId).maybeSingle()
 ])
 if(roomError)throw roomError;if(bookingError)throw bookingError;if(dailyError)throw dailyError;if(!room)return NextResponse.json({error:'Room not found.'},{status:404})
 const rows:any[]=[]
 for(let day=from;day<to;day=addDays(day,1)){
  const next=addDays(day,1)
  const active=(bookings??[]).find((b:any)=>{if(!bookingOverlaps(b,day,next))return false;const paid=paidReservation(b);const hold=b.status==='pending'&&b.payment_status!=='paid'&&b.reservation_expires_at&&new Date(b.reservation_expires_at).getTime()>Date.now();return paid||hold})
  let status='available';let reason='available'
  if(active){status=paidReservation(active)?'booked':'held';reason=status}
  else if(room.status==='maintenance'){status='maintenance';reason='maintenance'}
  else if(room.status==='available_soon'){status='availableSoon';reason='admin_available_soon'}
  else if(adminMode&&daily&&daily.status!=='available'){status=daily.status==='available_soon'?'availableSoon':daily.status;reason='current_operational_status'}
  console.info('[BP-DIAG][room-calendar][day]',{roomId,roomNumber:room.room_number,date:day,status,reason,booking:active?.reference??null,dailyStatus:daily?.status??null,roomStatus:room.status})
  rows.push({date:day,status,reason,reference:active?.reference??null,source:active?.source??null,check_in:active?.check_in??null,check_out:active?effectiveCheckOut(active):null,notes:daily?.notes??null})
 }
 return NextResponse.json({room,from,to,checkInTime:'15:00',checkOutTime:'12:00',days:rows})
}catch(e:any){console.error('[BP-DIAG][room-calendar][error]',{message:e?.message,code:e?.code,details:e?.details,stack:e?.stack});return NextResponse.json({error:'Unable to load room calendar.'},{status:500})}}
