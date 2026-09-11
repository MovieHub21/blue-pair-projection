import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { SUPABASE_URL } from '../../../../lib/supabase/config'
import { ROLE_LABEL_TO_ENUM } from '../../../../lib/roles'

export async function POST(request: Request) {
  // 1. Verify the caller is a signed-in super_admin using their own session cookie — never trust the client.
  const callerDb = createSupabaseServerClient()
  const { data: { user: caller } } = await callerDb.auth.getUser()
  if (!caller) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })

  const { data: callerRoles } = await callerDb.from('user_roles').select('role').eq('user_id', caller.id)
  const isSuperAdmin = (callerRoles ?? []).some((r: any) => r.role === 'super_admin')
  if (!isSuperAdmin) return NextResponse.json({ error: 'Only a Super Admin can create staff logins.' }, { status: 403 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    return NextResponse.json({
      error: 'Server is missing SUPABASE_SERVICE_ROLE_KEY. Add it as a server-only environment variable (Project Settings → API → service_role key in Supabase) — never expose it to the browser.',
    }, { status: 500 })
  }

  const body = await request.json().catch(() => null)
  const { name, email, phone, roleLabel, department, password } = body ?? {}
  if (!name || !email || !password || !roleLabel) {
    return NextResponse.json({ error: 'Name, email, password and role are required.' }, { status: 400 })
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }
  const roleEnum = ROLE_LABEL_TO_ENUM[roleLabel]
  if (!roleEnum) return NextResponse.json({ error: 'Unrecognized role.' }, { status: 400 })

  // 2. Use the service-role client (server-only, bypasses RLS) to actually create the login + records.
  const admin = createClient(SUPABASE_URL, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { name },
  })
  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message || 'Could not create the login.' }, { status: 400 })
  }
  const userId = created.user.id

  const staffId = `s_${Date.now()}`
  const [{ error: profileErr }, { error: staffErr }, { error: roleErr }] = await Promise.all([
    admin.from('profiles').upsert({ id: userId, name, email, phone: phone ?? '' }),
    admin.from('staff').insert({ id: staffId, user_id: userId, name, email, phone: phone ?? '', role: roleLabel, department: department ?? '', status: 'active' }),
    admin.from('user_roles').insert({ user_id: userId, role: roleEnum }),
  ])
  const dbError = profileErr || staffErr || roleErr
  if (dbError) {
    // Roll back the auth user so we don't leave an orphaned login with no staff record.
    await admin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true, staffId, userId })
}
