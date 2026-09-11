'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { initials } from '../../../lib/format'
import Modal from '../../../components/ui/Modal'
import { Plus, Loader2 } from 'lucide-react'
import type { StaffMember } from '../../../data/mock'
import { STAFF_ROLE_LABELS } from '../../../lib/roles'

const ROLES = STAFF_ROLE_LABELS as StaffMember['role'][]

export default function StaffManagement() {
  const { staff, loadAll, toggleStaffStatus, updateStaffRole, updateStaffInfo } = useStore()
  const pushToast = useStore(s => s.pushToast)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState({ name: '', email: '', phone: '', role: 'Reception' as StaffMember['role'], department: 'Front Desk', password: '' })
  const [editDraft, setEditDraft] = useState({ name: '', phone: '', department: '' })
  const [query, setQuery] = useState('')

  const filtered = staff.filter(s =>
    !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase()) || s.role.toLowerCase().includes(query.toLowerCase())
  )

  async function submit() {
    setError(null)
    if (!draft.name || !draft.email || !draft.password) { setError('Name, email and password are required.'); return }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/create-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draft.name, email: draft.email, phone: draft.phone, roleLabel: draft.role, department: draft.department, password: draft.password }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not create staff login.'); return }
      pushToast(`${draft.name} can now sign in at /staff/login`, 'success')
      setShowAdd(false)
      setDraft({ name: '', email: '', phone: '', role: 'Reception', department: 'Front Desk', password: '' })
      await loadAll()
    } catch {
      setError('Network error — please try again.')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(s: StaffMember) {
    setEditing(s)
    setEditDraft({ name: s.name, phone: s.phone, department: s.department })
  }

  function saveEdit() {
    if (!editing) return
    updateStaffInfo(editing.id, editDraft)
    setEditing(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Staff Management</h1>
        <div className="flex items-center gap-2">
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search staff…" className="field-input !py-2 text-sm w-48" />
          <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Add staff</button>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[840px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5">
            <th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Department</th><th className="p-4">Contact</th><th className="p-4">Login</th><th className="p-4">Status</th><th className="p-4"></th>
          </tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b border-black/5 last:border-none">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-navy-900 text-gold-400 text-[11px] font-bold flex items-center justify-center">{initials(s.name)}</div><b>{s.name}</b></div></td>
                <td className="p-4"><select value={s.role} onChange={e => updateStaffRole(s.id, e.target.value as StaffMember['role'])} className="text-xs border border-black/10 rounded-md px-2 py-1.5">{ROLES.map(r => <option key={r}>{r}</option>)}</select></td>
                <td className="p-4 text-navy-500">{s.department}</td>
                <td className="p-4 text-navy-500">{s.phone}</td>
                <td className="p-4">{s.userId ? <span className="pill-green">Active login</span> : <span className="pill-amber">No login yet</span>}</td>
                <td className="p-4"><button onClick={() => toggleStaffStatus(s.id)} className={s.status === 'active' ? 'pill-green' : 'pill-red'}>{s.status}</button></td>
                <td className="p-4"><button onClick={() => openEdit(s)} className="text-xs font-semibold text-navy-900">Edit</button></td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-navy-400 text-sm">No staff match "{query}".</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={showAdd} onClose={() => { setShowAdd(false); setError(null) }} title="Add staff member" subtitle="Creates a real login they can use at /staff/login">
        <div className="grid gap-4">
          {error && <div className="text-xs font-medium text-red-600 bg-red-50 rounded-lg px-3.5 py-2.5">{error}</div>}
          <div><label className="field-label">Full name</label><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Email (login)</label><input type="email" className="field-input" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})} /></div>
            <div><label className="field-label">Phone</label><input className="field-input" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Role</label><select className="field-input" value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value as StaffMember['role']})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
            <div><label className="field-label">Department</label><input className="field-input" value={draft.department} onChange={e=>setDraft({...draft,department:e.target.value})} /></div>
          </div>
          <div>
            <label className="field-label">Temporary password</label>
            <input type="text" className="field-input" value={draft.password} onChange={e=>setDraft({...draft,password:e.target.value})} placeholder="At least 8 characters" />
            <p className="text-[11px] text-navy-400 mt-1.5">Share this with them directly — encourage them to change it after their first sign-in.</p>
          </div>
        </div>
        <button onClick={submit} disabled={creating} className="btn-primary w-full justify-center mt-6 disabled:opacity-60 flex items-center gap-2">
          {creating && <Loader2 size={15} className="animate-spin" />}{creating ? 'Creating login…' : 'Add staff member'}
        </button>
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit staff member" subtitle={editing?.email}>
        <div className="grid gap-4">
          <div><label className="field-label">Full name</label><input className="field-input" value={editDraft.name} onChange={e=>setEditDraft({...editDraft,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Phone</label><input className="field-input" value={editDraft.phone} onChange={e=>setEditDraft({...editDraft,phone:e.target.value})} /></div>
            <div><label className="field-label">Department</label><input className="field-input" value={editDraft.department} onChange={e=>setEditDraft({...editDraft,department:e.target.value})} /></div>
          </div>
          <p className="text-[11px] text-navy-400">To change their role, use the role dropdown in the table — it updates their portal access immediately.</p>
        </div>
        <button onClick={saveEdit} className="btn-primary w-full justify-center mt-6">Save changes</button>
      </Modal>
    </div>
  )
}
