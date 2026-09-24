function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] as string))
}

function money(value: number) { return `₦${Number(value || 0).toLocaleString('en-NG')}` }
function layout(title: string, body: string) { return `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,
  sans-serif;color:#101a35"><div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #e8e3d8">
  <div style="background:#0b1633;padding:28px 32px;color:#fff"><h1 style="margin:0;font-size:25px;font-weight:600">
  ${escapeHtml(title)}</h1></div><div style="padding:32px">${body}</div><div style="padding:20px 32px;border-top:1px solid #eee;color:#777f91;font-size:12px">
  Blue Pair Hotel · Uromi, Edo State</div>
  </div></body></html>` }
function details(input: { reference?: string; roomName?: string; checkIn?: string; checkOut?: string; total?: number; 
  payment?: string }) { return `<div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
    <table style="width:100%;border-collapse:collapse;font-size:14px">${input.reference ? `<tr><td style="padding:6px 
      0;color:#777f91">Reference</td><td style="padding:6px 0;text-align:right;font-weight:700">${escapeHtml(input.reference)}</td></tr>` : ''}
      ${input.roomName ? `<tr><td style="padding:6px 0;color:#777f91">Room</td><td style="padding:6px 0;text-align:right;font-weight:600">
        ${escapeHtml(input.roomName)}</td></tr>` : ''}${input.checkIn ? `<tr><td style="padding:6px 0;color:#777f91">Check-in</td>
          <td style="padding:6px 0;text-align:right">${escapeHtml(input.checkIn)}</td></tr>` : ''}${input.checkOut ?
             `<tr><td style="padding:6px 0;color:#777f91">Check-out</td><td style="padding:6px 0;text-align:right">${escapeHtml(input.checkOut)}</td>
             </tr>` : ''}${input.total !== undefined ? `<tr><td style="padding:12px 0 6px;color:#777f91;border-top:1px solid #e5e1d7">
              Total</td><td style="padding:12px 0 6px;text-align:right;font-weight:700;border-top:1px solid #e5e1d7">${money(input.total)}
              </td></tr>` : ''}${input.payment ? `<tr><td style="padding:6px 0;color:#777f91">Payment</td><td style="padding:6px 0;text-align:right">
                ${escapeHtml(input.payment)}</td></tr>` : ''}</table></div>` }
function basic(name: string, title: string, message: string, extra = '', outro = 'We look forward to welcoming you.') 
{ const safeName = escapeHtml(name || 'Guest'); return { subject: `${title} | Blue Pair Hotel`, text: `Hello ${name || 
  'Guest'},\n\n${message}\n\n${outro}\n\nBlue Pair Hotel, Uromi.`, html: layout(title, `<p style="font-size:16px">Hello 
    ${safeName},</p><p style="color:#566079;line-height:1.7">${escapeHtml(message)}</p>${extra}<p style="margin-top:28px;color:#566079">${escapeHtml(outro)}</p>`) } }

export function bookingConfirmationEmail(input: { guestName:string; email:string; reference:string; roomName:string; 
  checkIn:string; checkOut:string; adults:number; children:number; total:number; paymentStatus:string }) 
{ const extra = details(input); return { subject: `Booking received — ${input.reference} | Blue Pair Hotel`, text: 
`Hello ${input.guestName || 'Guest'},\n\nYour booking request has been received.\nReference: 
${input.reference}\nRoom: ${input.roomName}\nCheck-in: ${input.checkIn}\nCheck-out:
${input.checkOut}\nGuests: ${input.adults} adults${input.children ? `, ${input.children} children` : ''}\nTotal: 
${money(input.total)}\nPayment: ${input.paymentStatus}\n\nBlue Pair Hotel, Uromi.`, html: layout('Booking received',
   `<p style="font-size:16px">Hello ${escapeHtml(input.guestName || 'Guest')},</p><p style="color:#566079;line-height:1.7">
   Thank you for choosing Blue Pair Hotel. We have received your booking request.</p>${extra}<p style="color:#566079;line-height:1.7">
   Payment is currently pending. Our front desk will follow up to confirm your reservation.</p>`) } }

   export function paymentSuccessfulEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string;total:number;paymentReference?:string}) 
{ return basic(input.guestName, 'Payment confirmed', 'Your payment has been successfully recorded and your reservation is confirmed.', 
  details({...input,payment:'Paid'}) + (input.paymentReference ? `<p style="color:#566079">Receipt: <strong>${escapeHtml(input.paymentReference)}</strong></p>` : '')) }

  export function paymentFailedEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string;total:number;reason?:string})
 { return basic(input.guestName, 'Payment requires attention', `We could not confirm the payment for booking ${input.reference}.${input.reason ? 
  ` Reason: ${input.reason}` : ''}`, details({...input,payment:'Payment not confirmed'})) }

  export function bookingCancelledEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string;total:number;reason?:string}) 
{ return basic(input.guestName, 'Booking cancelled', `Your booking ${input.reference} has been cancelled.${input.reason ? ` ${input.reason}` : ''}`,
   details(input), 'Thank you for considering Blue Pair Hotel. We appreciate your time and hope to assist you again whenever you need us.') }

   export function bookingModifiedEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string;total:number;changes?:string}) 
{ return basic(input.guestName, 'Booking updated', `Your booking ${input.reference} has been updated.${input.changes ? ` Changes: ${input.changes}` : ''}`, details(input)) }

export function preArrivalEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string}) 
{ return basic(input.guestName, 'Your stay is approaching', `We are looking forward to welcoming you for booking ${input.reference}. 
  Your check-in date is ${input.checkIn}. Please have your booking reference available at reception.`, details(input)) }

  export function checkInReminderEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string}) 
{ return basic(input.guestName, 'Check-in reminder', `This is a reminder that your Blue Pair Hotel stay begins on ${input.checkIn}.`, details(input)) }

export function checkInWelcomeEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string})
 { return basic(input.guestName, 'Welcome to Blue Pair Hotel', `Welcome. Your booking ${input.reference} 
  has been checked in. We hope you enjoy your stay.`, details(input)) }

  export function checkoutReminderEmail(input:{guestName:string;reference:string;roomName:string;checkOut:string}) 
{ return basic(input.guestName, 'Checkout reminder', `Your stay ends on ${input.checkOut}. 
  Please complete checkout with reception before leaving and ensure personal belongings are collected.`, details(input)) }

  export function checkoutThankYouEmail(input:{guestName:string;reference:string;roomName:string;checkIn:string;checkOut:string}) 
{ return basic(input.guestName, 'Thank you for staying with us', `Thank you for staying at Blue Pair Hotel. 
  Your booking ${input.reference} has been checked out successfully.`, details(input), 
  'Thank you for choosing Blue Pair Hotel. We wish to have the pleasure of hosting you again.') }

  export function reviewRequestEmail(input:{guestName:string;reference:string;reviewUrl?:string}) 
{ return basic(input.guestName, 'How was your stay?', `We would love to hear about your experience at Blue Pair Hotel.
   Your feedback helps us improve future stays.`, input.reviewUrl ? `<p><a href="${escapeHtml(input.reviewUrl)}" 
   style="display:inline-block;background:#0b1633;color:#fff;padding:12px 18px;text-decoration:none">Share your feedback</a></p>` : '') }

   export function serviceRequestReceivedEmail(input:{guestName:string;bookingRef:string;type:string;message:string}) 
{ return basic(input.guestName, 'Service request received', `We have received your ${input.type} request for booking 
  ${input.bookingRef}. Our team has been notified and will attend to it shortly.`, 
  `<div style="background:#f8f6f0;padding:16px;margin:20px 0"><strong>${escapeHtml(input.type)}</strong><p style="margin:8px 0;color:#566079">
  ${escapeHtml(input.message)}</p></div>`) }

  export function serviceRequestStatusEmail(input:{guestName:string;bookingRef:string;type:string;message:string;status:string}) 
{ return basic(input.guestName, `Service request ${input.status}`, `Your ${input.type} request for booking ${input.bookingRef}
   is now ${input.status}.`, `<div style="background:#f8f6f0;padding:16px;margin:20px 0;color:#566079">${escapeHtml(input.message)}</div>`) }

   export function supportTicketEmail(input:{guestName:string;reference:string;subject:string;message:string;status:string}) 
{ return basic(input.guestName, `Support request ${input.status}`, `Your support request ${input.reference} is now ${input.status}.`, 
  `<div style="background:#f8f6f0;padding:16px 20px;margin:20px 0"><strong>${escapeHtml(input.subject)}</strong>
  <p style="margin:8px 0;color:#566079">${escapeHtml(input.message)}</p></div>`) }

  export function announcementEmail(input:{guestName:string;title:string;message:string;offerUrl?:string}) 
{ return basic(input.guestName, input.title, input.message, input.offerUrl ? `<p><a href="${escapeHtml(input.offerUrl)}" 
style="color:#0b1633;font-weight:700">View details</a></p>` : '') }

export function reservationReadyEmail(input:{guestName:string;reference:string;roomNumber:string;paymentUrl:string}) {
  const extra = details({ reference: input.reference, roomName: `Room ${input.roomNumber}` }) + 
  `<p style="color:#566079;line-height:1.7">Your reserved room is now available. You can now choose your preferred stay dates and continue to payment.</p>
  <p style="margin:24px 0"><a href="${escapeHtml(input.paymentUrl)}" style="display:inline-block;background:#c79a3e;color:#0a1229;text-decoration:none;
  padding:12px 18px;border-radius:8px;font-weight:700">Choose dates &amp; continue</a></p><p style="font-size:13px;color:#667085">
  The room is not secured until payment is completed.</p>`
  return { subject: 'Your Blue Pair room is ready to secure', text: `Hello ${input.guestName || 
    'Guest'},\n\nYour reserved Room ${input.roomNumber} is now available. You can now choose your preferred stay dates and continue to payment.
     The room is not secured until payment is completed.\n\nReference: ${input.reference}\nOpen ${input.paymentUrl} to continue.\n\nBlue Pair Hotel, Uromi.`, 
     html: layout('Your room is ready to secure', `<p style="font-size:16px">Hello ${escapeHtml(input.guestName || 'Guest')},</p>
     <p style="color:#566079;line-height:1.7">Your reserved room is now ready for you to secure.</p>${extra}<p style="margin-top:28px;color:#566079">
     Once you select your dates, complete payment to secure the room.</p>`) }
}

export type AnnexOrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

type AnnexOrderItem = { name: string; kind: string; quantity: number; lineTotal: number }

const outletLabel = (outlet: string) => ({
  bar: 'Annex Bar',
  restaurant: 'Annex Restaurant',
  grilling: 'Annex Grilling',
  outdoor_eatery: 'Outdoor Eatery',
} as Record<string,string>)[outlet] || outlet.replaceAll('_', ' ')

export function annexOrderStatusEmail(input: {
  guestName: string; reference: string; status: AnnexOrderStatus; outlet: string; deliveryLabel: string; takeout: boolean; total: number; items: AnnexOrderItem[]
}) {
  const outletName = outletLabel(input.outlet)
  const service = input.takeout ? 'Takeaway / Delivery' : input.deliveryLabel
  const labels: Record<AnnexOrderStatus, { subject: string; title: string; message: string }> = {
    pending: { subject: 'Order received', title: 'Your order has been received', message: `We have received your ${outletName} order and the team has been notified.` },
    accepted: { subject: 'Order accepted', title: 'Your order has been accepted', message: `The ${outletName} team has accepted your order and will begin preparing it shortly.` },
    preparing: { subject: 'Your order is being prepared', title: 'Your order is being prepared', message: `The ${outletName} team is now preparing your order.` },
    ready: { subject: 'Your order is ready', title: 'Your order is ready', message: input.takeout ? 'Your order is ready and the team is arranging delivery to your selected location.' : `Your order is ready and the team is arranging delivery to ${input.deliveryLabel}.` },
    delivered: { subject: 'Order delivered', title: 'Your order has been delivered', message: `Your ${outletName} order has been marked as delivered. We hope you enjoy it.` },
    cancelled: { subject: 'Order cancelled', title: 'Your order has been cancelled', message: `Your ${outletName} order has been cancelled by the hotel team. Please contact the hotel if you need assistance.` },
  }
  const current = labels[input.status]
  const itemRows = input.items.map(item => `<tr><td style="padding:7px 0;color:#566079">${item.quantity} × ${escapeHtml(item.name)}</td><td style="padding:7px 0;text-align:right;font-weight:600">${money(item.lineTotal)}</td></tr>`).join('')
  const detailsHtml = `<div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0"><table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#777f91">Order reference</td><td style="padding:6px 0;text-align:right;font-weight:700">${escapeHtml(input.reference)}</td></tr>
    <tr><td style="padding:6px 0;color:#777f91">From</td><td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(outletName)}</td></tr>
    <tr><td style="padding:6px 0;color:#777f91">Service</td><td style="padding:6px 0;text-align:right;font-weight:600">${escapeHtml(service)}</td></tr>
    ${itemRows}
    <tr><td style="padding:12px 0 6px;border-top:1px solid #e5e1d7;color:#777f91">Total paid</td><td style="padding:12px 0 6px;border-top:1px solid #e5e1d7;text-align:right;font-weight:700">${money(input.total)}</td></tr>
  </table></div>`
  const itemText = input.items.map(item => `${item.quantity} × ${item.name} — ${money(item.lineTotal)}`).join('\n')
  return {
    subject: `${current.subject} — ${input.reference} | Blue Pair Hotel`,
    text: `Hello ${input.guestName || 'Guest'},\n\n${current.message}\n\nOrder: ${input.reference}\nFrom: ${outletName}\nService: ${service}\nStatus: ${current.title}\n\nItems:\n${itemText}\n\nTotal paid: ${money(input.total)}\n\nBlue Pair Hotel, Uromi.`,
    html: layout(current.title, `<p style="font-size:16px">Hello ${escapeHtml(input.guestName || 'Guest')},</p><p style="color:#566079;line-height:1.7">${escapeHtml(current.message)}</p>${detailsHtml}<p style="margin-top:28px;color:#566079;line-height:1.7">Your order status will continue to update in your guest dashboard.</p>`)
  }
}

export function annexOrderStaffEmail(input: {
  guestName: string; guestEmail: string; reference: string; outlet: string; deliveryLabel: string; takeout: boolean; total: number; contactPhone: string; deliveryAddress: string; notes: string; items: AnnexOrderItem[]
}) {
  const outletName = outletLabel(input.outlet)
  const service = input.takeout ? 'Takeaway / Delivery' : input.deliveryLabel
  const itemRows = input.items.map(item => `${item.quantity} × ${item.name} — ${money(item.lineTotal)}`).join('\n')
  return {
    subject: `New Annex order — ${input.reference} | ${outletName}`,
    text: `New paid Annex order\n\nReference: ${input.reference}\nOutlet: ${outletName}\nGuest: ${input.guestName}\nGuest email: ${input.guestEmail}\nService: ${service}\nPhone: ${input.contactPhone || '—'}\nAddress: ${input.deliveryAddress || '—'}\n\nItems:\n${itemRows}\n\nTotal paid: ${money(input.total)}\nNotes: ${input.notes || '—'}`,
    html: layout('New Annex order', `<p style="font-size:16px"><strong>New paid order received.</strong></p><p style="color:#566079;line-height:1.7">A guest has placed a new order that needs attention in the Annex order desk.</p><div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0"><p><strong>Reference:</strong> ${escapeHtml(input.reference)}</p><p><strong>Outlet:</strong> ${escapeHtml(outletName)}</p><p><strong>Guest:</strong> ${escapeHtml(input.guestName)}</p><p><strong>Guest email:</strong> ${escapeHtml(input.guestEmail || '—')}</p><p><strong>Service:</strong> ${escapeHtml(service)}</p><p><strong>Phone:</strong> ${escapeHtml(input.contactPhone || '—')}</p><p><strong>Address:</strong> ${escapeHtml(input.deliveryAddress || '—')}</p><p><strong>Total paid:</strong> ${money(input.total)}</p><p><strong>Notes:</strong> ${escapeHtml(input.notes || '—')}</p><hr style="border:0;border-top:1px solid #e5e1d7;margin:18px 0">${input.items.map(item => `<p style="margin:7px 0">${item.quantity} × ${escapeHtml(item.name)} — ${money(item.lineTotal)}</p>`).join('')}</div>`)
  }
}

