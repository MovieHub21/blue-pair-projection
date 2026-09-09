import type { Metadata } from 'next'
import PortalShell from '../../../components/layout/PortalShell'
import { LayoutGrid, ClipboardList } from 'lucide-react'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default function HousekeepingShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell portalName="Housekeeping" portalTag="Cleaner Portal" userName="Musa Danladi" userRole="Housekeeping"
      groups={[{ items: [
        { href: '/housekeeping/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
        { href: '/housekeeping/tasks', label: 'My Tasks', icon: <ClipboardList size={16} /> },
      ]}]}>
      {children}
    </PortalShell>
  )
}
