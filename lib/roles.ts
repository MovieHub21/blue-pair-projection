export const ROLE_LABEL_TO_ENUM: Record<string, string> = {
  'Super Admin': 'super_admin', 'Manager': 'manager', 'Reception': 'reception',
  'Housekeeping': 'housekeeping', 'Maintenance': 'maintenance',
  'Restaurant Staff': 'restaurant', 'Bar Staff': 'bar', 'Accountant': 'accountant',
}
export const ROLE_ENUM_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_LABEL_TO_ENUM).map(([label, val]) => [val, label])
)
export const STAFF_ROLE_LABELS = Object.keys(ROLE_LABEL_TO_ENUM)
