const CONTACT_MESSAGE_ROLES = new Set(['super_admin', 'manager', 'reception'])

export function canAccessContactMessages(
  roles: string[],
  permissionRows: Array<{ role: string; section: string; allowed: boolean }>,
) {
  const pageRoles = roles.filter(role => CONTACT_MESSAGE_ROLES.has(role))
  if (!pageRoles.length) return false
  if (pageRoles.includes('super_admin')) return true

  const receptionRules = permissionRows.filter(row => row.section === 'reception' && pageRoles.includes(row.role))
  return receptionRules.length === 0 || receptionRules.some(row => row.allowed)
}