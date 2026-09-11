import type { Metadata } from 'next'
import PortalShell from '../../../components/layout/PortalShell'
import { LayoutGrid, ClipboardList } from 'lucide-react'
import { getCurrentStaff } from '../../../lib/staff'
import StoreLoader from '../../../components/providers/StoreLoader'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function HousekeepingShellLayout({ children }: { children: React.ReactNode }) {
  const { name, roleLabel } = await getCurrentStaff()
  return (
    <>
    <StoreLoader />
    <PortalShell portalName="Housekeeping" portalTag="Cleaner Portal" userName={name} userRole={roleLabel}
      groups={[{ items: [
        { href: '/housekeeping/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
        { href: '/housekeeping/tasks', label: 'My Tasks', icon: <ClipboardList size={16} /> },
      ]}]}>
      {children}
    </PortalShell>
    </>
  )
}
