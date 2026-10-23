import { Suspense } from 'react'
import { buildMetadata } from '../../../lib/buildMetadata'
import { getRoomTypes } from '../../../lib/data'
import BookingFlowPaystackClient from './BookingFlowPaystackClient'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata = buildMetadata({title:'Book a Hotel Room in Uromi, Edo State | Blue Pair Signature Booking',description:'Complete your booking at Blue Pair Signature, Uromi, Edo State — pick your room, dates and pay securely online.',keywords:'book hotel room Uromi, hotel booking Uromi, hotel room reservation Uromi, Blue Pair Signature booking',path:'/booking'})
export default async function BookingPage(){const roomTypes=(await getRoomTypes()).filter(r=>r.active);return <Suspense><BookingFlowPaystackClient roomTypes={roomTypes}/></Suspense>}
