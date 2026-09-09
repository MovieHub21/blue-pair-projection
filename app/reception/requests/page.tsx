'use client'
import { Shirt, UtensilsCrossed, Sparkles, Wrench } from 'lucide-react'
import StatusBadge from '../../../components/ui/StatusBadge'

const requests = [
  { guest: 'Adaeze Okonkwo', room: '401', type: 'Room service', icon: UtensilsCrossed, note: 'Bottle of water and light snacks around 8pm.', status: 'pending' },
  { guest: 'Chukwuemeka Eze', room: '203', type: 'Extra towels', icon: Shirt, note: '2 extra bath towels requested.', status: 'in_progress' },
  { guest: 'Oluwaseun Adebayo', room: '302', type: 'Housekeeping', icon: Sparkles, note: 'Requested turn-down service.', status: 'completed' },
  { guest: 'Ibrahim Suleiman', room: '110', type: 'Maintenance', icon: Wrench, note: 'AC remote not responding.', status: 'pending' },
]

export default function GuestRequests() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Guest Requests</h1>
      <div className="grid gap-3">
        {requests.map((r,i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center shrink-0"><r.icon size={18}/></div>
            <div className="flex-1">
              <div className="flex items-center gap-2"><b className="text-sm">{r.guest}</b><span className="text-xs text-navy-400">Room {r.room}</span></div>
              <span className="text-xs text-navy-500">{r.type} — {r.note}</span>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
