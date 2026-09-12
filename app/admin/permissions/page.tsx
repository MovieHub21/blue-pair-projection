import { getMyPermissions } from '../../../lib/permissions'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import PermissionsClient from './PermissionsClient'
import MaintenanceModeClient from '../../../components/admin/MaintenanceModeClient'

const ROLES = ['super_admin', 'manager', 'reception', 'housekeeping', 'maintenance', 'restaurant', 'bar', 'accountant'] as const
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', manager: 'Manager', reception: 'Reception', housekeeping: 'Housekeeping',
  maintenance: 'Maintenance', restaurant: 'Restaurant', bar: 'Bar', accountant: 'Accountant',
}

export default async function PermissionsPage() {
  const { isSuperAdmin } = await getMyPermissions()
  const db = createSupabaseServerClient()
  const { data } = await db.from('role_permissions').select('*').order('sort_order')
  const rows = data ?? []

  const byRole = ROLES.map(role => ({
    role, label: ROLE_LABELS[role],
    sections: rows.filter((r: any) => r.role === role).map((r: any) => ({ id: r.id, section: r.section, label: r.label, allowed: r.allowed })),
  }))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">Permissions</h1>
      <p className="text-xs text-navy-400 mb-6">
        {isSuperAdmin ? 'Control which portal sections each staff role can access.' : 'You can view permissions for your role — only a Super Admin can change them.'}
      </p>
      <PermissionsClient roles={byRole} canEdit={isSuperAdmin} />
      <MaintenanceModeClient canEdit={isSuperAdmin} />
    </div>
  )
}
