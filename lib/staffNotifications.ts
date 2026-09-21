import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveDepartmentStaff, resolveManagement, type StaffDepartment } from './staffRecipients'

export type StaffNotificationInput = {
  /** Which departments should hear about this, and the page each one should open. */
  audiences: Array<{ department: Exclude<StaffDepartment, 'management'>; href: string }>
  type: string
  title: string
  body?: string
  metadata?: Record<string, unknown>
  /** Also tell managers and super admins (they oversee every department). */
  includeManagement?: boolean
  /** Page managers open; defaults to the first audience's page. */
  managementHref?: string
  /** Sending the same key twice creates each recipient's notification only once. */
  dedupeKey?: string
}

/**
 * Creates one notification per recipient. Never throws: a notification problem must not break the
 * payment, booking or room action that triggered it.
 */
export async function notifyStaff(admin: SupabaseClient, input: StaffNotificationInput) {
  try {
    const recipients = new Map<string, { department: StaffDepartment; href: string }>()
    for (const audience of input.audiences) {
      for (const member of await resolveDepartmentStaff(admin, audience.department)) {
        if (member.userId && !recipients.has(member.userId)) recipients.set(member.userId, audience)
      }
    }
    if (input.includeManagement !== false) {
      const href = input.managementHref ?? input.audiences[0]?.href ?? '/admin/dashboard'
      for (const manager of await resolveManagement(admin)) {
        if (manager.userId && !recipients.has(manager.userId)) recipients.set(manager.userId, { department: 'management', href })
      }
    }
    if (!recipients.size) return 0

    let userIds = Array.from(recipients.keys())
    if (input.dedupeKey) {
      const { data: existing } = await admin.from('staff_notifications').select('user_id').eq('metadata->>dedupe_key', input.dedupeKey).in('user_id', userIds)
      const already = new Set((existing ?? []).map((row: any) => row.user_id))
      userIds = userIds.filter(id => !already.has(id))
    }
    if (!userIds.length) return 0

    const rows = userIds.map(userId => {
      const target = recipients.get(userId)!
      return {
        user_id: userId,
        department: target.department,
        type: input.type,
        title: input.title,
        body: input.body ?? '',
        href: target.href,
        metadata: { ...(input.metadata ?? {}), ...(input.dedupeKey ? { dedupe_key: input.dedupeKey } : {}) },
      }
    })
    const { error } = await admin.from('staff_notifications').insert(rows)
    if (error) { console.error('[staff-notifications] insert failed', error.message); return 0 }
    return rows.length
  } catch (error) {
    console.error('[staff-notifications] failed', error)
    return 0
  }
}
