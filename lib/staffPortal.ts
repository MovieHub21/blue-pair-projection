import { cache } from 'react'
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
 * After the (unavoidable) auth check, the profile, role and permission lookups run in
 * parallel instead of one after another, so the layout waits for one round trip, not three.
 */
export const getStaffPortalContext = cache(async () => {
  const db = createSupabaseServerClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) {
    return {
      name: 'Staff',
      roleLabel: 'Staff',
      roles: [] as AppRole[],
      allowed: (_section: string) => false,
    }
  }

  const [{ data: profile }, { data: roleRows }, { data: permRows }] = await Promise.all([
    db.from('profiles').select('name').eq('id', user.id).maybeSingle(),
    db.from('user_roles').select('role').eq('user_id', user.id),
    // Small table (roles x sections). Fetched alongside the roles and filtered below.
    db.from('role_permissions').select('role, section, allowed'),
  ])
  const roles = (roleRows ?? []).map((r: any) => r.role as AppRole)
  const isSuperAdmin = roles.includes('super_admin')

  let allowed: (section: string) => boolean
  if (isSuperAdmin || roles.length === 0) {
    allowed = () => true
  } else {
    const bySection = new Map<string, boolean>()
    for (const row of permRows ?? []) {
      if (!roles.includes(row.role as AppRole)) continue
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
