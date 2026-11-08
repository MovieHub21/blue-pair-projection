// Shared HTML, text, and booking-detail helpers used by the email templates.
function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }

  return value.replace(/[&<>'"]/g, char => entities[char])
}

function money(value: number) {
  return `₦${Number(value || 0).toLocaleString('en-NG')}`
}

function layout(title: string, body: string) {
  return `<!doctype html>
    <html>
      <body style="margin:0;background:#f6f3ec;font-family:Arial,sans-serif;color:#101a35">
        <div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #e8e3d8">
          <div style="background:#0b1633;padding:28px 32px;color:#fff">
            <h1 style="margin:0;font-size:25px;font-weight:600">${escapeHtml(title)}</h1>
          </div>
          <div style="padding:32px">${body}</div>
          <div style="padding:20px 32px;border-top:1px solid #eee;color:#777f91;font-size:12px">
            Blue Pair Signature Crown Hotel and Suite
          </div>
        </div>
      </body>
    </html>`
}

type EmailDetails = {
  reference?: string
  roomName?: string
  checkIn?: string
  checkOut?: string
  total?: number
  payment?: string
}

function details(input: EmailDetails) {
  const rows = [
    input.reference && `<tr>
      <td style="padding:6px 0;color:#777f91">Reference</td>
      <td style="padding:6px 0;text-align:right;font-weight:700">${escapeHtml(input.reference)}</td>
    </tr>`,
    input.roomName && `<tr>
      <td style="padding:6px 0;color:#777f91">Room</td>
      <td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(input.roomName)}</td>
    </tr>`,
    input.checkIn && `<tr>
      <td style="padding:6px 0;color:#777f91">Check-in</td>
      <td style="padding:6px 0;text-align:right">${escapeHtml(input.checkIn)}</td>
    </tr>`,
    input.checkOut && `<tr>
      <td style="padding:6px 0;color:#777f91">Check-out</td>
      <td style="padding:6px 0;text-align:right">${escapeHtml(input.checkOut)}</td>
    </tr>`,
    input.total !== undefined && `<tr>
      <td style="padding:12px 0 6px;color:#777f91;border-top:1px solid #e5e1d7">Total</td>
      <td style="padding:12px 0 6px;text-align:right;font-weight:700;border-top:1px solid #e5e1d7">${money(input.total)}</td>
    </tr>`,
    input.payment && `<tr>
      <td style="padding:6px 0;color:#777f91">Payment</td>
      <td style="padding:6px 0;text-align:right">${escapeHtml(input.payment)}</td>
    </tr>`,
  ].filter(Boolean).join('')

  return `<div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
  </div>`
}

function basic(
  name: string,
  title: string,
  message: string,
  extra = '',
  outro = 'We look forward to welcoming you.',
  extraText = '',
) {
  const guestName = name || 'Guest'
  const safeName = escapeHtml(guestName)
  const plainTextExtra = extraText ? `\n\n${extraText}` : ''

  return {
    subject: `${title} | Blue Pair Signature Crown Hotel and Suite`,
    text: `Hello ${guestName},\n\n${message}${plainTextExtra}\n\n${outro}\n\nBlue Pair Signature Crown Hotel and Suite.`,
    html: layout(title, `
      <p style="font-size:16px">Hello ${safeName},</p>
      <p style="color:#566079;line-height:1.7">${escapeHtml(message)}</p>
      ${extra}
      <p style="margin-top:28px;color:#566079">${escapeHtml(outro)}</p>
    `),
  }
}

// Booking and stay lifecycle emails.
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
  const guestName = input.guestName || 'Guest'
  const extra = details(input)

  return {
    subject: `Booking received — ${input.reference} `,
    text: [
      `Hello ${guestName},`,
      '',
      'Your booking request has been received.',
      `Reference: ${input.reference}`,
      `Room: ${input.roomName}`,
      `Check-in: ${input.checkIn}`,
      `Check-out: ${input.checkOut}`,
      `Guests: ${input.adults} adults${input.children ? `, ${input.children} children` : ''}`,
      `Total: ${money(input.total)}`,
      `Payment: ${input.paymentStatus}`,
      '',
      'Blue Pair Signature Crown Hotel and Suite.',
    ].join('\n'),
    html: layout('Booking received', `
      <p style="font-size:16px">Hello ${escapeHtml(guestName)},</p>
      <p style="color:#566079;line-height:1.7">Thank you for choosing Blue Pair Signature Crown Hotel and Suite. We have received your booking request.</p>
      ${extra}
      <p style="color:#566079;line-height:1.7">Payment is currently pending. Our front desk will follow up to confirm your reservation.</p>
    `),
  }
}

