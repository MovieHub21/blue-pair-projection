function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] as string))
}

function money(value: number) {
  return `₦${value.toLocaleString('en-NG')}`
}

export function bookingConfirmationEmail(input: {
  guestName: string
  email: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  total: number
  paymentStatus: string
}) {
  const name = escapeHtml(input.guestName || 'Guest')
  const room = escapeHtml(input.roomName)
  const reference = escapeHtml(input.reference)
  const payment = escapeHtml(input.paymentStatus)

  return {
    subject: `Booking received — ${input.reference} | Blue Pair Hotel`,
    text: `Hello ${input.guestName || 'Guest'},\n\nYour booking request has been received by Blue Pair Hotel.\n\nBooking reference: ${input.reference}\nRoom: ${input.roomName}\nCheck-in: ${input.checkIn}\nCheck-out: ${input.checkOut}\nGuests: ${input.adults} adults${input.children ? `, ${input.children} children` : ''}\nTotal: ${money(input.total)}\nPayment: ${input.paymentStatus}\n\nOur front desk will follow up regarding payment confirmation.\n\nBlue Pair Hotel, Uromi.`,
    html: `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,sans-serif;color:#101a35"><div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #e8e3d8"><div style="background:#0b1633;padding:28px 32px;color:#fff"><div style="font-size:11px;letter-spacing:3px;color:#d7ae52;font-weight:700">BLUE PAIR HOTEL</div><h1 style="margin:12px 0 0;font-size:25px;font-weight:600">Booking received</h1></div><div style="padding:32px"><p style="font-size:16px">Hello ${name},</p><p style="color:#566079;line-height:1.7">Thank you for choosing Blue Pair Hotel. We have received your booking request and reserved the details below for our front desk team.</p><div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0"><div style="font-size:11px;color:#8a8f9d;text-transform:uppercase;letter-spacing:1px">Booking reference</div><div style="font-size:22px;font-weight:700;margin-top:6px">${reference}</div><hr style="border:0;border-top:1px solid #e5e1d7;margin:18px 0"><table style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:6px 0;color:#777f91">Room</td><td style="padding:6px 0;text-align:right;font-weight:600">${room}</td></tr><tr><td style="padding:6px 0;color:#777f91">Check-in</td><td style="padding:6px 0;text-align:right">${escapeHtml(input.checkIn)}</td></tr><tr><td style="padding:6px 0;color:#777f91">Check-out</td><td style="padding:6px 0;text-align:right">${escapeHtml(input.checkOut)}</td></tr><tr><td style="padding:6px 0;color:#777f91">Guests</td><td style="padding:6px 0;text-align:right">${input.adults} adults${input.children ? `, ${input.children} children` : ''}</td></tr><tr><td style="padding:12px 0 6px;color:#777f91;border-top:1px solid #e5e1d7">Total</td><td style="padding:12px 0 6px;text-align:right;font-weight:700;border-top:1px solid #e5e1d7">${money(input.total)}</td></tr><tr><td style="padding:6px 0;color:#777f91">Payment</td><td style="padding:6px 0;text-align:right">${payment}</td></tr></table></div><p style="color:#566079;line-height:1.7">Payment is currently pending. Our front desk will contact you to confirm payment and finalize your reservation.</p><p style="margin-top:28px;color:#566079">We look forward to welcoming you.</p><p style="font-weight:700">Blue Pair Hotel<br><span style="font-weight:400;color:#777f91">Uromi, Edo State</span></p></div></div></body></html>`,
  }
}
