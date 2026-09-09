import type { Metadata } from 'next'
import PortalShell from '../../components/layout/PortalShell'
import { LayoutGrid, LogIn, LogOut, BedDouble, MessageSquare } from 'lucide-react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function ReceptionRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell portalName="Reception" portalTag="Front Desk Portal" userName="Yusuf Aliyu" userRole="Reception"
      groups={[{ items: [
        { href: '/reception/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
        { href: '/reception/arrivals', label: "Today's Arrivals", icon: <LogIn size={16} /> },
        { href: '/reception/departures', label: "Today's Departures", icon: <LogOut size={16} /> },
        { href: '/reception/room-assignment', label: 'Room Assignment', icon: <BedDouble size={16} /> },
        { href: '/reception/requests', label: 'Guest Requests', icon: <MessageSquare size={16} /> },
      ]}]}>
      {children}
    </PortalShell>
  )
}