export function bookingPaymentHoldEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
  total: number
  holdMinutes: number
  expiresAt: string
  paymentUrl: string
}) {
  const guestName = input.guestName || 'Guest'
  const expiry = new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(input.expiresAt))
  const bookingDetails = details({
    reference: input.reference,
    roomName: input.roomName,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    total: input.total,
    payment: 'Payment required',
  })
  const holdNotice = [
    `We are holding this room for you for ${input.holdMinutes} minutes.`,
    `Complete payment by ${expiry} (Lagos time) to secure the booking.`,
    'If payment is not completed by then, the hold expires and the room may be offered to another guest.',
  ].join(' ')
  const paymentButton = `
    <p style="margin:24px 0;text-align:center">
      <a href="${escapeHtml(input.paymentUrl)}" style="display:inline-block;background:#c79a3e;color:#101a35;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:700">
        Continue to payment
      </a>
    </p>
  `
  const expiryNotice = `
    <div style="padding:16px 18px;margin:20px 0;background:#fff8e8;border:1px solid #ecd9a7;border-radius:10px;color:#6b4f00">
      <strong>Payment due within ${input.holdMinutes} minutes</strong><br />
      Complete payment by ${escapeHtml(expiry)} Lagos time. The room is not secured until payment is successful.
    </div>
  `

  return {
    subject: `Booking received — payment required within ${input.holdMinutes} minutes `,
    text: [
      `Hello ${guestName},`,
      '',
      'We have received your booking request.',
      holdNotice,
      '',
      `Reference: ${input.reference}`,
      `Room: ${input.roomName}`,
      `Check-in: ${input.checkIn}`,
      `Check-out: ${input.checkOut}`,
      `Total due: ${money(input.total)}`,
      `Continue to payment: ${input.paymentUrl}`,
      '',
      'Blue Pair Signature Crown Hotel and Suite.',
    ].join('\n'),
    html: layout('Booking received — payment required', `
      <p style="font-size:16px">Hello ${escapeHtml(guestName)},</p>
      <p style="color:#566079;line-height:1.7">We have received your booking request. Your selected room is available and being held for you while you complete payment.</p>
      ${expiryNotice}
      ${bookingDetails}
      ${paymentButton}
      <p style="color:#777f91;font-size:13px;line-height:1.6">Your reservation is confirmed only after payment is successful. If you have already paid, please allow a few moments for confirmation.</p>
    `),
  }
}

export function paymentSuccessfulEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
  total: number
  paymentReference?: string
}) {
  const bookingDetails = details({ ...input, payment: 'Paid' })
  const receipt = input.paymentReference
    ? `<p style="color:#566079">Receipt: <strong>${escapeHtml(input.paymentReference)}</strong></p>`
    : ''

  return basic(
    input.guestName,
    'Payment confirmed',
    'Your payment has been successfully recorded and your reservation is confirmed.',
    bookingDetails + receipt,
  )
}

export function paymentFailedEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
  total: number
  reason?: string
}) {
  const reason = input.reason ? ` Reason: ${input.reason}` : ''

  return basic(
    input.guestName,
    'Payment requires attention',
    `We could not confirm the payment for booking ${input.reference}.${reason}`,
    details({ ...input, payment: 'Payment not confirmed' }),
  )
}

export function bookingCancelledEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
  total: number
  reason?: string
}) {
  const reason = input.reason ? ` ${input.reason}` : ''

  return basic(
    input.guestName,
    'Booking cancelled',
    `Your booking ${input.reference} has been cancelled.${reason} If you have already paid, please contact Blue Pair Signature Crown Hotel and Suite directly to discuss your refund. Our team will review your payment and guide you on the next steps.`,
    details(input),
    'Thank you for considering Blue Pair Signature Crown Hotel and Suite. We appreciate your time and hope to assist you again whenever you need us.',
  )
}

