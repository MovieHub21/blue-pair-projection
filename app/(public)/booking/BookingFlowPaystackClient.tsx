'use client'
import {useEffect,useState} from 'react'
import {useSearchParams,usePathname} from 'next/navigation'
import Link from 'next/link'
import {Check,Calendar,Users,Wallet,Loader2,ArrowLeft,Shirt,UtensilsCrossed,Dumbbell,Gamepad2} from 'lucide-react'
import {useAuth} from '../../../lib/useAuth'
import {naira,nightsBetween,formatDate,todayISO,addDaysISO} from '../../../lib/format'
import type {RoomType,ExtraServiceSelection} from '../../../data/mock'
const STEPS=['Room','Dates & Guests','Guest Info','Summary']
type Unit={id:string;room_number:string;name:string;status:string;room_type_id:string;image_url?:string|null}
const EXTRA_SERVICES:ExtraServiceSelection[]=[
 {id:'laundry',name:'Laundry Service',price:5000},
 {id:'feeding',name:'Full stay Feeding',price:17000},
 {id:'gym',name:'Gym House',price:1500},
 {id:'game',name:'Game House',price:5000},
]
const EXTRA_META:Record<string,{icon:any;description:string}>={
 laundry:{icon:Shirt,description:'Fresh laundry during your stay.'},
 feeding:{icon:UtensilsCrossed,description:'Feeding package for your full stay.'},
 gym:{icon:Dumbbell,description:'Access to the gym house.'},
 game:{icon:Gamepad2,description:'Game house access during your stay.'},
}
export default function BookingFlowPaystackClient({roomTypes}:{roomTypes:RoomType[]}){
 const params=useSearchParams(); const pathname=usePathname(); const auth=useAuth(); const typeSlug=params.get('room')||''; const [step,setStep]=useState(0); const [typeId,setTypeId]=useState(roomTypes.find(r=>r.slug===typeSlug)?.id||roomTypes[0]?.id||''); const [unitId,setUnitId]=useState(params.get('unit')||''); const [units,setUnits]=useState<Unit[]>([]); const [checkIn,setCheckIn]=useState(params.get('checkin')||todayISO()); const [checkOut,setCheckOut]=useState(params.get('checkout')||addDaysISO(2)); const [adults,setAdults]=useState(2); const [children,setChildren]=useState(0); const [guest,setGuest]=useState({name:'',email:'',phone:'',requests:''}); const [extraIds,setExtraIds]=useState<string[]>([]); const [submitting,setSubmitting]=useState(false); const [submitError,setSubmitError]=useState<string|null>(null); const [submitErrorCode,setSubmitErrorCode]=useState<string|null>(null); const paymentResult=params.get('payment'); const paymentReference=params.get('reference')||''
 const room=roomTypes.find(r=>r.id===typeId); const nights=nightsBetween(checkIn,checkOut); const subtotal=(room?.price||0)*nights; const extraTotal=EXTRA_SERVICES.filter(x=>extraIds.includes(x.id)).reduce((sum,x)=>sum+x.price,0); const taxableSubtotal=subtotal+extraTotal; const tax=Math.round(taxableSubtotal*.075); const total=taxableSubtotal+tax; const selected=units.find(u=>u.id===unitId); const maxChildren=Math.max(0,(room?.guests||1)-adults)
 useEffect(()=>{
  const onDatesChange=(event:Event)=>{
    const detail=(event as CustomEvent<{checkIn?:string;checkOut?:string}>).detail
    if(detail?.checkIn&&detail?.checkOut){
      setCheckIn(detail.checkIn)
      setCheckOut(detail.checkOut)
    }
  }
  window.addEventListener('bluepair:booking-dates-change',onDatesChange)
  return()=>window.removeEventListener('bluepair:booking-dates-change',onDatesChange)
},[])
useEffect(()=>{
  if(!typeId||!checkIn||!checkOut||checkIn>=checkOut)return
  fetch(`/api/public/availability?roomTypeId=${encodeURIComponent(typeId)}&checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}&_=${Date.now()}`,{cache:'no-store'})
    .then(r=>r.ok?r.json():null)
    .then(data=>{
      const available=(data?.rooms??[]).filter((x:Unit&{guest_status?:string})=>x.guest_status==='available')
      setUnits(available)
      setUnitId(current=>available.some((x:Unit)=>x.id===current)?current:(available[0]?.id||''))
    })
    .catch(()=>setUnits([]))
},[typeId,checkIn,checkOut])
 useEffect(()=>{if(room)setAdults(a=>Math.min(Math.max(1,a),room.guests))},[room?.id,room?.guests])
 useEffect(()=>{if(auth.customer||auth.profile)setGuest(g=>({...g,name:g.name||auth.customer?.name||auth.profile?.name||'',email:g.email||auth.customer?.email||auth.profile?.email||auth.email||'',phone:g.phone||auth.customer?.phone||auth.profile?.phone||''}))},[auth.customer,auth.profile,auth.email])
 useEffect(()=>{if(paymentResult==='success'&&paymentReference&&auth.userId)void fetch('/api/email/payment-confirmation',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reference:paymentReference})})},[paymentResult,paymentReference,auth.userId])
 function toggleExtra(id:string){setExtraIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id])}
 function roomPageHref(){return room?`/rooms/${room.slug}`:'/rooms'}
 async function payWithPaystack(){
  if(!auth.userId||!room||!selected)return
  if(adults+children>room.guests){setSubmitError(`This ${room.name} allows a maximum of ${room.guests} guest${room.guests===1?'':'s'}.`);setSubmitErrorCode(null);return}
  setSubmitting(true);setSubmitError(null);setSubmitErrorCode(null)
  try{
   const reservationResponse=await fetch('/api/public/reservations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomTypeId:room.id,roomId:selected.id,checkIn,checkOut,adults,children,amount:total,specialRequests:guest.requests.trim()||undefined,extraServices:EXTRA_SERVICES.filter(x=>extraIds.includes(x.id))})})
   const reservationData=await reservationResponse.json().catch(()=>({}))
   if(!reservationResponse.ok||!reservationData.booking?.id){
    if(reservationData.code==='PAYMENT_IN_PROGRESS'){setSubmitErrorCode('PAYMENT_IN_PROGRESS');throw new Error('Another guest is currently paying for this room. Please try again in a few seconds. Your selected room has not been changed.')}
    if(reservationData.code==='ROOM_SOLD'){setSubmitErrorCode('ROOM_SOLD');throw new Error('This room has just been taken by another guest who successfully paid. Please choose another room or another date.')}
    throw new Error(reservationData.error||'Unable to reserve this room right now.')
   }
   const response=await fetch('/api/paystack/initialize',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bookingId:reservationData.booking.id})})
   const data=await response.json().catch(()=>({}))
   if(!response.ok||!data.authorizationUrl){
    if(data.code==='PAYMENT_IN_PROGRESS'){setSubmitErrorCode('PAYMENT_IN_PROGRESS');throw new Error('Another guest is currently completing payment for this room. Please try again in a few seconds. Your selected room has not been changed.')}
    if(data.code==='ROOM_SOLD'){setSubmitErrorCode('ROOM_SOLD');throw new Error('This room has just been taken by another guest who successfully paid. Please choose another room or another date.')}
    throw new Error(data.error||'Unable to open Paystack checkout.')
   }
   window.location.assign(data.authorizationUrl)
  }catch(e:any){setSubmitError(e?.message||'Something went wrong starting payment.');setSubmitting(false)}
 }
 if(!room)return <div className="container-w px-6 py-16 text-center">No room type available.</div>
 if(paymentResult){const ok=paymentResult==='success';return <div className="container-w px-6 py-16 max-w-lg mx-auto text-center"><div className={'w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-5 '+(ok?'bg-emerald-100 text-emerald-600':'bg-red-100 text-red-600')}>{ok?<Check size={30}/>:<span className="text-2xl">!</span>}</div><h1 className="text-3xl font-semibold mb-3">{ok?'Booking confirmed':'Payment not completed'}</h1><p className="text-sm text-navy-500 leading-6 mb-6">{ok?'Your payment was verified and your selected room has been secured.': 'We could not confirm this payment.'}</p><Link href="/account/bookings" className="btn-primary">View my bookings</Link></div>}
 if(!auth.loading&&!auth.userId){const redirect=`${pathname}?${params.toString()}`;return <div className="container-w px-6 py-16 max-w-md mx-auto text-center"><h2 className="text-2xl font-semibold mb-3">Sign in to book</h2><p className="text-sm text-navy-500 mb-8">Sign in so your booking can be attached to your account.</p><Link href={`/account/login?redirect=${encodeURIComponent(redirect)}`} className="btn-primary">Sign in</Link></div>}
 return <div className="container-w px-6 md:px-10 py-10 max-w-5xl mx-auto"><div className="flex items-center gap-1.5 mb-12 overflow-x-auto pb-2">{STEPS.map((label,i)=><div key={label} className="flex items-center gap-1.5 shrink-0"><div className="flex items-center gap-2"><div className={'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold '+(i<step?'bg-emerald-500 text-white':i===step?'bg-navy-950 text-white':'border border-black/15 text-navy-400')}>{i<step?<Check size={13}/>:i+1}</div><span className="text-xs font-semibold">{label}</span></div>{i<3&&<div className="w-8 h-px bg-black/10"/>}</div>)}</div>
 {step===0&&<div><h2 className="text-2xl font-semibold mb-6">Select a specific room</h2><div className="grid sm:grid-cols-2 gap-4">{units.filter(u=>u.status==='available').map(u=><button key={u.id} onClick={()=>setUnitId(u.id)} className={'card p-4 flex gap-4 text-left items-center border-2 '+(unitId===u.id?'border-gold-500':'border-transparent')}><img src={u.image_url||room.images[0]} className="w-20 h-20 rounded-lg object-cover" alt=""/><div className="flex-1"><b className="block text-sm">{u.name||`Room ${u.room_number}`}</b><span className="text-xs text-navy-400">Room {u.room_number}</span><div className="font-display text-sm mt-1">{naira(room.price)}<span className="text-[11px] font-body text-navy-400"> /night</span></div></div>{unitId===u.id&&<Check size={18} className="text-gold-500"/>}</button>)}</div>{units.filter(u=>u.status==='available').length===0&&<div className="card p-6 text-sm text-red-700 bg-red-50">No physical rooms of this type are available.</div>}<button disabled={!selected} onClick={()=>setStep(1)} className="btn-primary mt-8 disabled:opacity-50">Continue</button></div>}
 {step===1&&<div className="max-w-md"><h2 className="text-2xl font-semibold mb-6">Dates & guests</h2><label className="field-label">Check-in</label><input type="date" value={checkIn} onChange={e=>setCheckIn(e.target.value)} className="field-input mb-4"/><label className="field-label">Check-out</label><input type="date" value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="field-input mb-4"/><div className="mb-4 rounded-xl bg-cream-100 border border-black/5 px-4 py-3 text-sm text-navy-600">Maximum occupancy for <b>{room.name}</b>: <b>{room.guests} guest{room.guests===1?'':'s'}</b></div><div className="grid grid-cols-2 gap-4"><div><label className="field-label flex items-center gap-1.5"><Users size={13}/>Adults</label><select value={adults} onChange={e=>{const value=+e.target.value;setAdults(value);setChildren(c=>Math.min(c,Math.max(0,room.guests-value)))}} className="field-input">{Array.from({length:room.guests},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}</select></div><div><label className="field-label">Children</label><select value={children} onChange={e=>setChildren(Math.min(+e.target.value,maxChildren))} className="field-input">{Array.from({length:maxChildren+1},(_,i)=>i).map(n=><option key={n} value={n}>{n}</option>)}</select></div></div><p className="text-xs text-navy-400 mt-3">Total guests: {adults+children} of {room.guests}</p><div className="flex gap-3 mt-8"><button onClick={()=>setStep(0)} className="btn-outline"><ArrowLeft size={14}/>Back</button><button onClick={()=>setStep(2)} className="btn-primary">Continue</button></div></div>}
 {step===2&&<div className="max-w-md"><h2 className="text-2xl font-semibold mb-6">Guest information</h2>{[['name','Full name'],['email','Email'],['phone','Phone']].map(([k,l])=><div key={k}><label className="field-label">{l}</label><input value={(guest as any)[k]} onChange={e=>setGuest({...guest,[k]:e.target.value})} className="field-input mb-4"/></div>)}<label className="field-label">Special requests</label><input value={guest.requests} onChange={e=>setGuest({...guest,requests:e.target.value})} className="field-input"/><div className="flex gap-3 mt-8"><button onClick={()=>setStep(1)} className="btn-outline"><ArrowLeft size={14}/>Back</button><button onClick={()=>setStep(3)} className="btn-primary">Continue</button></div></div>}
 {step===3&&<div className="max-w-md"><h2 className="text-2xl font-semibold mb-6">Booking summary</h2><div className="card p-5 mb-5"><b>{selected?.name||`Room ${selected?.room_number}`}</b><p className="text-xs text-navy-400 mt-1">{room.name} · {formatDate(checkIn)} → {formatDate(checkOut)} · {adults} adult{adults===1?'':'s'}{children?` · ${children} child${children===1?'':'ren'}`:''}</p></div>
 <div className="mb-5"><div className="flex items-end justify-between mb-3"><div><h3 className="text-sm font-semibold">Add extra services</h3><p className="text-xs text-navy-400 mt-0.5">Optional services for your stay</p></div><span className="text-[10px] uppercase tracking-[.14em] text-navy-400">Optional</span></div><div className="grid grid-cols-1 gap-2.5">{EXTRA_SERVICES.map(service=>{const Icon=EXTRA_META[service.id].icon;const selectedExtra=extraIds.includes(service.id);return <button key={service.id} type="button" onClick={()=>toggleExtra(service.id)} className={'w-full rounded-xl border p-3 flex items-center gap-3 text-left transition '+(selectedExtra?'border-navy-950 bg-navy-950 text-white shadow-sm':'border-black/10 bg-white hover:border-black/20')}><span className={'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 '+(selectedExtra?'bg-white/10':'bg-navy-50 text-navy-700')}><Icon size={16}/></span><span className="min-w-0 flex-1"><b className="block text-xs font-semibold">{service.name}</b><span className={'block text-[10px] mt-0.5 '+(selectedExtra?'text-white/60':'text-navy-400')}>{EXTRA_META[service.id].description}</span></span><span className="text-xs font-semibold shrink-0">{naira(service.price)}</span><span className={'w-4 h-4 rounded-full border flex items-center justify-center shrink-0 '+(selectedExtra?'border-white bg-white text-navy-950':'border-black/20')}>{selectedExtra&&<Check size={10}/>}</span></button>})}</div></div>
 <div className="card p-5"><div className="flex justify-between text-sm"><span>{naira(room.price)} × {nights} nights</span><span>{naira(subtotal)}</span></div>{extraTotal>0&&<div className="flex justify-between text-sm mt-2"><span>Extra services</span><span>{naira(extraTotal)}</span></div>}<div className="flex justify-between text-sm mt-2"><span>Taxes & VAT</span><span>{naira(tax)}</span></div><div className="flex justify-between font-semibold border-t border-black/10 mt-4 pt-4"><span>Total</span><b>{naira(total)}</b></div></div>{submitError&&<div className="mt-4 text-xs text-red-600 bg-red-50 p-3 rounded-lg"><p>{submitError}</p>{submitErrorCode&&(submitErrorCode==='ROOM_SOLD'||submitErrorCode==='PAYMENT_IN_PROGRESS')&&<Link href={roomPageHref()} className="inline-flex mt-3 font-semibold underline underline-offset-2">{submitErrorCode==='ROOM_SOLD'?'Choose another room or another date':'Return to room page'}</Link>}</div>}<div className="flex gap-3 mt-8"><button onClick={()=>setStep(2)} className="btn-outline" disabled={submitting}><ArrowLeft size={14}/>Back</button><button onClick={payWithPaystack} disabled={submitting||!selected} className="btn-gold flex-1 justify-center flex items-center gap-2">{submitting&&<Loader2 size={15} className="animate-spin"/>}{submitting?'Opening Paystack…':`Pay now — ${naira(total)}`}</button></div></div>}
 </div>
}
