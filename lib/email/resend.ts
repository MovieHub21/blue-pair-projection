const RESEND_API_URL = 'https://api.resend.com/emails'

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export async function sendResendEmail(input: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requiredEnv('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: requiredEnv('RESEND_FROM_EMAIL'),
      to: [input.to],
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
    }),
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    console.error('[resend] send failed', response.status, body)
    throw new Error('Unable to send email')
  }

  return body as { id?: string }
}