export function bookingCancellationReceptionEmail(input: {
  guestName: string
  guestEmail: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
  total: number
  paymentStatus: string
}) {
  const guestDetails = `
    <div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:16px 20px;margin:20px 0">
      <p><strong>Guest:</strong> ${escapeHtml(input.guestName || 'Guest')}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.guestEmail || '—')}</p>
    </div>
  `

  return {
    subject: `Guest cancelled booking — ${input.reference} | Blue Pair Signature Crown Hotel and Suite`,
    text: [
      `${input.guestName || 'A guest'} cancelled booking ${input.reference}.`,
      '',
      `Guest email: ${input.guestEmail || '—'}`,
      `Room: ${input.roomName}`,
      `Check-in: ${input.checkIn}`,
      `Check-out: ${input.checkOut}`,
      `Total: ${money(input.total)}`,
      `Payment: ${input.paymentStatus}`,
      '',
      'Please follow up with the guest if a refund is due.',
    ].join('\n'),
    html: layout('Guest booking cancelled', `
      <p style="color:#566079;line-height:1.7">A guest has cancelled their booking. Please review the reservation and follow up if a refund is due.</p>
      ${guestDetails}
      ${details({
        reference: input.reference,
        roomName: input.roomName,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        total: input.total,
        payment: input.paymentStatus,
      })}
    `),
  }
}

export function preArrivalEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
}) {
  const message = `We are looking forward to welcoming you for booking ${input.reference}. \n  Your check-in date is ${input.checkIn}. Please have your booking reference available at reception.`

  return basic(input.guestName, 'Your stay is approaching', message, details(input))
}

export function checkInReminderEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
}) {
  const message = `This is a reminder that your Blue Pair Signature Crown Hotel and Suite stay begins on ${input.checkIn}.`

  return basic(input.guestName, 'Check-in reminder', message, details(input))
}

export function checkInWelcomeEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
}) {
  const message = `Welcome. Your booking ${input.reference} \n  has been checked in. We hope you enjoy your stay.`

  return basic(input.guestName, 'Welcome to Blue Pair Signature Crown Hotel and Suite', message, details(input))
}

export function checkoutReminderEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkOut: string
}) {
  const message = `Your stay ends on ${input.checkOut}. \n  Please complete checkout with reception before leaving and ensure personal belongings are collected.`

  return basic(input.guestName, 'Checkout reminder', message, details(input))
}

export function checkoutThankYouEmail(input: {
  guestName: string
  reference: string
  roomName: string
  checkIn: string
  checkOut: string
  reviewUrl?: string
}) {
  const message = `Thank you for staying at Blue Pair Signature Crown Hotel and Suite. Your booking ${input.reference} has been checked out successfully.`
  const reviewButton = input.reviewUrl
    ? `<p style="margin:24px 0"><a href="${escapeHtml(input.reviewUrl)}" style="display:inline-block;background:#0b1633;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:700">Rate us on Google</a></p>`
    : ''
  const reviewText = input.reviewUrl ? `Rate your stay on Google: ${input.reviewUrl}` : ''

  return basic(
    input.guestName,
    'Thank you for staying with us',
    message,
    details(input) + reviewButton,
    'Thank you for choosing Blue Pair Signature Crown Hotel and Suite. We wish to have the pleasure of hosting you again.',
    reviewText,
  )
}

export function reviewRequestEmail(input: {
  guestName: string
  reference: string
  reviewUrl?: string
}) {
  const message = `We would love to hear about your experience at Blue Pair Signature Crown Hotel and Suite.
   Your feedback helps us improve future stays.`
  const reviewButton = input.reviewUrl
    ? `<p><a href="${escapeHtml(input.reviewUrl)}" style="display:inline-block;background:#0b1633;color:#fff;padding:12px 18px;text-decoration:none">Share your feedback</a></p>`
    : ''

  return basic(input.guestName, 'How was your stay?', message, reviewButton)
}

export function serviceRequestReceivedEmail(input: {
  guestName: string
  bookingRef: string
  type: string
  message: string
}) {
  const message = `We have received your ${input.type} request for booking \n  ${input.bookingRef}. Our team has been notified and will attend to it shortly.`
  const requestDetails = `<div style="background:#f8f6f0;padding:16px;margin:20px 0">
    <strong>${escapeHtml(input.type)}</strong>
    <p style="margin:8px 0;color:#566079">${escapeHtml(input.message)}</p>
  </div>`

  return basic(input.guestName, 'Service request received', message, requestDetails)
}

