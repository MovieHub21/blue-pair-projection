import RoomServiceOrdersPanel from '../../../../components/staff/RoomServiceOrdersPanel'

export default function RestaurantOrdersPage() {
  return <div><h1 className="text-2xl font-semibold mb-2">Room-service Orders</h1><p className="text-sm text-navy-500 mb-6">Paid guest orders arrive here automatically. Update the fulfilment status as the restaurant prepares and delivers each order.</p><RoomServiceOrdersPanel mode="restaurant" /></div>
}
