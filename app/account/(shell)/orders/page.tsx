import { getAnnexActiveBookings } from '../../../../lib/annexOrders'
import AnnexOrdersClient from './AnnexOrdersClient'

export default async function OrdersPage() {
  const activeBookings = await getAnnexActiveBookings()
  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-gold-600">Food & drinks</p>
        <h1 className="mt-1 text-2xl font-semibold text-navy-950">My Annex Orders</h1>
        <p className="mt-1 max-w-2xl text-sm text-navy-400">Track orders from the Annex Bar, Restaurant, Grilling and Outdoor Eatery in one place.</p>
      </div>
      <AnnexOrdersClient activeBookings={activeBookings} />
    </div>
  )
}
