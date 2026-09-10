import type { Metadata } from 'next'
import PortalShell from '../../../components/layout/PortalShell'
import { LayoutGrid, CalendarCheck, FileText, MessageSquarePlus, User } from 'lucide-react'
import { getCurrentUser } from '../../../lib/account'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AccountShellLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUser()
  const userName = profile?.name || user?.email || 'Guest'

  return (
    <PortalShell portalName="My Account" portalTag="Customer Portal" userName={userName} userRole="Guest"
      groups={[{ items: [
        { href: '/account/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
        { href: '/account/bookings', label: 'My Bookings', icon: <CalendarCheck size={16} /> },
        { href: '/account/invoices', label: 'Invoices', icon: <FileText size={16} /> },
        { href: '/account/requests', label: 'Special Requests', icon: <MessageSquarePlus size={16} /> },
        { href: '/account/profile', label: 'Profile', icon: <User size={16} /> },
      ]}]}>
      {children}
    </PortalShell>
  )
}
