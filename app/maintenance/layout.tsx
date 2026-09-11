import type { Metadata } from 'next'
import PortalShell from '../../components/layout/PortalShell'
import { LayoutGrid, Wrench } from 'lucide-react'
import { getCurrentStaff } from '../../lib/staff'
import StoreLoader from '../../components/providers/StoreLoader'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function MaintenanceRootLayout({ children }: { children: React.ReactNode }) {
  const { name, roleLabel } = await getCurrentStaff()
  return (
    <>
    <StoreLoader />
    <PortalShell portalName="Maintenance" portalTag="Facilities Portal" userName={name} userRole={roleLabel}
      groups={[{ items: [
        { href: '/maintenance/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
        { href: '/maintenance/tickets', label: 'Tickets', icon: <Wrench size={16} /> },
      ]}]}>
      {children}
    </PortalShell>
    </>
  )
}
