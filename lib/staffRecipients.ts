import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Who works in which department. This is the ONE place that decides who receives a department's
 * emails and notifications, so the two can never disagree (maintenance never receives what is meant
 * for reception, and the other way round).
 *
 * A staff member belongs to a department when the department name appears in their staff "department"
 * or "role" (for example role "Reception" / department "Front Desk"). Managers and super admins are the
 * "management" group and can also be added to any notification.
 */
export type StaffDepartment = 'reception' | 'housekeeping' | 'maintenance' | 'restaurant' | 'bar' | 'annex' | 'management'

export type StaffRecipient = { userId: string | null; email: string; name: string }

const DEPARTMENT_KEYWORDS: Record<Exclude<StaffDepartment, 'management'>, string[]> = {
  reception: ['reception', 'front desk'],
  housekeeping: ['housekeeping'],
  maintenance: ['maintenance'],
  restaurant: ['restaurant', 'kitchen'],
  bar: ['bar staff', 'bartender'],
  annex: ['annex'],
}

export function staffBelongsTo(member: { department?: string | null; role?: string | null }, department: Exclude<StaffDepartment, 'management'>) {
  const text = `${member.department ?? ''} ${member.role ?? ''}`.toLowerCase()
  return DEPARTMENT_KEYWORDS[department].some(word => text.includes(word))
}

/** Active staff of one department (used for both the emails and the notifications). */
export async function resolveDepartmentStaff(admin: SupabaseClient, department: Exclude<StaffDepartment, 'management'>): Promise<StaffRecipient[]> {
  const { data } = await admin.from('staff').select('user_id,email,name,department,role').eq('status', 'active')
  const seen = new Set<string>()
  const out: StaffRecipient[] = []
  for (const member of data ?? []) {
    if (!staffBelongsTo(member, department)) continue
    const email = String(member.email || '').trim().toLowerCase()
    const key = member.user_id || email
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push({ userId: member.user_id ?? null, email, name: String(member.name || '') })
  }
  return out
}

/** Managers and super admins (from the same role table the portal permissions use). */
export async function resolveManagement(admin: SupabaseClient): Promise<StaffRecipient[]> {
  const { data: roles } = await admin.from('user_roles').select('user_id,role').in('role', ['super_admin', 'manager'])
  const ids = Array.from(new Set((roles ?? []).map((row: any) => String(row.user_id))))
  if (!ids.length) return []
  const { data: profiles } = await admin.from('profiles').select('id,name,email').in('id', ids)
  return ids.map(id => {
    const profile = (profiles ?? []).find((p: any) => p.id === id)
    return { userId: id, email: String(profile?.email || '').trim().toLowerCase(), name: String(profile?.name || '') }
  })
}
