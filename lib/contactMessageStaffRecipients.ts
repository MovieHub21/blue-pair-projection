import type { SupabaseClient } from '@supabase/supabase-js'
import { canAccessContactMessages } from '../supabase/functions/_shared/contactMessageAccess'

export type ContactMessageStaffRecipient = { userId: string; name: string; email: string }

export async function resolveContactMessageStaffRecipients(admin: SupabaseClient): Promise<ContactMessageStaffRecipient[]> {
  const [{ data: roleRows, error: roleError }, { data: permissionRows, error: permissionError }] = await Promise.all([
    admin.from('user_roles').select('user_id,role'),
    admin.from('role_permissions').select('role,section,allowed').eq('section', 'reception'),
  ])
  if (roleError) throw roleError
  if (permissionError) throw permissionError

  const rolesByUser = new Map<string, string[]>()
  for (const row of roleRows ?? []) {
    const userId = String(row.user_id || '')
    if (!userId) continue
    rolesByUser.set(userId, [...(rolesByUser.get(userId) ?? []), String(row.role)])
  }
  const eligibleIds = [...rolesByUser.entries()]
    .filter(([, roles]) => canAccessContactMessages(roles, permissionRows ?? []))
    .map(([userId]) => userId)
  if (!eligibleIds.length) return []

  const [{ data: profiles, error: profileError }, { data: staffRows, error: staffError }] = await Promise.all([
    admin.from('profiles').select('id,name,email').in('id', eligibleIds),
    admin.from('staff').select('user_id,name,email').in('user_id', eligibleIds),
  ])
  if (profileError) throw profileError
  if (staffError) throw staffError

  const byEmail = new Map<string, ContactMessageStaffRecipient>()
  for (const userId of eligibleIds) {
    const profile = (profiles ?? []).find((row: any) => row.id === userId)
    const staff = (staffRows ?? []).find((row: any) => row.user_id === userId)
    const email = String(profile?.email || staff?.email || '').trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) continue
    byEmail.set(email, { userId, name: String(profile?.name || staff?.name || 'Team'), email })
  }
  return [...byEmail.values()]
}