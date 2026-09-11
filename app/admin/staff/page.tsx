'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import { initials } from '../../../lib/format'
import { STAFF_ROLE_LABELS, ROLE_LABEL_TO_ENUM } from '../../../lib/roles'
import { supabase } from '../../../lib/supabase/client'
import { useStore } from '../../../store/useStore'
import type { StaffMember } from '../../../data/mock'

const ROLES = STAFF_ROLE_LABELS as StaffMember['role'][]

/**
 * Staff use the same account they created as a guest. A Super Admin only
 * grants a portal role to that account; this page never creates passwords.
 */
export default function StaffManagement() {
  const { staff, loadAll, toggleStaffStatus, updateStaffRole } = useStore()
  const pushToast = useStore(s => s.pushToast)
  const [showGrant, setShowGrant] = useState(false)
  const [granting, setGranting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState({ email: '', role: 'Reception' as StaffMember['role'], department: 'Front Desk' })

  const filtered = staff.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase()) || s.role.toLowerCase().includes(query.toLowerCase())
  )

  async function grantAccess() {
    setError(null)
    const email = draft.email.trim().toLowerCase()
    if (!email) { setError('Enter the email address used for the guest account.'); return }

    setGranting(true)
    try {
      // This query is only available to staff, and the subsequent writes are
      // restricted by RLS to Super Admins in the database migration.
      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('id, name, email, phone').eq('email', email).maybeSingle()
      if (profileError) throw profileError
      if (!profile) {
        setError('No guest account exists with that email. Ask them to create a guest account first.')
        return
      }

      const role = ROLE_LABEL_TO_ENUM[draft.role]
      if (!role) { setError('Choose a valid portal role.'); return }

      const { data: existing, error: staffLookupError } = await supabase
        .from('staff').select('id').eq('user_id', profile.id).maybeSingle()
      if (staffLookupError) throw staffLookupError

      const staffRecord = {
        user_id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        role: draft.role,
        department: draft.department,
        status: 'active',
      }
      const { error: staffError } = existing
        ? await supabase.from('staff').update(staffRecord).eq('id', existing.id)
        : await supabase.from('staff').insert(staffRecord)
      if (staffError) throw staffError

      // One staff portal role per account. Their guest login and password stay unchanged.
      const { error: removeRoleError } = await supabase.from('user_roles').delete().eq('user_id', profile.id)
      if (removeRoleError) throw removeRoleError
      const { error: roleError } = await supabase.from('user_roles').insert({ user_id: profile.id, role })
      if (roleError) throw roleError

      pushToast(`${profile.name} can now sign in with their existing account and access the ${draft.role} portal.`, 'success')
      setShowGrant(false)
      setDraft({ email: '', role: 'Reception', department: 'Front Desk' })
      await loadAll()
    } catch (err: any) {
      setError(err?.message || 'Could not grant portal access.')
    } finally {
      setGranting(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Staff access</h1>
          <p className="text-xs text-navy-400 mt-1">Staff first create a regular guest account, then a Super Admin gives that account portal access.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search staff…" className="field-input !py-2 text-sm w-48" />
          <button onClick={() => setShowGrant(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14} />Grant access</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[840px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5">
            <th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Department</th><th className="p-4">Contact</th><th className="p-4">Login</th><th className="p-4">Status</th>
          </tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-black/5 last:border-none">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-navy-900 text-gold-400 text-[11px] font-bold flex items-center justify-center">{initials(s.name)}</div><b>{s.name}</b></div></td>
                <td className="p-4"><select value={s.role} onChange={e => updateStaffRole(s.id, e.target.value as StaffMember['role'])} className="text-xs border border-black/10 rounded-md px-2 py-1.5">{ROLES.map(r => <option key={r}>{r}</option>)}</select></td>
                <td className="p-4 text-navy-500">{s.department}</td>
                <td className="p-4 text-navy-500">{s.phone}</td>
                <td className="p-4">{s.userId ? <span className="pill-green">Existing account</span> : <span className="pill-amber">No account linked</span>}</td>
                <td className="p-4"><button onClick={() => toggleStaffStatus(s.id)} className={s.status === 'active' ? 'pill-green' : 'pill-red'}>{s.status}</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-navy-400 text-sm">No staff match “{query}”.</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={showGrant} onClose={() => { setShowGrant(false); setError(null) }} title="Grant staff portal access" subtitle="The person must already have a regular guest account.">
        <div className="grid gap-4">
          {error && <div className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
          <div>
            <label className="field-label">Guest-account email</label>
            <input type="email" className="field-input" value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} placeholder="staff@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Portal role</label><select className="field-input" value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value as StaffMember['role'] })}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
            <div><label className="field-label">Department</label><input className="field-input" value={draft.department} onChange={e => setDraft({ ...draft, department: e.target.value })} /></div>
          </div>
          <p className="text-[11px] text-navy-400">Their name, phone number, email, and password remain the details from their guest account. No separate staff login is created.</p>
        </div>
        <button onClick={grantAccess} disabled={granting} className="btn-primary w-full justify-center mt-6 disabled:opacity-60 flex items-center gap-2">
          {granting && <Loader2 size={15} className="animate-spin" />}{granting ? 'Granting access…' : 'Grant access'}
        </button>
      </Modal>
    </div>
  )
}
