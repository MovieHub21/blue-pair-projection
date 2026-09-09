'use client'
import { useState } from 'react'
import { rolePermissions } from '../../../data/mock'
import { Check, X } from 'lucide-react'

export default function Permissions() {
  const roles = Object.keys(rolePermissions)
  const [role, setRole] = useState(roles[2])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Permissions</h1>
      <div className="flex gap-2 mb-6 flex-wrap">
        {roles.map(r => <button key={r} onClick={() => setRole(r)} className={'px-3.5 py-2 rounded-full text-xs font-semibold border ' + (role===r ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15')}>{r}</button>)}
      </div>
      <div className="card p-6 max-w-lg">
        <h4 className="font-semibold mb-4 uppercase text-xs tracking-wider text-navy-400">{role}</h4>
        <div className="flex flex-col gap-1">
          {rolePermissions[role].map(p => (
            <div key={p.section} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-none text-sm">
              <span>{p.section}</span>
              {p.allowed ? <span className="flex items-center gap-1 text-emerald-600 font-semibold text-xs"><Check size={14}/>Allowed</span> : <span className="flex items-center gap-1 text-red-500 font-semibold text-xs"><X size={14}/>Restricted</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
