import { enqueueBackgroundEmail } from './backgroundJobs'
import { createSupabaseAdminClient } from './supabase/admin'

export async function dispatchNewsletterBatch() {
  const admin = createSupabaseAdminClient()
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
  const { data: recipients, error } = await admin.rpc('claim_newsletter_recipients', { p_dispatch_date: today, p_limit: 50 })
  if (error) throw error

  const outcomes = await Promise.all((recipients ?? []).map(async (recipient: any) => {
    try {
      const { id: jobId } = await enqueueBackgroundEmail({
        to: recipient.email,
        subject: recipient.subject,
        html: recipient.content_html,
        text: recipient.content_html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        queueKey: `newsletter:${recipient.id}`,
      })
      const { error: updateError } = await admin.from('newsletter_recipients').update({ status: 'queued', background_job_id: jobId, error: null }).eq('id', recipient.id)
      if (updateError) throw updateError
      return true
    } catch (error: any) {
      await admin.from('newsletter_recipients').update({ status: 'pending', error: String(error?.message || 'Unable to queue email').slice(0, 500) }).eq('id', recipient.id)
      console.error('[newsletter] recipient queue failed', recipient.id, error)
      return false
    }
  }))
  const queued = outcomes.filter(Boolean).length
  return { date: today, claimed: recipients?.length ?? 0, queued }
}