export function eventReservationGuestEmail(input:{guestName:string;reservationId:string;eventTitle:
  string;eventDate:string;guestCount:number;status:string;staffNote?:string}) {
  const label = input.status === 'reserved' ? 'Reservation confirmed' : input.status === 'declined' ? 
  'Reservation update' : 'Reservation request received'
  const message = input.status === 'reserved' ? `Your spot for ${input.eventTitle} has been reserved.` :
   input.status === 'declined' ? `We could not reserve your requested spot for ${input.eventTitle}.` : 
   `We have received your request to reserve a spot for ${input.eventTitle}. Reception will review it and email you when your spot is reserved.`
  const extra = `<div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
  <p style="margin:0 0 8px"><strong>Event:</strong> ${escapeHtml(input.eventTitle)}</p><p style="margin:8px 0">
  <strong>Date:</strong> ${escapeHtml(input.eventDate)}</p><p style="margin:8px 0"><strong>Guests:</strong> 
  ${input.guestCount}</p><p style="margin:8px 0"><strong>Request ID:</strong> ${escapeHtml(input.reservationId)}</p>
  ${input.staffNote ? `<p style="margin:12px 0 0"><strong>Reception note:</strong> ${escapeHtml(input.staffNote)}</p>` : ''}</div>`
  return basic(input.guestName, label, message, extra)
}

