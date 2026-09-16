const MAX_BODY_BYTES = 256 * 1024
const MAX_STRING_LENGTH = 10_000

/**
 * Removes characters that can cause parser/control-character problems while
 * deliberately preserving normal punctuation and user-entered content.
 * HTML escaping is intentionally not done here because React/database fields
 * may legitimately contain markup or formatted text; output contexts must
 * escape/encode their own content.
 */
export function sanitizeInputString(value: string, maxLength = MAX_STRING_LENGTH): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeInput<T>(value: T): T {
  if (typeof value === 'string') return sanitizeInputString(value) as T
  if (Array.isArray(value)) return value.map(item => sanitizeInput(item)) as T
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[sanitizeInputString(key, 200)] = sanitizeInput(item)
    }
    return result as T
  }
  return value
}

export async function readSanitizedJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    throw new Error('REQUEST_BODY_TOO_LARGE')
  }

  const body = await request.json()
  return sanitizeInput(body) as T
}
