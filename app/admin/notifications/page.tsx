import StaffNotificationsPage from '../../../components/staff/StaffNotificationsPage'

export const metadata = { title: 'Notifications', robots: { index: false, follow: false } }

// One page for every staff portal (admin, reception, housekeeping, maintenance, restaurant, bar). Each
// person only sees the notifications routed to them, the same way the department emails are routed.
export default function AdminNotificationsPage() {
  return <StaffNotificationsPage />
}
