import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveDepartmentStaff } from './staffRecipients'
import { notifyStaff } from './staffNotifications'
import { sendResendEmail } from './email/resend'

const departmentPage = {
  housekeeping: '/admin/housekeeping/tasks',
  maintenance: '/admin/maintenance/tickets',
} as const

export async function notifyRoomTask(input: {
  admin: SupabaseClient
  department: keyof typeof departmentPage
  subject: string
  html: string
  text: string
  dedupeKey: string
}) {
  const recipients = await resolveDepartmentStaff(input.admin, input.department)
  await Promise.all(recipients.filter(member => member.email).map(member =>
    sendResendEmail({
      to: member.email,
      subject: input.subject,
      html: input.html,
      text: input.text,
      idempotencyKey: `${input.dedupeKey}:${member.email}`,
    }).catch(error => {
      console.error(`[room-task-email] ${input.department} notification failed`, error)
      return null
    })
  ))
  await notifyStaff(input.admin, {
    audiences: [{ department: input.department, href: departmentPage[input.department] }],
    type: input.department,
    title: input.subject,
    body: input.text,
    dedupeKey: input.dedupeKey,
  })
  return recipients.length
}
