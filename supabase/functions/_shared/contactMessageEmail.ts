export type ContactMessageRecipientType = 'guest' | 'staff'

export function contactMessageEmail(input: {
  recipientName?: string | null
  recipientType: ContactMessageRecipientType
  guestNeedsAccount?: boolean
  guestEmailType?: 'received' | 'reply'
  conversationUrl: string
}) {
  const safeName = escapeHtml(String(input.recipientName || (input.recipientType === 'guest' ? 'Guest' : 'Team')))
  const safeUrl = escapeHtml(input.conversationUrl)
  const guestReceipt = input.guestNeedsAccount
    ? 'Your message has been received. Create a guest account using the same address you used to contact us, then open your Blue Pair Signature conversation to read and reply.'
    : 'Your message has been received. Open your Blue Pair Signature conversation to read and reply.'
  const text = input.recipientType === 'guest'
    ? input.guestEmailType === 'received'
      ? guestReceipt
      : 'You have a new reply from the Blue Pair team. Open your conversation to read it and reply.'
    : 'A guest has sent a new message. Open the Blue Pair Signature conversation to read and reply.'
  const htmlText = escapeHtml(text)
  const title = input.recipientType === 'guest' && input.guestEmailType !== 'received' ? 'New reply' : 'New message'

  return {
    subject: `${title} | Blue Pair Signature`,
    text: `Hello ${String(input.recipientName || (input.recipientType === 'guest' ? 'Guest' : 'Team'))},\n\n${text}\n\nOpen conversation: ${input.conversationUrl}\n\nBlue Pair Signature`,
    html: `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,sans-serif;color:#101a35"><div style="max-width:620px;margin:32px auto;background:#fff;border:1px solid #e8e3d8"><div style="background:#0b1633;padding:28px 32px;color:#fff"><h1 style="margin:0;font-size:25px;font-weight:600">${title}</h1></div><div style="padding:32px"><p style="font-size:16px">Hello ${safeName},</p><p style="color:#566079;line-height:1.7">${htmlText}</p><p style="margin:24px 0"><a href="${safeUrl}" style="display:inline-block;background:#0b1633;color:#fff;padding:12px 18px;text-decoration:none;border-radius:8px;font-weight:700">Open conversation</a></p></div><div style="padding:20px 32px;border-top:1px solid #eee;color:#777f91;font-size:12px">Blue Pair Signature · Uromi, Edo State</div></div></body></html>`,
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)
}
