import type { Metadata } from 'next'
import PortalShell from '../../components/layout/PortalShell'
import { LayoutGrid, Wrench } from 'lucide-react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function MaintenanceRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell portalName="Maintenance" portalTag="Facilities Portal" userName="Emeka Nnamdi" userRole="Maintenance"
      groups={[{ items: [
        { href: '/maintenance/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
        { href: '/maintenance/tickets', label: 'Tickets', icon: <Wrench size={16} /> },
      ]}]}>
      {children}
    </PortalShell>
  )
}
