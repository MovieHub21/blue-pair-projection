import { getCurrentUser } from './account'
import { createSupabaseServerClient } from './supabase/server'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', manager: 'Manager', reception: 'Reception',
  housekeeping: 'Housekeeping', maintenance: 'Maintenance', restaurant: 'Restaurant',
  bar: 'Bar', accountant: 'Accountant',
}
const PRIORITY = ['super_admin', 'manager', 'reception', 'housekeeping', 'maintenance', 'restaurant', 'bar', 'accountant']

/** Real signed-in staff member's display name + primary role label, for staff portal headers. */
export async function getCurrentStaff() {
  const { user, profile } = await getCurrentUser()
  if (!user) return { name: 'Staff', roleLabel: 'Staff' }
  const db = createSupabaseServerClient()
  const { data: roleRows } = await db.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (roleRows ?? []).map((r: any) => r.role as string)
  const primary = PRIORITY.find(r => roles.includes(r))
  return {
    name: profile?.name || user.email || 'Staff',
    roleLabel: primary ? ROLE_LABELS[primary] : 'Staff',
  }
}
