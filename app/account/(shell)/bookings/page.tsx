import { getMyBookings } from '../../../../lib/account'
import MyBookingsClient from './MyBookingsClient'

export default async function MyBookingsPage() {
  const bookings = await getMyBookings()
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My Bookings</h1>
      <MyBookingsClient bookings={bookings} />
    </div>
  )
}