export function serviceRequestStatusEmail(input: {
  guestName: string
  bookingRef: string
  type: string
  message: string
  status: string
}) {
  const statusMessage = `Your ${input.type} request for booking ${input.bookingRef}\n   is now ${input.status}.`
  const requestDetails = `<div style="background:#f8f6f0;padding:16px;margin:20px 0;color:#566079">
    ${escapeHtml(input.message)}
  </div>`

  return basic(input.guestName, `Service request ${input.status}`, statusMessage, requestDetails)
}

export function supportTicketEmail(input: {
  guestName: string
  reference: string
  subject: string
  message: string
  status: string
}) {
  const statusMessage = `Your support request ${input.reference} is now ${input.status}.`
  const ticketDetails = `<div style="background:#f8f6f0;padding:16px 20px;margin:20px 0">
    <strong>${escapeHtml(input.subject)}</strong>
    <p style="margin:8px 0;color:#566079">${escapeHtml(input.message)}</p>
  </div>`

  return basic(input.guestName, `Support request ${input.status}`, statusMessage, ticketDetails)
}

export function announcementEmail(input: {
  guestName: string
  title: string
  message: string
  offerUrl?: string
}) {
  const offerLink = input.offerUrl
    ? `<p><a href="${escapeHtml(input.offerUrl)}" style="color:#0b1633;font-weight:700">View details</a></p>`
    : ''

  return basic(input.guestName, input.title, input.message, offerLink)
}

export function reservationReadyEmail(input: {
  guestName: string
  reference: string
  roomNumber: string
  paymentUrl: string
}) {
  const bookingDetails = details({
    reference: input.reference,
    roomName: `Room ${input.roomNumber}`,
  })
  const availabilityMessage = '<p style="color:#566079;line-height:1.7">Your reserved room is now available. You can now choose your preferred stay dates and continue to payment.</p>'
  const paymentButton = `<p style="margin:24px 0"><a href="${escapeHtml(input.paymentUrl)}" style="display:inline-block;background:#c79a3e;color:#0a1229;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Choose dates &amp; continue</a></p>`
  const paymentNotice = '<p style="font-size:13px;color:#667085">The room is not secured until payment is completed.</p>'
  const extra = bookingDetails + availabilityMessage + paymentButton + paymentNotice

  return {
    subject: 'Your Blue Pair room is ready to secure',
    text: `Hello ${input.guestName || 'Guest'},\n\nYour reserved Room ${input.roomNumber} is now available. You can now choose your preferred stay dates and continue to payment.\n     The room is not secured until payment is completed.\n\nReference: ${input.reference}\nOpen ${input.paymentUrl} to continue.\n\nBlue Pair Signature Crown Hotel and Suite.`,
    html: layout('Your room is ready to secure', `
      <p style="font-size:16px">Hello ${escapeHtml(input.guestName || 'Guest')},</p>
      <p style="color:#566079;line-height:1.7">Your reserved room is now ready for you to secure.</p>
      ${extra}
      <p style="margin-top:28px;color:#566079">Once you select your dates, complete payment to secure the room.</p>
    `),
  }
}

// Annex order emails.
export type AnnexOrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

type AnnexOrderItem = {
  name: string
  kind: string
  quantity: number
  lineTotal: number
}

const OUTLET_LABELS: Record<string, string> = {
  bar: 'Annex Bar',
  restaurant: 'Annex Restaurant',
  grilling: 'Annex Grilling',
  outdoor_eatery: 'Outdoor Eatery',
}

function outletLabel(outlet: string) {
  return OUTLET_LABELS[outlet] || outlet.replaceAll('_', ' ')
}

