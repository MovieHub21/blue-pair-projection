import { NextResponse } from 'next/server'
import { sendResendEmail } from '../../../../lib/email/resend'
import { bookingConfirmationEmail } from '../../../../lib/email/templates'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const required = ['guestEmail', 'guestName', 'reference', 'roomName', 'checkIn', 'checkOut', 'total']

    if (required.some(key => body[key] === undefined || body[key] === null || body[key] === '')) {
      return NextResponse.json({ error: 'Missing booking email data' }, { status: 400 })
    }

    const email = bookingConfirmationEmail({
      guestName: String(body.guestName),
      email: String(body.guestEmail),
      reference: String(body.reference),
      roomName: String(body.roomName),
      checkIn: String(body.checkIn),
      checkOut: String(body.checkOut),
      adults: Number(body.adults ?? 1),
      children: Number(body.children ?? 0),
      total: Number(body.total),
      paymentStatus: String(body.paymentStatus ?? 'pending'),
    })

    const result = await sendResendEmail({
      to: String(body.guestEmail),
      subject: email.subject,
      html: email.html,
      text: email.text,
    })

    return NextResponse.json({ ok: true, id: result.id ?? null })
  } catch (error) {
    console.error('[booking-confirmation] failed', error)
    return NextResponse.json({ error: 'Unable to send booking confirmation email' }, { status: 500 })
  }
}
