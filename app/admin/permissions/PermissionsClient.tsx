'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { useStore } from '../../../store/useStore'

interface Section { id: string; section: string; label: string; allowed: boolean }
interface RoleGroup { role: string; label: string; sections: Section[] }

export default function PermissionsClient({ roles, canEdit }: { roles: RoleGroup[]; canEdit: boolean }) {
  const [active, setActive] = useState(roles[2]?.role || roles[0]?.role)
  const [data, setData] = useState(roles)
  const [savingId, setSavingId] = useState<string | null>(null)
  const pushToast = useStore(s => s.pushToast)

  const group = data.find(r => r.role === active)!

  async function toggle(sectionRow: Section) {
    if (!canEdit) return
    const next = !sectionRow.allowed
    setSavingId(sectionRow.id)
    setData(prev => prev.map(r => r.role !== active ? r : { ...r, sections: r.sections.map(s => s.id === sectionRow.id ? { ...s, allowed: next } : s) }))
    const { error } = await supabase.from('role_permissions').update({ allowed: next }).eq('id', sectionRow.id)
    setSavingId(null)
    if (error) {
      setData(prev => prev.map(r => r.role !== active ? r : { ...r, sections: r.sections.map(s => s.id === sectionRow.id ? { ...s, allowed: !next } : s) }))
      pushToast('Could not update permission: ' + error.message, 'error')
      return
    }
    pushToast(`${sectionRow.label} ${next ? 'allowed' : 'restricted'} for ${group.label}`, 'success')
  }

  return (
    <div>
      <div className="flex gap-2 mb-6 flex-wrap">
        {data.map(r => (
          <button key={r.role} onClick={() => setActive(r.role)} className={'px-3.5 py-2 rounded-full text-xs font-semibold border ' + (active === r.role ? 'bg-navy-950 text-white border-navy-950' : 'border-black/15 text-navy-600')}>
            {r.label}
          </button>
        ))}
      </div>
      <div className="card p-6 max-w-lg">
        <h4 className="font-semibold mb-4 uppercase text-xs tracking-wider text-navy-400">{group.label}</h4>
        <div className="flex flex-col gap-1">
          {group.sections.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-black/5 last:border-none text-sm">
              <span>{s.label}</span>
              {canEdit ? (
                <button
                  onClick={() => toggle(s)}
                  disabled={savingId === s.id}
                  aria-label={`Toggle ${s.label} for ${group.label}`}
                  className={'relative w-10 h-5.5 rounded-full transition-colors disabled:opacity-60 ' + (s.allowed ? 'bg-emerald-500' : 'bg-black/15')}
                  style={{ height: '22px' }}
                >
                  <span className={'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ' + (s.allowed ? 'translate-x-[19px]' : 'translate-x-0.5')} style={{ width: '18px', height: '18px' }} />
                </button>
              ) : (
                s.allowed
                  ? <span className="text-emerald-600 font-semibold text-xs">Allowed</span>
                  : <span className="text-red-500 font-semibold text-xs">Restricted</span>
              )}
            </div>
          ))}
          {group.sections.length === 0 && <p className="text-sm text-navy-400 py-4">No permission rows for this role yet.</p>}
        </div>
      </div>
    </div>
  )
}