export function annexOrderStatusEmail(input: {
  guestName: string
  reference: string
  status: AnnexOrderStatus
  outlet: string
  deliveryLabel: string
  takeout: boolean
  total: number
  items: AnnexOrderItem[]
}) {
  const outletName = outletLabel(input.outlet)
  const service = input.takeout ? 'Takeaway / Delivery' : input.deliveryLabel
  const labels: Record<AnnexOrderStatus, {subject: string; title: string; message: string}> = {
    pending: {
      subject: 'Order received',
      title: 'Your order has been received',
      message: `We have received your ${outletName} order and the team has been notified.`,
    },
    accepted: {
      subject: 'Order accepted',
      title: 'Your order has been accepted',
      message: `The ${outletName} team has accepted your order and will begin preparing it shortly.`,
    },
    preparing: {
      subject: 'Your order is being prepared',
      title: 'Your order is being prepared',
      message: `The ${outletName} team is now preparing your order.`,
    },
    ready: {
      subject: 'Your order is ready',
      title: 'Your order is ready',
      message: input.takeout
        ? 'Your order is ready and the team is arranging delivery to your selected location.'
        : `Your order is ready and the team is arranging delivery to ${input.deliveryLabel}.`,
    },
    delivered: {
      subject: 'Order delivered',
      title: 'Your order has been delivered',
      message: `Your ${outletName} order has been marked as delivered. We hope you enjoy it.`,
    },
    cancelled: {
      subject: 'Order cancelled',
      title: 'Your order has been cancelled',
      message: `Your ${outletName} order has been cancelled by the hotel team. Please contact the hotel if you need assistance.`,
    },
  }
  const current = labels[input.status]
  const itemRows = input.items.map(item => `
    <tr>
      <td style="padding:7px 0;color:#566079">${item.quantity} × ${escapeHtml(item.name)}</td>
      <td style="padding:7px 0;text-align:right;font-weight:600">${money(item.lineTotal)}</td>
    </tr>
  `).join('')
  const detailsHtml = `
    <div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr>
          <td style="padding:6px 0;color:#777f91">Order reference</td>
          <td style="padding:6px 0;text-align:right;font-weight:700">${escapeHtml(input.reference)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#777f91">From</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(outletName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#777f91">Service</td>
          <td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(service)}</td>
        </tr>
        ${itemRows}
        <tr>
          <td style="padding:12px 0 6px;border-top:1px solid #e5e1d7;color:#777f91">Total paid</td>
          <td style="padding:12px 0 6px;border-top:1px solid #e5e1d7;text-align:right;font-weight:700">${money(input.total)}</td>
        </tr>
      </table>
    </div>
  `
  const itemText = input.items.map(item => `${item.quantity} × ${item.name} — ${money(item.lineTotal)}`).join('\n')

  return {
    subject: `${current.subject} — ${input.reference} | `,
    text: [
      `Hello ${input.guestName || 'Guest'},`,
      '',
      current.message,
      '',
      `Order: ${input.reference}`,
      `From: ${outletName}`,
      `Service: ${service}`,
      `Status: ${current.title}`,
      '',
      'Items:',
      itemText,
      '',
      `Total paid: ${money(input.total)}`,
      '',
      'Blue Pair Signature Crown Hotel and Suite.',
    ].join('\n'),
    html: layout(current.title, `
      <p style="font-size:16px">Hello ${escapeHtml(input.guestName || 'Guest')},</p>
      <p style="color:#566079;line-height:1.7">${escapeHtml(current.message)}</p>
      ${detailsHtml}
      <p style="margin-top:28px;color:#566079;line-height:1.7">Your order status will continue to update in your guest dashboard.</p>
    `),
  }
}

export function annexOrderStaffEmail(input: {
  guestName: string
  guestEmail: string
  reference: string
  outlet: string
  deliveryLabel: string
  takeout: boolean
  total: number
  contactPhone: string
  deliveryAddress: string
  notes: string
  items: AnnexOrderItem[]
}) {
  const outletName = outletLabel(input.outlet)
  const service = input.takeout ? 'Takeaway / Delivery' : input.deliveryLabel
  const itemRows = input.items.map(item => `${item.quantity} × ${item.name} — ${money(item.lineTotal)}`).join('\n')
  const htmlItemRows = input.items.map(item => `
    <p style="margin:7px 0">${item.quantity} × ${escapeHtml(item.name)} — ${money(item.lineTotal)}</p>
  `).join('')
  const detailsHtml = `
    <div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
      <p><strong>Reference:</strong> ${escapeHtml(input.reference)}</p>
      <p><strong>Outlet:</strong> ${escapeHtml(outletName)}</p>
      <p><strong>Guest:</strong> ${escapeHtml(input.guestName)}</p>
      <p><strong>Guest email:</strong> ${escapeHtml(input.guestEmail || '—')}</p>
      <p><strong>Service:</strong> ${escapeHtml(service)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(input.contactPhone || '—')}</p>
      <p><strong>Address:</strong> ${escapeHtml(input.deliveryAddress || '—')}</p>
      <p><strong>Total paid:</strong> ${money(input.total)}</p>
      <p><strong>Notes:</strong> ${escapeHtml(input.notes || '—')}</p>
      <hr style="border:0;border-top:1px solid #e5e1d7;margin:18px 0" />
      ${htmlItemRows}
    </div>
  `

  return {
    subject: `New Annex order — ${input.reference} | ${outletName}`,
    text: [
      'New paid Annex order',
      '',
      `Reference: ${input.reference}`,
      `Outlet: ${outletName}`,
      `Guest: ${input.guestName}`,
      `Guest email: ${input.guestEmail}`,
      `Service: ${service}`,
      `Phone: ${input.contactPhone || '—'}`,
      `Address: ${input.deliveryAddress || '—'}`,
      '',
      'Items:',
      itemRows,
      '',
      `Total paid: ${money(input.total)}`,
      `Notes: ${input.notes || '—'}`,
    ].join('\n'),
    html: layout('New Annex order', `
      <p style="font-size:16px"><strong>New paid order received.</strong></p>
      <p style="color:#566079;line-height:1.7">A guest has placed a new order that needs attention in the Annex order desk.</p>
      ${detailsHtml}
    `),
  }
}

