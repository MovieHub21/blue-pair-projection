const MAP: Record<string, { label: string; cls: string }> = {
  available: { label: 'Available', cls: 'pill-green' },
  occupied: { label: 'Occupied', cls: 'pill-blue' },
  cleaning: { label: 'Cleaning', cls: 'pill-amber' },
  cleaning_required: { label: 'Cleaning Required', cls: 'pill-orange' },
  maintenance: { label: 'Maintenance', cls: 'pill-red' },
  pending: { label: 'Pending', cls: 'pill-amber' },
  pending_payment: { label: 'Pending Payment', cls: 'pill-amber' },
  confirmed: { label: 'Confirmed', cls: 'pill-blue' },
  checked_in: { label: 'Checked In', cls: 'pill-green' },
  checked_out: { label: 'Checked Out', cls: 'pill-blue' },
  cancelled: { label: 'Cancelled', cls: 'pill-red' },
  paid: { label: 'Paid', cls: 'pill-green' },
  refunded: { label: 'Refunded', cls: 'pill-red' },
  success: { label: 'Success', cls: 'pill-green' },
  active: { label: 'Active', cls: 'pill-green' },
  vip: { label: 'VIP', cls: 'pill-gold' },
  inactive: { label: 'Inactive', cls: 'pill-red' },
  disabled: { label: 'Disabled', cls: 'pill-red' },
  open: { label: 'Open', cls: 'pill-red' },
  in_progress: { label: 'In Progress', cls: 'pill-amber' },
  resolved: { label: 'Resolved', cls: 'pill-green' },
  completed: { label: 'Completed', cls: 'pill-green' },
  published: { label: 'Published', cls: 'pill-green' },
  draft: { label: 'Draft', cls: 'pill-amber' },
  High: { label: 'High priority', cls: 'pill-red' },
  Medium: { label: 'Medium priority', cls: 'pill-amber' },
  Low: { label: 'Low priority', cls: 'pill-green' },
}

export default function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, cls: 'pill-blue' }
  return <span className={m.cls}>{m.label}</span>
}
