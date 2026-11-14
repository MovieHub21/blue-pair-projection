import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../../../lib/supabase/server'
import { createSupabaseAdminClient } from '../../../../../lib/supabase/admin'

const ALLOWED_ROLES = new Set(['super_admin', 'manager'])

async function requireNewsletterAccess() {
  const server = createSupabaseServerClient()
  const { data: { user } } = await server.auth.getUser()
  if (!user) return { user: null, response: NextResponse.json({ error: 'Authentication required.' }, { status: 401 }) }
  const { data: roles } = await server.from('user_roles').select('role').eq('user_id', user.id)
  if (!(roles ?? []).some((row: any) => ALLOWED_ROLES.has(row.role))) {
    return { user: null, response: NextResponse.json({ error: 'Newsletter access is restricted to managers.' }, { status: 403 }) }
  }
  return { user, response: null }
}

function cleanDesign(value: unknown) {
  const design = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
  const color = (input: unknown, fallback: string) => typeof input === 'string' && /^#[0-9a-f]{6}$/i.test(input) ? input : fallback
  const text = (input: unknown, fallback: string, max = 160) => typeof input === 'string' ? input.trim().slice(0, max) : fallback
  return {
    headerText: text(design.headerText, 'BLUE PAIR SIGNATURE', 100),
    footerText: text(design.footerText, 'Blue Pair Signature Hotel Crown and Suite · Uromi, Edo State', 220),
    backgroundColor: color(design.backgroundColor, '#f5f2eb'),
    cardColor: color(design.cardColor, '#ffffff'),
    headerColor: color(design.headerColor, '#0b1633'),
    accentColor: color(design.accentColor, '#d7ae52'),
    textColor: color(design.textColor, '#101a35'),
    buttonColor: color(design.buttonColor, '#c79a3e'),
    buttonTextColor: color(design.buttonTextColor, '#ffffff'),
    layout: design.layout === 'centered' ? 'centered' : 'classic',
    showHeader: design.showHeader !== false,
    showFooter: design.showFooter !== false,
  }
}

export async function GET() {
  const access = await requireNewsletterAccess()
  if (access.response) return access.response
  const db = createSupabaseAdminClient()
  const { data, error } = await db.from('newsletter_templates')
    .select('id,name,design,created_at,updated_at')
    .order('updated_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: 'Unable to load saved templates.' }, { status: 500 })
  return NextResponse.json({ templates: data ?? [] })
}

export async function POST(request: Request) {
  const access = await requireNewsletterAccess()
  if (access.response) return access.response
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim().slice(0, 100)
    if (!name) return NextResponse.json({ error: 'Enter a name for this template.' }, { status: 400 })
    const db = createSupabaseAdminClient()
    const { data, error } = await db.from('newsletter_templates')
      .insert({ name, design: cleanDesign(body.design), created_by: access.user!.id })
      .select('id,name,design,created_at,updated_at').single()
    if (error) throw error
    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to save this template.' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const access = await requireNewsletterAccess()
  if (access.response) return access.response
  try {
    const body = await request.json()
    const id = String(body.id ?? '')
    const name = String(body.name ?? '').trim().slice(0, 100)
    if (!id || !name) return NextResponse.json({ error: 'Template ID and name are required.' }, { status: 400 })
    const db = createSupabaseAdminClient()
    const { data, error } = await db.from('newsletter_templates')
      .update({ name, design: cleanDesign(body.design), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,name,design,created_at,updated_at').single()
    if (error) throw error
    return NextResponse.json({ template: data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Unable to update this template.' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const access = await requireNewsletterAccess()
  if (access.response) return access.response
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 })
  const db = createSupabaseAdminClient()
  const { error } = await db.from('newsletter_templates').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Unable to delete this template.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
