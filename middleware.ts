import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './lib/supabase/config'
import { sectionForPath, ALWAYS_ALLOWED_SECTIONS } from './lib/permissionSections'
import { readRouteState } from './lib/runtime/resolver'

const STAFF_PREFIXES = ['/admin']
const GUEST_PREFIXES = ['/account']
const PUBLIC_PATHS = ['/account/login', '/account/register', '/account/forgot-password', '/account/reset-password', '/staff/login']
const MAINTENANCE_PATH = '/site-maintenance'
const ADMIN_HOST = 'admin.bluepairsignature.com'
const MAIN_HOSTS = new Set(['bluepairsignature.com', 'www.bluepairsignature.com'])

type RateLimitEntry = { count: number; resetAt: number }
const rateLimitStore = new Map<string, RateLimitEntry>()
const RATE_WINDOW_MS = 60_000

function rateLimit(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const method = request.method.toUpperCase()

  // Live availability refreshes (realtime-driven reads) get their own, higher bucket so
  // several staff/guests behind one IP don't exhaust the shared API quota.
  const isAvailabilityRead = method === 'GET' && (pathname === '/api/public/availability' || pathname === '/api/public/room-calendar')

  let limit = 120
  if (/^\/api\/(auth\/|paystack\/|admin\/paystack\/)/.test(pathname) || pathname === '/api/rate-limit-test') limit = 5
  else if (isAvailabilityRead) limit = 600
  else if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) limit = 40

  const bucket = isAvailabilityRead ? 'availability' : pathname.startsWith('/api/auth/') ? 'auth' : pathname.startsWith('/api/paystack') || pathname.startsWith('/api/admin/paystack') ? 'payment' : pathname === '/api/rate-limit-test' ? 'rate-limit-test' : 'api'
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
  const originalPathname = request.nextUrl.pathname
  const hostname = request.headers.get('host')?.split(':')[0]?.toLowerCase() || ''
  const isAdminSubdomain = hostname === ADMIN_HOST
  const isMainProductionHost = MAIN_HOSTS.has(hostname)

  // API routes are shared by the public site and admin subdomain.
  if (originalPathname.startsWith('/api/')) {
    const limited = rateLimit(request)
    if (limited) return limited
    const feature = await readRouteState(originalPathname)
    if (!feature.ok) {
      console.error('[runtime][blocked]', {
        environment: getEnvironment(),
        item: feature.item,
        pathname: originalPathname,
        method: request.method,
      })
      return NextResponse.json({ error: 'Unable to process your request. Please try again.' }, { status: 503 })
    }
    return NextResponse.next({ request })
  }

  // Keep local development unchanged: localhost:3000/admin still works.
  // In production, /admin on the main domain is redirected to the admin subdomain.
  if (isMainProductionHost && originalPathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    const adminPath = originalPathname === '/admin' ? '/' : originalPathname.slice('/admin'.length)
    url.hostname = ADMIN_HOST
    url.pathname = adminPath || '/'
    return NextResponse.redirect(url)
  }

  // Legacy staff portal paths on the main domain now live under the admin route tree.
  // Send them to the admin subdomain so there is no dead /reception, /housekeeping or
  // /maintenance route left on the public host.
  if (isMainProductionHost && /^\/(reception|housekeeping|maintenance)(\/|$)/.test(originalPathname)) {
    const url = request.nextUrl.clone()
    url.hostname = ADMIN_HOST
    return NextResponse.redirect(url)
  }

  // The admin subdomain is a clean front door to the existing /admin route tree.
  // Examples:
  //   admin.bluepairsignature.com/            -> /admin/dashboard
  //   admin.bluepairsignature.com/bookings    -> /admin/bookings
  //   admin.bluepairsignature.com/rooms       -> /admin/rooms
  // The real pathname is rewritten internally, so no second Vercel project is needed.
  let pathname = originalPathname
  let shouldRewriteToAdmin = false

  if (isAdminSubdomain) {
    const isStaffLogin = pathname === '/staff/login' || pathname.startsWith('/staff/login/')
    const isAccountPath = pathname === '/account' || pathname.startsWith('/account/')
    const isMaintenancePath = pathname === MAINTENANCE_PATH

    if (!isStaffLogin && !isAccountPath && !isMaintenancePath && pathname !== '/admin' && !pathname.startsWith('/admin/')) {
      pathname = pathname === '/' ? '/admin/dashboard' : `/admin${pathname}`
      shouldRewriteToAdmin = true
    }
  }

  const response = NextResponse.next({ request })
  if (pathname === MAINTENANCE_PATH) return response

  // Calculate route class before the maintenance-mode lookup. Staff routes are
  // exempt from guest maintenance handling, so there is no reason to query the
  // site-settings table during staff navigation/login.
  const needsStaff = STAFF_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const needsGuest = GUEST_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isAuthPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isAuthPath) {
    if (shouldRewriteToAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = pathname
      return NextResponse.rewrite(url)
    }
    return response
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  })

  const environment = getEnvironment()
  const { data: siteSetting } = needsStaff
    ? { data: null }
    : await supabase.from('site_settings').select('maintenance_mode').eq('environment', environment).maybeSingle()

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

  if (!needsStaff && !needsGuest) {
    if (shouldRewriteToAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = pathname
      return NextResponse.rewrite(url)
    }
    return response
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = needsStaff ? '/staff/login' : '/account/login'
    url.searchParams.set('redirect', originalPathname)
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
          url.pathname = list.includes('reception') ? '/admin/reception/dashboard' : list.includes('housekeeping') ? '/admin/housekeeping/dashboard' : list.includes('maintenance') ? '/admin/maintenance/dashboard' : '/admin/dashboard'
          url.searchParams.set('restricted', '1')
          return NextResponse.redirect(url)
        }
      }
    }
  }

  if (shouldRewriteToAdmin) {
    const url = request.nextUrl.clone()
    url.pathname = pathname
    return NextResponse.rewrite(url)
  }

  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.png|apple-touch-icon.png|icon-192.png|icon-512.png|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif|css|js|map|woff|woff2|ttf|otf)$).*)'] }
