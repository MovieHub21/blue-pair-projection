import { cache } from 'react'
import { getCurrentUser } from './account'
import { createSupabaseServerClient } from './supabase/server'
import { ALWAYS_ALLOWED_SECTIONS } from './permissionSections'

export type AppRole =
  | 'super_admin' | 'manager' | 'reception' | 'housekeeping'
  | 'maintenance' | 'restaurant' | 'bar' | 'accountant'

/** The signed-in staff member's roles + a lookup of which sections they can access. Request-memoized. */
export const getMyPermissions = cache(async () => {
  const { user } = await getCurrentUser()
  if (!user) return { roles: [] as AppRole[], isSuperAdmin: false, allowed: (_section: string) => false }

  const db = createSupabaseServerClient()
  const { data: roleRows } = await db.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => r.role as AppRole)
  const isSuperAdmin = roles.includes('super_admin')

  if (isSuperAdmin || roles.length === 0) {
    return { roles, isSuperAdmin, allowed: () => true }
  }

  const { data: permRows } = await db.from('role_permissions').select('section, allowed').in('role', roles)
  const bySection = new Map<string, boolean>()
  for (const r of permRows ?? []) {
    bySection.set(r.section, bySection.get(r.section) || r.allowed)
  }
  // Sections with no explicit row for this role default to allowed (fail-open only for undefined sections,
  // not ones an admin has explicitly restricted). Dashboard is always reachable.
  const allowed = (section: string) => ALWAYS_ALLOWED_SECTIONS.has(section) || (bySection.has(section) ? !!bySection.get(section) : true)

  return { roles, isSuperAdmin, allowed }
})

export { sectionForPath, PATH_SECTIONS } from './permissionSections'
