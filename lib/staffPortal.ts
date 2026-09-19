import { cache } from 'react'
import { getCurrentUser } from './account'
import { createSupabaseServerClient } from './supabase/server'
import { ALWAYS_ALLOWED_SECTIONS } from './permissionSections'
import type { AppRole } from './permissions'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  manager: 'Manager',
  reception: 'Reception',
  housekeeping: 'Housekeeping',
  maintenance: 'Maintenance',
  restaurant: 'Restaurant',
  bar: 'Bar',
  accountant: 'Accountant',
}

const PRIORITY = ['super_admin', 'manager', 'reception', 'housekeeping', 'maintenance', 'restaurant', 'bar', 'accountant']

/**
 * Loads the staff identity, roles and section permissions together for portal layouts.
 * This avoids repeating the role query once for the header and again for permissions.
 */
export const getStaffPortalContext = cache(async () => {
  const { user, profile } = await getCurrentUser()
  if (!user) {
    return {
      name: 'Staff',
      roleLabel: 'Staff',
      roles: [] as AppRole[],
      allowed: (_section: string) => false,
    }
  }

  const db = createSupabaseServerClient()
  const { data: roleRows } = await db.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => r.role as AppRole)
  const isSuperAdmin = roles.includes('super_admin')

  let allowed: (section: string) => boolean
  if (isSuperAdmin || roles.length === 0) {
    allowed = () => true
  } else {
    const { data: permRows } = await db
      .from('role_permissions')
      .select('section, allowed')
      .in('role', roles)

    const bySection = new Map<string, boolean>()
    for (const row of permRows ?? []) {
      bySection.set(row.section, bySection.get(row.section) || row.allowed)
    }

    allowed = (section: string) =>
      ALWAYS_ALLOWED_SECTIONS.has(section) ||
      (bySection.has(section) ? !!bySection.get(section) : true)
  }

  const primary = PRIORITY.find(role => roles.includes(role as AppRole))

  return {
    name: profile?.name || user.email || 'Staff',
    roleLabel: primary ? ROLE_LABELS[primary] : 'Staff',
    roles,
    allowed,
  }
})
