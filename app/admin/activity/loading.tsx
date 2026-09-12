import { Loader2 } from 'lucide-react'

export default function ActivityLoading() {
  return (
    <div className="card min-h-[420px] flex flex-col items-center justify-center gap-3">
      <Loader2 size={28} className="text-gold-600 animate-spin" />
      <p className="text-sm font-medium text-navy-700">Loading hotel activity…</p>
      <p className="text-xs text-navy-400">Preparing the owner timeline.</p>
    </div>
  )
}
