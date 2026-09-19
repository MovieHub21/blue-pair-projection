import { getStaffPortalContext } from '../../../lib/staffPortal'
import type { Metadata } from 'next'
import PortalShell from '@/components/layout/PortalShell'
import { MANAGEMENT_GROUPS, filterGroups } from '@/lib/portalNav'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function ReceptionRootLayout({ children }: { children: React.ReactNode }) {
  const { name, roleLabel, allowed } = await getStaffPortalContext()
  return (
    <>
      <PortalShell
        portalName="Reception"
        portalTag="Front Desk Portal"
        userName={name}
        userRole={roleLabel}
        groups={filterGroups(MANAGEMENT_GROUPS, allowed)}
      >
        {children}
      </PortalShell>
    </>
  )
}
