import RoomServiceOrdersPanel from '../../../components/staff/RoomServiceOrdersPanel'

export default function ReceptionRoomServicePage() {
  return <div><h1 className="text-2xl font-semibold mb-2">Room-service Tracking</h1><p className="text-sm text-navy-500 mb-6">Keep track of paid guest orders while the restaurant handles preparation and delivery.</p><RoomServiceOrdersPanel mode="reception" /></div>
}
