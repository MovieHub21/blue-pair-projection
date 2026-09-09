import { ReactNode } from 'react'

export default function StatCard({ label, value, icon, delta, deltaTone = 'up', tint = 'gold' }: {
  label: string; value: string; icon?: ReactNode; delta?: string; deltaTone?: 'up' | 'down' | 'flat'; tint?: 'gold' | 'navy' | 'green'
}) {
  const tintClass = tint === 'gold' ? 'bg-gold-50 text-gold-600' : tint === 'green' ? 'bg-emerald-50 text-emerald-700' : 'bg-navy-50 text-navy-700'
  return (
    <div className="card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs text-navy-500 font-medium">{label}</span>
        {icon && <div className={'w-9 h-9 rounded-lg flex items-center justify-center ' + tintClass}>{icon}</div>}
      </div>
      <div className="text-2xl font-display font-semibold text-navy-950">{value}</div>
      {delta && (
        <span className={'text-[11px] font-bold ' + (deltaTone === 'up' ? 'text-emerald-600' : deltaTone === 'down' ? 'text-red-600' : 'text-navy-400')}>
          {deltaTone === 'up' ? '↑' : deltaTone === 'down' ? '↓' : '•'} {delta}
        </span>
      )}
    </div>
  )
}
