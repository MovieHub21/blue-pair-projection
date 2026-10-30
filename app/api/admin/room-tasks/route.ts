import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { staffBelongsTo, type StaffDepartment } from '../../../../lib/staffRecipients'

export const dynamic = 'force-dynamic'
type Department = 'housekeeping' | 'maintenance'
const MANAGEMENT = new Set(['super_admin', 'manager'])

async function getContext() {
  const auth = createSupabaseServerClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return null
  const admin = createSupabaseAdminClient()
  const [{ data: roles }, { data: profile }] = await Promise.all([
    admin.from('user_roles').select('role').eq('user_id', user.id),
    admin.from('profiles').select('name').eq('id', user.id).maybeSingle(),
  ])
  return { admin, user, roles: (roles ?? []).map((row: any) => String(row.role)), name: String(profile?.name || user.email || 'Staff') }
}

async function canManageRooms(context: NonNullable<Awaited<ReturnType<typeof getContext>>>) {
  if (context.roles.some(role => MANAGEMENT.has(role) || role === 'reception')) return true
  if (!context.roles.length) return false
  const { data, error } = await context.admin.from('role_permissions').select('role,allowed').eq('section', 'rooms').in('role', context.roles)
  if (error) throw error
  // Assignment is a write privilege: non-management roles need an explicit
  // positive Rooms permission rather than inheriting the portal's read default.
  return !!data?.some((row: any) => row.allowed)
}

function validDepartment(value: string | null): value is Department {
  return value === 'housekeeping' || value === 'maintenance'
}

async function handleGet(request: Request) {
  const context = await getContext()
  if (!context) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const department = new URL(request.url).searchParams.get('department')
  if (!validDepartment(department)) return NextResponse.json({ error: 'Invalid department.' }, { status: 400 })
  const canAssign = await canManageRooms(context)
  const allowed = canAssign || context.roles.includes(department)
  if (!allowed) return NextResponse.json({ error: 'Not allowed.' }, { status: 403 })

  const { data, error } = await context.admin.from('staff').select('id,user_id,name,email,role,department').eq('status', 'active')
  if (error) return NextResponse.json({ error: 'Unable to load department staff.' }, { status: 500 })
  const recipients = (data ?? [])
    .filter((member: any) => staffBelongsTo(member, department as StaffDepartment))
    .map((member: any) => ({ id: String(member.id), userId: member.user_id ? String(member.user_id) : null, name: String(member.name || member.email || 'Staff') }))
  return NextResponse.json({ staff: recipients, canAssign })
}

async function handlePost(request: Request) {
  const context = await getContext()
  if (!context) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const department = String(body.department || '')
  const action = String(body.action || '')
  const id = String(body.id || '')
  if (!validDepartment(department) || !id || !['claim', 'assign', 'complete', 'resolve'].includes(action)) {
    return NextResponse.json({ error: 'Invalid room task action.' }, { status: 400 })
  }
  const isManager = context.roles.some(role => MANAGEMENT.has(role))
  const isDepartment = context.roles.includes(department)
  if (action === 'assign' && !(await canManageRooms(context))) return NextResponse.json({ error: 'Room assignment permission is required.' }, { status: 403 })
  if (action !== 'assign' && !isManager && !isDepartment) return NextResponse.json({ error: 'Department staff access is required.' }, { status: 403 })
  if ((department === 'housekeeping' && action === 'resolve') || (department === 'maintenance' && action === 'complete')) {
    return NextResponse.json({ error: 'Invalid action for this department.' }, { status: 400 })
  }

  const admin = context.admin
  if (department === 'housekeeping') {
    const { data: task, error: taskError } = await admin.from('housekeeping_tasks').select('id,room,room_id,status').eq('id', id).maybeSingle()
    if (taskError) throw taskError
    if (!task) return NextResponse.json({ error: 'Housekeeping task not found.' }, { status: 404 })
    if (action === 'claim') {
      const { data, error } = await admin.from('housekeeping_tasks').update({ status: 'in_progress', assigned_to: context.name }).eq('id', id).eq('status', 'pending').select('id').maybeSingle()
      if (error) throw error
      if (!data) return NextResponse.json({ error: 'Another staff member has already accepted this task.' }, { status: 409 })
    } else if (action === 'assign') {
      const staffId = String(body.staffId || '')
      const { data: staff, error: staffError } = await admin.from('staff').select('name,role,department').eq('id', staffId).eq('status', 'active').maybeSingle()
      if (staffError) throw staffError
      if (!staff || !staffBelongsTo(staff, 'housekeeping')) return NextResponse.json({ error: 'Choose an active housekeeping staff member.' }, { status: 400 })
      const { error } = await admin.from('housekeeping_tasks').update({ status: 'in_progress', assigned_to: staff.name || 'Cleaner' }).eq('id', id).in('status', ['pending', 'in_progress'])
      if (error) throw error
    } else {
      let roomId = task.room_id
      if (!roomId) roomId = (await admin.from('rooms').select('id').eq('room_number', task.room).maybeSingle()).data?.id || null
      const { error } = await admin.from('housekeeping_tasks').update({ status: 'completed', completed_at: new Date().toISOString(), ...(roomId ? { room_id: roomId } : {}) }).eq('id', id).in('status', ['pending', 'in_progress'])
      if (error) throw error
    }
    return NextResponse.json({ ok: true })
  }

  const { data: ticket, error: ticketError } = await admin.from('maintenance_tickets').select('id,status').eq('id', id).maybeSingle()
  if (ticketError) throw ticketError
  if (!ticket) return NextResponse.json({ error: 'Maintenance ticket not found.' }, { status: 404 })
  if (action === 'claim') {
    const { data, error } = await admin.from('maintenance_tickets').update({ status: 'in_progress', assigned_to: context.name }).eq('id', id).eq('status', 'open').select('id').maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Another staff member has already accepted this task.' }, { status: 409 })
  } else if (action === 'assign') {
    const staffId = String(body.staffId || '')
    const { data: staff, error: staffError } = await admin.from('staff').select('name,role,department').eq('id', staffId).eq('status', 'active').maybeSingle()
    if (staffError) throw staffError
    if (!staff || !staffBelongsTo(staff, 'maintenance')) return NextResponse.json({ error: 'Choose an active maintenance staff member.' }, { status: 400 })
    const { error } = await admin.from('maintenance_tickets').update({ status: 'in_progress', assigned_to: staff.name || 'Maintenance staff' }).eq('id', id).in('status', ['open', 'in_progress'])
    if (error) throw error
  } else if (action === 'resolve') {
    const { error } = await admin.from('maintenance_tickets').update({ status: 'resolved' }).eq('id', id).neq('status', 'resolved')
    if (error) throw error
  }
  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  try { return await handleGet(request) }
  catch (error: any) {
    console.error('[room-tasks][get]', error)
    return NextResponse.json({ error: error?.message || 'Could not load room task staff.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try { return await handlePost(request) }
  catch (error: any) {
    console.error('[room-tasks][post]', error)
    return NextResponse.json({ error: error?.message || 'Could not update room task.' }, { status: 500 })
  }
}
