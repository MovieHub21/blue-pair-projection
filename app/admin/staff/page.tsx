'use client'
import { useState } from 'react'
import { useStore } from '../../../store/useStore'
import { initials } from '../../../lib/format'
import Modal from '../../../components/ui/Modal'
import { Plus } from 'lucide-react'
import type { StaffMember } from '../../../data/mock'

const ROLES: StaffMember['role'][] = ['Super Admin','Manager','Reception','Housekeeping','Maintenance','Restaurant Staff','Bar Staff','Accountant']

export default function StaffManagement() {
  const { staff, addStaff, toggleStaffStatus, updateStaffRole } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '', phone: '', role: 'Reception' as StaffMember['role'], department: 'Front Desk' })

  function submit() {
    const s: StaffMember = { id: `s_${Date.now()}`, name: draft.name || 'New Staff', email: draft.email, phone: draft.phone, role: draft.role, department: draft.department, status: 'active', joined: '2026-08-09' }
    addStaff(s); setShowAdd(false); setDraft({ name:'', email:'', phone:'', role:'Reception', department:'Front Desk' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Staff Management</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary btn-sm flex items-center gap-1.5"><Plus size={14}/>Add staff</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[840px]">
          <thead><tr className="text-left text-xs text-navy-400 border-b border-black/5">
            <th className="p-4">Name</th><th className="p-4">Role</th><th className="p-4">Department</th><th className="p-4">Contact</th><th className="p-4">Status</th><th className="p-4"></th>
          </tr></thead>
          <tbody>
            {staff.map(s => (
              <tr key={s.id} className="border-b border-black/5 last:border-none">
                <td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-navy-900 text-gold-400 text-[11px] font-bold flex items-center justify-center">{initials(s.name)}</div><b>{s.name}</b></div></td>
                <td className="p-4"><select value={s.role} onChange={e => updateStaffRole(s.id, e.target.value as StaffMember['role'])} className="text-xs border border-black/10 rounded-md px-2 py-1.5">{ROLES.map(r => <option key={r}>{r}</option>)}</select></td>
                <td className="p-4 text-navy-500">{s.department}</td>
                <td className="p-4 text-navy-500">{s.phone}</td>
                <td className="p-4"><button onClick={() => toggleStaffStatus(s.id)} className={s.status === 'active' ? 'pill-green' : 'pill-red'}>{s.status}</button></td>
                <td className="p-4"><button className="text-xs font-semibold text-navy-900">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add staff member">
        <div className="grid gap-4">
          <div><label className="field-label">Full name</label><input className="field-input" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Email</label><input className="field-input" value={draft.email} onChange={e=>setDraft({...draft,email:e.target.value})} /></div>
            <div><label className="field-label">Phone</label><input className="field-input" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="field-label">Role</label><select className="field-input" value={draft.role} onChange={e=>setDraft({...draft,role:e.target.value as StaffMember['role']})}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
            <div><label className="field-label">Department</label><input className="field-input" value={draft.department} onChange={e=>setDraft({...draft,department:e.target.value})} /></div>
          </div>
        </div>
        <button onClick={submit} className="btn-primary w-full justify-center mt-6">Add staff member</button>
      </Modal>
    </div>
  )
}
