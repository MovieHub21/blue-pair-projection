import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'
import { SITE_URL } from '../../../../../lib/siteConfig'

const LOCATIONS = new Set(['room','short_let','bar','outdoor_eatery','vip_lounge'])
function isActiveBooking(booking: any, today: string) { return ['confirmed','checked_in'].includes(String(booking.status)) && booking.payment_status === 'paid' && booking.check_in <= today && booking.check_out > today }

export async function POST(request: Request) {
  try {
    const server = createSupabaseServerClient(); const { data: { user } } = await server.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })
    const body = await request.json(); const requestedItems = Array.isArray(body.items) ? body.items : []; const location = String(body.location || ''); const bookingId = body.bookingId ? String(body.bookingId) : null
    const takeout = body.takeout === true; const notes = String(body.notes || '').trim().slice(0,1000); const contactEmail = String(body.contactEmail || '').trim().slice(0,160); const contactPhone = String(body.contactPhone || '').trim().slice(0,40); const deliveryAddress = String(body.deliveryAddress || '').trim().slice(0,500)
    if (takeout && (!contactEmail || !contactPhone)) return NextResponse.json({ error: 'Email and phone number are required for takeaway orders.' }, { status: 400 })
    if (!requestedItems.length) return NextResponse.json({ error: 'Choose at least one drink.' }, { status: 400 })
    if (!takeout && !LOCATIONS.has(location)) return NextResponse.json({ error: 'Choose where the order should be served.' }, { status: 400 })
    const admin = createSupabaseAdminClient(); const { data: customer } = await admin.from('customers').select('id,name,email,user_id').eq('user_id', user.id).maybeSingle()
    if (!customer) return NextResponse.json({ error: 'Guest profile not found.' }, { status: 404 })
    const ids = requestedItems.map((item:any)=>String(item.id||'')).filter(Boolean)
    const { data: drinks, error: drinksError } = await admin.from('drinks').select('id,name,price,available,bar').in('id',ids).eq('bar','Annex Bar'); if (drinksError) throw drinksError
    const drinkMap = new Map((drinks||[]).map((drink:any)=>[drink.id,drink])); const normalized:any[]=[]; let subtotal=0
    for (const requested of requestedItems) { const drink=drinkMap.get(String(requested.id||'')); if(!drink||drink.available===false) return NextResponse.json({error:String(requested.name||'This drink')+' is no longer available.'},{status:400}); const quantity=Math.max(1,Math.min(50,Math.floor(Number(requested.quantity)||1))); const unitPrice=Number(drink.price); const lineTotal=unitPrice*quantity; normalized.push({drinkId:drink.id,drinkName:drink.name,unitPrice,quantity,lineTotal}); subtotal+=lineTotal }
    let resolvedBookingId:string|null=null; let deliveryLabel=takeout?'Takeaway / Pickup':location==='bar'?'Annex Bar':location==='outdoor_eatery'?'Outdoor Eatery':location==='vip_lounge'?'VIP Lounge':''; const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Lagos'})
    if(!takeout && (location==='room'||location==='short_let')){ if(!bookingId)return NextResponse.json({error:'Select your current booking for this delivery location.'},{status:400}); const {data:booking,error}=await admin.from('bookings').select('id,reference,check_in,check_out,status,payment_status,room_id,short_let_id,customer_id').eq('id',bookingId).eq('customer_id',customer.id).maybeSingle(); if(error)throw error; if(!booking||!isActiveBooking(booking,today))return NextResponse.json({error:'That booking is not currently available for delivery.'},{status:409}); resolvedBookingId=booking.id; if(location==='room'){const {data:room}=await admin.from('rooms').select('room_number').eq('id',booking.room_id).maybeSingle(); if(!room?.room_number)return NextResponse.json({error:'Your room could not be found.'},{status:400}); deliveryLabel='Room '+room.room_number}else{const {data:property}=await admin.from('short_lets').select('name').eq('id',booking.short_let_id).maybeSingle(); if(!property?.name)return NextResponse.json({error:'Your short-let property could not be found.'},{status:400}); deliveryLabel=property.name} }
    const checkoutReference='BARPAY-'+Date.now()+'-'+Math.random().toString(36).slice(2,8).toUpperCase(); const payload={items:normalized,location:takeout?'takeout':location,bookingId:resolvedBookingId,takeout,deliveryLabel,notes,contactEmail,contactPhone,deliveryAddress}
    const {error:checkoutError}=await admin.from('bar_order_checkouts').insert({id:'boc_'+Date.now()+'_'+Math.random().toString(36).slice(2,8),customer_id:customer.id,reference:checkoutReference,payload,total:subtotal,status:'pending'}); if(checkoutError)throw checkoutError
    const secret=process.env.PAYSTACK_SECRET_KEY; if(!secret){await admin.from('bar_order_checkouts').delete().eq('reference',checkoutReference); return NextResponse.json({error:'Paystack is not configured.'},{status:503})}
    const callbackUrl=(process.env.NEXT_PUBLIC_SITE_URL||SITE_URL)+'/api/bar/orders/callback'
    const paystackResponse=await fetch('https://api.paystack.co/transaction/initialize',{method:'POST',headers:{Authorization:'Bearer '+secret,'Content-Type':'application/json'},body:JSON.stringify({email:customer.email||contactEmail,amount:String(Math.round(subtotal*100)),currency:'NGN',reference:checkoutReference,callback_url:callbackUrl,metadata:{source:'annex_bar_order',checkout_reference:checkoutReference,customer_id:customer.id,user_id:user.id}}),cache:'no-store'})
    const result=await paystackResponse.json(); if(!paystackResponse.ok||!result?.status||!result?.data?.authorization_url){await admin.from('bar_order_checkouts').update({status:'failed'}).eq('reference',checkoutReference); return NextResponse.json({error:result?.message||'Paystack could not initialize payment.'},{status:502})}
    await admin.from('bar_order_checkouts').update({payment_reference:result.data.reference}).eq('reference',checkoutReference); return NextResponse.json({authorizationUrl:result.data.authorization_url,reference:result.data.reference})
  } catch(error:any){ console.error('[bar-order-payment-init]',error); return NextResponse.json({error:error?.message||'Unable to start payment.'},{status:500}) }
}