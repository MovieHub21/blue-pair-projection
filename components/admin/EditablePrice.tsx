'use client'
import { useState } from 'react'
import { Pencil, Check } from 'lucide-react'
import { naira } from '../../lib/format'

export default function EditablePrice({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  if (!editing) {
    return (
      <button onClick={() => { setDraft(String(value)); setEditing(true) }} className="flex items-center gap-1.5 font-semibold text-navy-900 hover:text-gold-600 group">
        {naira(value)} <Pencil size={12} className="opacity-0 group-hover:opacity-60" />
      </button>
    )
  }
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-navy-400">₦</span>
      <input autoFocus type="number" value={draft} onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { onSave(Number(draft)); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        className="w-24 h-8 rounded-md border border-gold-400 px-2 text-sm focus:outline-none" />
      <button onClick={() => { onSave(Number(draft)); setEditing(false) }} className="w-7 h-7 rounded-md bg-navy-900 text-white flex items-center justify-center"><Check size={13} /></button>
    </div>
  )
}
