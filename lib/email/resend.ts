import { SITE_URL } from '../siteConfig'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FALLBACK_LOGO_URL = 'https://raw.githubusercontent.com/MovieHub21/blue-pair-projection/main/public/icon-192.png'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function addBrandLogo(html: string) {
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '')
  const logoUrl = configuredSite ? `${configuredSite}/icon-192.png` : FALLBACK_LOGO_URL
  const logo = `<div style="text-align:center;padding:0 0 20px"><img src="${logoUrl}" width="76" height="76" alt="Blue Pair Hotel" style="display:inline-block;width:76px;height:76px;border-radius:16px;object-fit:cover;border:0" /></div>`
  return html.replace(/(<body[^>]*>)/i, `$1${logo}`)
}

function addBookingAccountCta(html: string, text: string | undefined, subject: string, includeAccountCta: boolean) {
  if (!includeAccountCta || !subject.toLowerCase().includes('payment confirmed')) return { html, text }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || SITE_URL).replace(/\/$/, '')
  const ctaHtml = `<div style="margin:28px 0 4px;padding:20px;background:#f8f6f0;border:1px solid #e9e4d8;border-radius:12px"><p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#101a35">Keep track of your booking online</p><p style="margin:0 0 14px;color:#566079;line-height:1.7">You can create a guest account with this same email address to view your booking, payment and stay updates online.</p><p style="margin:0"><a href="${siteUrl}/account/register" style="display:inline-block;background:#0b1633;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:700">Create your guest account</a></p><p style="margin:12px 0 0;color:#777f91;font-size:12px">${siteUrl}</p></div>`
  const ctaText = `\n\nKeep track of your booking online:\nCreate a guest account with this same email address to view your booking, payment and stay updates: ${siteUrl}/account/register\n`

  return {
    html: html.replace(/(<div[^>]*padding:32px[^>]*>)/i, `$1${ctaHtml}`),
    text: `${text || ''}${ctaText}`,
  }
}

export async function sendResendEmail(input: { to: string; subject: string; html: string; text?: string; includeAccountCta?: boolean; idempotencyKey?: string }) {
  const bookingAccountCta = addBookingAccountCta(input.html, input.text, input.subject, input.includeAccountCta !== false)
  const response = await fetch(RESEND_API_URL, { method: 'POST', headers: { Authorization: `Bearer ${requiredEnv('RESEND_API_KEY')}`, 'Content-Type': 'application/json', ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey } : {}) }, body: JSON.stringify({ from: requiredEnv('RESEND_FROM_EMAIL'), to: [input.to], subject: input.subject, html: addBrandLogo(bookingAccountCta.html), ...(bookingAccountCta.text ? { text: bookingAccountCta.text } : {}) }), cache: 'no-store' })
  const body = await response.json().catch(() => null)
  if (!response.ok) { console.error('[resend] send failed', response.status, body); throw new Error('Unable to send email') }
  return body as { id?: string }
}
