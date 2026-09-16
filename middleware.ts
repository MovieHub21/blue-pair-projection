import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/config'
import { sectionForPath, ALWAYS_ALLOWED_SECTIONS } from './lib/permissionSections'

const STAFF_PREFIXES = ['/admin', '/reception', '/housekeeping', '/maintenance']
const GUEST_PREFIXES = ['/account']
const PUBLIC_PATHS = ['/account/login', '/account/register', '/account/forgot-password', '/account/reset-password', '/staff/login']
const MAINTENANCE_PATH = '/site-maintenance'

type RateLimitEntry = { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()
const RATE_WINDOW_MS = 60_000

function rateLimit(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const method = request.method.toUpperCase()

  let limit = 120
  if (/^\/api\/(auth\/|paystack\/|admin\/paystack\/)/.test(pathname) || pathname === '/api/rate-limit-test') limit = 5
  else if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) limit = 40

  const bucket = pathname.startsWith('/api/auth/') ? 'auth' : pathname.startsWith('/api/paystack') || pathname.startsWith('/api/admin/paystack') ? 'payment' : pathname === '/api/rate-limit-test' ? 'rate-limit-test' : 'api'
  const key = `${ip}:${bucket}`
  const now = Date.now()
  const current = rateLimitStore.get(key)
  const entry = !current || current.resetAt <= now ? { count: 1, resetAt: now + RATE_WINDOW_MS } : { count: current.count + 1, resetAt: current.resetAt }
  rateLimitStore.set(key, entry)

  if (rateLimitStore.size > 5000) {
    for (const [storedKey, storedEntry] of rateLimitStore) if (storedEntry.resetAt <= now) rateLimitStore.delete(storedKey)
  }

  if (entry.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter), 'X-RateLimit-Limit': String(limit), 'X-RateLimit-Remaining': '0' },
    })
  }
  return null
}

function getEnvironment() {
  if (process.env.VERCEL_ENV === 'preview') return 'preview'
  if (process.env.VERCEL_ENV === 'production') return 'production'
  return process.env.NODE_ENV === 'development' ? 'development' : 'production'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) {
    const limited = rateLimit(request)
    if (limited) return limited
    return NextResponse.next({ request })
  }

  const response = NextResponse.next({ request })
  if (pathname === MAINTENANCE_PATH) return response

  const needsStaff = STAFF_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const needsGuest = GUEST_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAuthPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isAuthPath) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  })

  const environment = getEnvironment()
  const { data: siteSetting } = await supabase.from('site_settings').select('maintenance_mode').eq('environment', environment).maybeSingle()

  if (siteSetting?.maintenance_mode && !needsStaff) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
      if ((roles ?? []).some((r: any) => r.role === 'super_admin')) return response
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
    if (list.length === 0) {
      const url = request.nextUrl.clone()
      url.pathname = '/account/dashboard'
      return NextResponse.redirect(url)
    }
    const isSuperAdmin = list.includes('super_admin')
    const isManager = list.includes('manager')
    if (!isSuperAdmin && !isManager) {
      const section = sectionForPath(pathname)
      if (section && !ALWAYS_ALLOWED_SECTIONS.has(section)) {
        const { data: permRows } = await supabase.from('role_permissions').select('allowed').in('role', list).eq('section', section)
        const rows = permRows ?? []
        if (rows.length > 0 && !rows.some((r: any) => r.allowed)) {
          const url = request.nextUrl.clone()
          url.pathname = list.includes('reception') ? '/reception/dashboard' : list.includes('housekeeping') ? '/housekeeping/dashboard' : list.includes('maintenance') ? '/maintenance/dashboard' : '/admin/dashboard'
          url.searchParams.set('restricted', '1')
          return NextResponse.redirect(url)
        }
      }
    }
  }
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js).*)'] }
