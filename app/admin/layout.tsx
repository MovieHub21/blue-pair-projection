import type { Metadata } from 'next'
import PortalShell from '../../components/layout/PortalShell'
import { getCurrentStaff } from '../../lib/staff'
import { getMyPermissions } from '../../lib/permissions'
import { MANAGEMENT_GROUPS, filterGroups } from '../../lib/portalNav'
import StoreLoader from '../../components/providers/StoreLoader'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { name, roleLabel } = await getCurrentStaff()
  const { allowed } = await getMyPermissions()

  return (
    <>
      <StoreLoader />

      <PortalShell
        portalName="Admin"
        portalTag="Hotel Management"
        userName={name}
        userRole={roleLabel}
        groups={filterGroups(MANAGEMENT_GROUPS, allowed)}
      >
        {children}
      </PortalShell>
    </>
  )
}
