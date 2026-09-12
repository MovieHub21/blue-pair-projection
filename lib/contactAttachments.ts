import { createSupabaseAdminClient } from './supabase/admin'

export const MAX_CONTACT_ATTACHMENT_BYTES = 15 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
])

export function validateContactAttachment(file: File) {
  if (!file || !file.name) return 'Please choose a file.'
  if (file.size <= 0) return 'The selected file is empty.'
  if (file.size > MAX_CONTACT_ATTACHMENT_BYTES) return 'Attachments must be 15 MB or smaller.'
  if (!ALLOWED_MIME_TYPES.has(file.type)) return 'That file type is not supported. Images, PDF, Office documents, ZIP and text files are supported.'
  return null
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'attachment'
}

export async function uploadContactAttachment(file: File, conversationId: string, senderType: 'guest' | 'staff') {
  const validationError = validateContactAttachment(file)
  if (validationError) throw new Error(validationError)

  const admin = createSupabaseAdminClient()
  const path = `${conversationId}/${senderType}/${crypto.randomUUID()}-${safeFileName(file.name)}`
  const { error } = await admin.storage.from('contact-attachments').upload(path, await file.arrayBuffer(), {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })
  if (error) throw error

  return {
    attachment_path: path,
    attachment_name: file.name,
    attachment_mime_type: file.type || 'application/octet-stream',
    attachment_size: file.size,
  }
}

export async function withContactAttachmentUrls<T extends { attachment_path?: string | null }>(messages: T[]) {
  const admin = createSupabaseAdminClient()
  return Promise.all(messages.map(async message => {
    if (!message.attachment_path) return { ...message, attachment_url: null }
    const { data } = await admin.storage.from('contact-attachments').createSignedUrl(message.attachment_path, 60 * 60)
    return { ...message, attachment_url: data?.signedUrl || null }
  }))
}
