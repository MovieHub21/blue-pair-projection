import { getStaffPortalContext } from '../../lib/staffPortal'
import type { Metadata } from 'next'
import PortalShell from '../../components/layout/PortalShell'
import { MANAGEMENT_GROUPS, filterGroups } from '../../lib/portalNav'
import BackgroundJobNotifications from '../../components/ui/BackgroundJobNotifications'

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
  const { userId, name, roleLabel, canAssignRoomTasks, allowed } = await getStaffPortalContext()
  const navAllowed = (section: string) => section === 'room_operations'
    ? canAssignRoomTasks
    : allowed(section)

  return (
    <>
      <BackgroundJobNotifications userId={userId} />
      <PortalShell
        portalName="Admin"
        portalTag="Hotel Management"
        userName={name}
        userRole={roleLabel}
        groups={filterGroups(MANAGEMENT_GROUPS, navAllowed)}
      >
        {children}
      </PortalShell>
    </>
  )
}
