const placeholderWords = /\b(?:test|sample|dummy|placeholder|lorem|asdf|qwerty|xxx)\b/i

/** Hide obvious seed/test names from public listings while keeping CMS records editable. */
export function hasPublicListingName(value: string | null | undefined): boolean {
  const name = value?.trim()
  if (!name || placeholderWords.test(name)) return false

  const compact = name.replace(/[\s\W_]+/g, '')
  if (!compact || /^\d+$/.test(compact) || /^(.)\1{2,}$/i.test(compact)) return false

  const letters = compact.match(/[a-z]/gi)?.length ?? 0
  const vowels = compact.match(/[aeiou]/gi)?.length ?? 0
  if (letters >= 14 && vowels / letters < 0.12) return false

  return true
}
