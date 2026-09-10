import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/config'

const STAFF_PREFIXES = ['/admin', '/reception', '/housekeeping', '/maintenance']
const GUEST_PREFIXES = ['/account']
const PUBLIC_PATHS = ['/account/login', '/account/register', '/staff/login', '/housekeeping/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return response

  const needsStaff = STAFF_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const needsGuest = GUEST_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (!needsStaff && !needsGuest) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

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
    if (list.length === 0) {
      const url = request.nextUrl.clone()
      url.pathname = '/account/dashboard'
      return NextResponse.redirect(url)
    }
    const admin = list.includes('super_admin') || list.includes('manager')
    const allowed =
      (pathname.startsWith('/admin') && admin) ||
      (pathname.startsWith('/reception') && (admin || list.includes('reception'))) ||
      (pathname.startsWith('/housekeeping') && (admin || list.includes('housekeeping'))) ||
      (pathname.startsWith('/maintenance') && (admin || list.includes('maintenance')))
    if (!allowed) {
      const url = request.nextUrl.clone()
      url.pathname = list.includes('reception') ? '/reception/dashboard'
        : list.includes('housekeeping') ? '/housekeeping/dashboard'
        : list.includes('maintenance') ? '/maintenance/dashboard'
        : '/account/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*', '/reception/:path*', '/housekeeping/:path*', '/maintenance/:path*', '/account/:path*'],
}
