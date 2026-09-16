import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { sendResendEmail } from '../../../../lib/email/resend'
import { SITE_URL } from '../../../../lib/siteConfig'
import { readSanitizedJson } from '../../../../lib/security/input'

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] as string))
}

export async function POST(request: Request) {
  try {
    const { email } = await readSanitizedJson<{ email?: unknown }>(request)
    const normalizedEmail = String(email || '').trim().toLowerCase()
    if (!normalizedEmail) return NextResponse.json({ error: 'Enter your email address.' }, { status: 400 })

    const admin = createSupabaseAdminClient()
    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo: `${SITE_URL}/auth/callback?next=/account/reset-password` },
    })

    if (error) console.warn('[forgot-password] generateLink', error.message)
    if (data?.properties?.action_link) {
      const actionLink = data.properties.action_link
      const html = `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,sans-serif;color:#101a35"><div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #e8e3d8"><div style="background:#0b1633;padding:28px 32px;color:#fff"><div style="font-size:11px;letter-spacing:3px;color:#d7ae52;font-weight:700">BLUE PAIR HOTEL</div><h1 style="margin:12px 0 0;font-size:25px;font-weight:600">Reset your password</h1></div><div style="padding:32px"><p style="font-size:16px">Hello Guest,</p><p style="color:#566079;line-height:1.7">We received a request to reset the password for your Blue Pair guest account. Use the button below to choose a new password.</p><p style="margin:28px 0"><a href="${escapeHtml(actionLink)}" style="display:inline-block;background:#0b1633;color:#fff;padding:13px 20px;text-decoration:none;border-radius:8px;font-weight:700">Reset password</a></p><p style="color:#777f91;font-size:13px;line-height:1.6">If you did not request this, you can safely ignore this email. The reset link is temporary and can only be used once.</p></div><div style="padding:20px 32px;border-top:1px solid #eee;color:#777f91;font-size:12px">Blue Pair Hotel · Uromi, Edo State</div></div></body></html>`
      await sendResendEmail({
        to: normalizedEmail,
        subject: 'Reset your password | Blue Pair Hotel',
        html,
        text: `Reset your Blue Pair guest account password: ${actionLink}\n\nIf you did not request this, ignore this email.`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[forgot-password] failed', error)
    return NextResponse.json({ ok: true })
  }
}
