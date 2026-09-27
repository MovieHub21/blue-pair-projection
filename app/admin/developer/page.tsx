import { getMyPermissions } from '../../../lib/permissions'
import MaintenanceModeClient from '../../../components/admin/MaintenanceModeClient'

export default async function DeveloperPage() {
  const { roles, isSuperAdmin, allowed } = await getMyPermissions()
  const canEdit = isSuperAdmin || (roles.includes('developer') && allowed('developer'))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Developer</h1>
      <p className="text-xs text-navy-400 mb-2">
        Developer controls for the Blue Pair website and administrative runtime.
      </p>
      <MaintenanceModeClient canEdit={canEdit} />
    </div>
  )
}
