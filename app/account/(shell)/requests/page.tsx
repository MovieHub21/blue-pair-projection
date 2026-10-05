import { getMyBookings, getMyGuestRequests, getMyCustomer } from '../../../../lib/account'
import { getDrinks, getMenuItems } from '../../../../lib/data'
import RequestsClient from './RequestsClient'

const ANNEX_MENU_OUTLETS = new Set(['Annex Restaurant', 'Annex Grilling', 'Outdoor Bar & Eatery', 'Annex Outdoor Eatery'])

export default async function SpecialRequestsPage() {
  const [requests, customer, bookings, menuItems, drinks] = await Promise.all([getMyGuestRequests(), getMyCustomer(), getMyBookings(), getMenuItems(), getDrinks()])
  const activeStay = bookings.find(b => b.status === 'checked_in' && (b.roomId || b.shortLetId))
  const isAnnexStay = Boolean(activeStay?.shortLetId)
  const stayLabel = isAnnexStay
    ? activeStay?.shortLet?.name ?? 'Annex short-let'
    : activeStay?.roomNumber ? `Room ${activeStay.roomNumber}` : undefined

  // Room service is tied to the building where the guest is staying.
  // Main-hotel stays can order the main hotel's catalogue; Annex short-lets can
  // order only Annex food/drinks so the two buildings never mix menus.
  const eligibleMenuItems = isAnnexStay
    ? menuItems.filter(item => item.available && ANNEX_MENU_OUTLETS.has(item.outlet))
    : menuItems.filter(item => item.available && !ANNEX_MENU_OUTLETS.has(item.outlet))
  const eligibleDrinks = isAnnexStay
    ? drinks.filter(item => item.available && item.bar === 'Annex Bar')
    : drinks.filter(item => item.available && item.bar !== 'Annex Bar')
  const orderItems = [
    ...eligibleMenuItems.map(item => ({ name: item.name, price: item.price, kind: 'Food' })),
    ...eligibleDrinks.map(item => ({ name: item.name, price: item.price, kind: 'Drink' })),
  ]

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Special Requests</h1>
      <RequestsClient initialRequests={requests} customerId={customer?.id ?? null} guestName={customer?.name ?? ''} activeRoom={stayLabel} bookingRef={activeStay?.reference} orderItems={orderItems} />
    </div>
  )
}