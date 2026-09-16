const MAX_BODY_BYTES = 256 * 1024
const MAX_STRING_LENGTH = 10_000

/**
 * Removes control characters that can cause parser/logging problems while
 * preserving normal punctuation and user-entered content.
 */
export function sanitizeInputString(value: string, maxLength = MAX_STRING_LENGTH): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, maxLength)
}

export function sanitizeInput<T>(value: T): T {
  if (typeof value === 'string') return sanitizeInputString(value) as T
  if (Array.isArray(value)) return value.map(item => sanitizeInput(item)) as T
  if (value && typeof value === 'object') {
    const result = Object.create(null) as Record<string, unknown>
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[sanitizeInputString(key, 200)] = sanitizeInput(item)
    }
    return result as T
  }
  return value
}

/** Reads JSON through a bounded text buffer so Content-Length cannot be used
 * to bypass the body-size limit. */
export async function readSanitizedJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number.isFinite(Number(contentLength)) && Number(contentLength) > MAX_BODY_BYTES) {
    throw new Error('REQUEST_BODY_TOO_LARGE')
  }

  const raw = await request.text()
  const byteLength = new TextEncoder().encode(raw).byteLength
  if (byteLength > MAX_BODY_BYTES) throw new Error('REQUEST_BODY_TOO_LARGE')

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    throw new Error('INVALID_JSON')
  }
  return sanitizeInput(body) as T
}