export function eventReservationReceptionEmail(input:{guestName:string;guestEmail:string;guestPhone:string;
  reservationId:string;eventTitle:string;eventDate:string;guestCount:number;notes?:string}) {
  const extra = `<div style="background:#f8f6f0;border:1px solid #e9e4d8;padding:20px;margin:24px 0">
  <p><strong>Request:</strong> ${escapeHtml(input.reservationId)}</p><p><strong>Guest:</strong> 
  ${escapeHtml(input.guestName)}</p><p><strong>Email:</strong> ${escapeHtml(input.guestEmail)}</p><p>
  <strong>Phone:</strong> ${escapeHtml(input.guestPhone)}</p><p><strong>Event:</strong> ${escapeHtml
    (input.eventTitle)}</p><p><strong>Date:</strong> ${escapeHtml(input.eventDate)}</p><p><strong>
    Guests:</strong> ${input.guestCount}</p>${input.notes ? `<p><strong>Notes:</strong> ${escapeHtml(input.notes)}
    </p>` : ''}</div>`
  return { subject: `New event reservation request — ${input.eventTitle}`, text: `New reservation request 
  ${input.reservationId} from ${input.guestName} (${input.guestEmail}, ${input.guestPhone}) for ${input.eventTitle} 
  on ${input.eventDate}. Guests: ${input.guestCount}.`, html: layout('New event reservation request', 
    `<p style="color:#566079;line-height:1.7">A guest has requested a spot. Review it in the 
    reception/admin portal and mark it reserved or declined.</p>${extra}`) }
}

export function eventReservationStatusEmail(input:{guestName:string;reservationId:string;eventTitle:
  string;eventDate:string;guestCount:number;status:string;staffNote?:string}) { return eventReservationGuestEmail(input) }
