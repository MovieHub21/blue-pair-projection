import { getMyBookings, getMyGuestRequests, getMyCustomer } from '../../../../lib/account'
import { getDrinks, getMenuItems } from '../../../../lib/data'
import RequestsClient from './RequestsClient'

export default async function SpecialRequestsPage() {
  const [requests, customer, bookings, menuItems, drinks] = await Promise.all([getMyGuestRequests(), getMyCustomer(), getMyBookings(), getMenuItems(), getDrinks()])
  const activeStay = bookings.find(b => b.status === 'checked_in' && b.roomId)
  const room = activeStay?.roomNumber ?? undefined
  const orderItems = [
    ...menuItems.filter(item => item.available).map(item => ({ name: item.name, price: item.price, kind: 'Food' })),
    ...drinks.filter(item => item.available).map(item => ({ name: item.name, price: item.price, kind: 'Drink' })),
  ]
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Special Requests</h1>
      <RequestsClient initialRequests={requests} customerId={customer?.id ?? null} guestName={customer?.name ?? ''} activeRoom={room} bookingRef={activeStay?.reference} orderItems={orderItems} />
    </div>
  )
}
