'use client'
import {useSearchParams} from 'next/navigation'
import AvailabilityCalendar from './AvailabilityCalendar'
export default function BookingCalendarBridge(){const params=useSearchParams();const roomId=params.get('unit');const checkIn=params.get('checkin')||'';const checkOut=params.get('checkout')||'';if(!roomId)return null;function select(ci:string,co:string){
  const q=new URLSearchParams(params.toString())
  q.set('checkin',ci)
  q.set('checkout',co)
  const url=`/booking?${q.toString()}`
  window.history.replaceState(window.history.state,'',url)
  window.dispatchEvent(new CustomEvent('bluepair:booking-dates-change',{detail:{checkIn:ci,checkOut:co}}))
}return <div className="container-w px-6 md:px-10 pt-8 max-w-5xl mx-auto"><AvailabilityCalendar roomId={roomId} initialCheckIn={checkIn} initialCheckOut={checkOut} onSelect={select}/><p className="text-[10px] text-navy-400 mt-2 text-center">Changing dates here rechecks the room before you continue to payment.</p></div>}
