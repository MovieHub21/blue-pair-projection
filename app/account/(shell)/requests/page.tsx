import { getMyGuestRequests, getMyCustomer } from '../../../../lib/account'
import RequestsClient from './RequestsClient'

export default async function SpecialRequestsPage() {
  const [requests, customer] = await Promise.all([getMyGuestRequests(), getMyCustomer()])
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Special Requests</h1>
      <RequestsClient initialRequests={requests} customerId={customer?.id ?? null} guestName={customer?.name ?? ''} />
    </div>
  )
}
