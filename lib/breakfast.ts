const COMPLIMENTARY_BREAKFASTS: Record<string, number> = {
  'executive standard': 1,
  'executive classic': 1,
  classic: 1,
  diplomatic: 2,
}

/** Match the hotel's room labels even when the admin omits “Room” or “Suite.” */
export function complimentaryBreakfastCount(roomName: string): number | null {
  const normalizedName = roomName.trim().toLowerCase().replace(/\s+(room|suite)$/, '')
  return COMPLIMENTARY_BREAKFASTS[normalizedName] ?? null
}
