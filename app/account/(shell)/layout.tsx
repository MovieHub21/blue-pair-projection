import type { Metadata } from 'next'
import PortalShell from '../../../components/layout/PortalShell'
import { LayoutGrid, CalendarCheck, FileText, MessageSquarePlus, User } from 'lucide-react'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function AccountShellLayout({ children }: { children: React.ReactNode }) {
  const db = createSupabaseServerClient()
  const { data: { user } } = await db.auth.getUser()
  const { data: profile } = user
    ? await db.from('profiles').select('name').eq('id', user.id).maybeSingle()
    : { data: null }

  const userName = (profile as any)?.name || user?.email || 'Guest'

  return (
    <PortalShell portalName="My Account" portalTag="Customer Portal" userName={userName} userRole="Guest"
      groups={[{ items: [
        { href: '/account/dashboard', label: 'Dashboard', icon: <LayoutGrid size={16} />, end: true },
        { href: '/account/bookings', label: 'My Bookings', icon: <CalendarCheck size={16} /> },
        { href: '/account/invoices', label: 'Invoices', icon: <FileText size={16} /> },
        { href: '/account/requests', label: 'Special Requests', icon: <MessageSquarePlus size={16} /> },
        { href: '/account/profile', label: 'Profile', icon: <User size={16} /> },
      ]}]}>
      {children}
    </PortalShell>
  )
}
