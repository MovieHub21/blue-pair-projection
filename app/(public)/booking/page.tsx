import { Suspense } from 'react'
import { buildMetadata } from '../../../lib/buildMetadata'
import BookingFlowClient from './BookingFlowClient'

export const metadata = buildMetadata({
  title: 'Book a Hotel Room in Uromi, Edo State | Blue Pair Hotel Booking',
  description: 'Complete your booking at Blue Pair Hotel, Uromi, Edo State — pick your room, dates and pay securely online.',
  keywords: 'book hotel room uromi, hotel booking edo state, blue pair hotel reservation',
  path: '/booking',
})

export default function BookingPage() {
  return (
    <Suspense>
      <BookingFlowClient />
    </Suspense>
  )
}
