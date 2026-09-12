import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/config'
import { sectionForPath, ALWAYS_ALLOWED_SECTIONS } from './lib/permissionSections'

const STAFF_PREFIXES = ['/admin', '/reception', '/housekeeping', '/maintenance']
const GUEST_PREFIXES = ['/account']
const PUBLIC_PATHS = ['/account/login', '/account/register', '/staff/login']
const MAINTENANCE_PATH = '/site-maintenance'

function getEnvironment() {
  if (process.env.VERCEL_ENV === 'preview') return 'preview'
  if (process.env.VERCEL_ENV === 'production') return 'production'
  return process.env.NODE_ENV === 'development' ? 'development' : 'production'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  if (pathname === MAINTENANCE_PATH) return response

  const needsStaff = STAFF_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const needsGuest = GUEST_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAuthPath = PUBLIC_PATHS.some(p => pathname.startsWith(p))

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Maintenance is controlled from the Super Admin panel and stored per environment,
  // so toggling localhost never puts the live production site into maintenance.
  const environment = getEnvironment()
  const { data: siteSetting } = await supabase
    .from('site_settings')
    .select('maintenance_mode')
    .eq('environment', environment)
    .maybeSingle()

  if (siteSetting?.maintenance_mode && !needsStaff && !isAuthPath) {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
      const isSuperAdmin = (roles ?? []).some((r: any) => r.role === 'super_admin')
      if (isSuperAdmin) return response
    }

    const url = request.nextUrl.clone()
    url.pathname = MAINTENANCE_PATH
    return NextResponse.rewrite(url)
  }

  if (!needsStaff && !needsGuest) return response

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = needsStaff ? '/staff/login' : '/account/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (needsStaff) {
    const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
    const list = (roles ?? []).map((r: any) => r.role as string)

    // No staff role at all → this is a guest account, send them to their area.
    if (list.length === 0) {
      const url = request.nextUrl.clone()
      url.pathname = '/account/dashboard'
      return NextResponse.redirect(url)
    }

    const isSuperAdmin = list.includes('super_admin')
    const isManager = list.includes('manager')

    // Access is decided purely by the permission toggles a super admin sets,
    // so turning a section on immediately makes that page reachable for the
    // role — in every portal, not just the admin area.
    if (!isSuperAdmin && !isManager) {
      const section = sectionForPath(pathname)
      if (section && !ALWAYS_ALLOWED_SECTIONS.has(section)) {
        const { data: permRows } = await supabase
          .from('role_permissions')
          .select('allowed')
          .in('role', list)
          .eq('section', section)
        const rows = permRows ?? []
        const restricted = rows.length > 0 && !rows.some((r: any) => r.allowed)
        if (restricted) {
          const url = request.nextUrl.clone()
          url.pathname = list.includes('reception') ? '/reception/dashboard'
            : list.includes('housekeeping') ? '/housekeeping/dashboard'
            : list.includes('maintenance') ? '/maintenance/dashboard'
            : '/admin/dashboard'
          url.searchParams.set('restricted', '1')
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|api/).*)'],
}