// Event reservation emails.
export function eventReservationGuestEmail(input: {
  guestName: string
  reservationId: string
  eventTitle: string
  eventDate: string
  guestCount: number
  status: string
  staffNote?: string
}) {
  let label = 'Reservation request received'
  let message = `We have received your request to reserve a spot for ${input.eventTitle}. Reception will review it and email you when your spot is reserved.`

  if (input.status === 'reserved') {
    label = 'Reservation confirmed'
    message = `Your spot for ${input.eventTitle} has been reserved.`
  } else if (input.status === 'declined') {
    label = 'Reservation update'
    message = `We could not reserve your requested spot for ${input.eventTitle}.`
  }

  const receptionNote = input.staffNote
    ? `<p style="margin:12px 0 0"><strong>Reception note:</strong> ${escapeHtml(input.staffNote)}</p>`
    : ''
  const extra = `
    <div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
      <p style="margin:0 0 8px"><strong>Event:</strong> ${escapeHtml(input.eventTitle)}</p>
      <p style="margin:8px 0"><strong>Date:</strong> ${escapeHtml(input.eventDate)}</p>
      <p style="margin:8px 0"><strong>Guests:</strong> ${input.guestCount}</p>
      <p style="margin:8px 0"><strong>Request ID:</strong> ${escapeHtml(input.reservationId)}</p>
      ${receptionNote}
    </div>
  `

  return basic(input.guestName, label, message, extra)
}

export function eventReservationReceptionEmail(input: {
  guestName: string
  guestEmail: string
  guestPhone: string
  reservationId: string
  eventTitle: string
  eventDate: string
  guestCount: number
  notes?: string
}) {
  const notes = input.notes ? `<p><strong>Notes:</strong> ${escapeHtml(input.notes)}</p>` : ''
  const extra = `
    <div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
      <p><strong>Request:</strong> ${escapeHtml(input.reservationId)}</p>
      <p><strong>Guest:</strong> ${escapeHtml(input.guestName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(input.guestEmail)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(input.guestPhone)}</p>
      <p><strong>Event:</strong> ${escapeHtml(input.eventTitle)}</p>
      <p><strong>Date:</strong> ${escapeHtml(input.eventDate)}</p>
      <p><strong>Guests:</strong> ${input.guestCount}</p>
      ${notes}
    </div>
  `

  return {
    subject: `New event reservation request — ${input.eventTitle}`,
    text: `New reservation request \n  ${input.reservationId} from ${input.guestName} (${input.guestEmail}, ${input.guestPhone}) for ${input.eventTitle} \n  on ${input.eventDate}. Guests: ${input.guestCount}.`,
    html: layout('New event reservation request', `
      <p style="color:#566079;line-height:1.7">A guest has requested a spot. Review it in the reception/admin portal and mark it reserved or declined.</p>
      ${extra}
    `),
  }
}

export function eventReservationStatusEmail(input: {
  guestName: string
  reservationId: string
  eventTitle: string
  eventDate: string
  guestCount: number
  status: string
  staffNote?: string
}) {
  return eventReservationGuestEmail(input)
}
