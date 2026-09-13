import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '../../../lib/supabase/server'
import { SITE_URL } from '../../../lib/siteConfig'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/account/dashboard'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/account/dashboard'

  if (code) {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin))
  }

  return NextResponse.redirect(new URL('/account/forgot-password?error=invalid-link', SITE_URL || url.origin))
}
