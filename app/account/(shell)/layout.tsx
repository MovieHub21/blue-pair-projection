import type { Metadata } from 'next'
import PortalShell from '../../../components/layout/PortalShell'
import PwaInstallPrompt from '../../../components/ui/PwaInstallPrompt'
import { LayoutGrid, CalendarCheck, FileText, MessageSquarePlus, ShoppingBag, MessageSquare, User, PartyPopper, Bell } from 'lucide-react'
import { getCurrentUser } from '../../../lib/account'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export default async function AccountShellLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUser(); const userName = profile?.name || user?.email || 'Guest'
  const supabase = createSupabaseServerClient()
  const { data: roleRows } = user ? await supabase.from('user_roles').select('role').eq('user_id', user.id) : { data: [] as { role: string }[] }
  const showAdminPortal = (roleRows ?? []).some((row: any) => ['super_admin', 'manager', 'admin'].includes(row.role))
  return <PortalShell portalName="My Account" portalTag="Customer Portal" userName={userName} userRole="Guest" showAdminPortal={showAdminPortal} groups={[{ items: [
    { href:'/account/dashboard', label:'Dashboard', icon:<LayoutGrid size={16}/>, end:true },
    { href:'/account/bookings', label:'My Bookings', icon:<CalendarCheck size={16}/> },
    { href:'/account/events', label:'Event Reservations', icon:<PartyPopper size={16}/> },
    { href:'/account/messages', label:'Messages', icon:<MessageSquare size={16}/> },
    { href:'/account/notifications', label:'Notifications', icon:<Bell size={16}/> },
    { href:'/account/invoices', label:'Invoices', icon:<FileText size={16}/> },
    { href:'/account/requests', label:'Special Requests', icon:<MessageSquarePlus size={16}/> },
    { href:'/account/orders', label:'My Orders', icon:<ShoppingBag size={16}/> },
    { href:'/account/profile', label:'Profile', icon:<User size={16}/> },
  ]}]}><>{children}<PwaInstallPrompt /></></PortalShell>
}
