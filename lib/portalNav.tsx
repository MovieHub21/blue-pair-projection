import {
  LayoutGrid,
  CalendarCheck,
  BedDouble,
  Grid3x3,
  LogIn,
  LogOut,
  Users,
  CreditCard,
  UtensilsCrossed,
  Martini,
  ClipboardList,
  Building2,
  PartyPopper,
  MonitorPlay,
  Car,
  Tag,
  Image,
  FileCode,
  Search,
  UserCog,
  ShieldCheck,
  BarChart3,
  Wrench,
  MessageSquare,
  Sparkles,
  Activity,
} from 'lucide-react'
import type { PortalNavGroup } from '../components/layout/PortalShell'
import { sectionForPath } from './permissionSections'

/**
 * Every management page in the system, in one place. All portals render this
 * same list, filtered by the signed-in staff member's permissions — so when a
 * super admin allows a section for a role, that page appears in that role's
 * portal immediately.
 */
export const MANAGEMENT_GROUPS: PortalNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', label: 'Admin Dashboard', icon: <LayoutGrid size={16} />, end: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { href: '/admin/bookings', label: 'Bookings', icon: <CalendarCheck size={16} /> },
      { href: '/admin/rooms', label: 'Room Management', icon: <BedDouble size={16} /> },
      { href: '/admin/availability', label: 'Room Availability', icon: <Grid3x3 size={16} /> },
      { href: '/admin/checkins', label: 'Check-in', icon: <LogIn size={16} /> },
      { href: '/admin/checkouts', label: 'Check-out', icon: <LogOut size={16} /> },
      { href: '/admin/customers', label: 'Customers', icon: <Users size={16} /> },
      { href: '/admin/payments', label: 'Payments', icon: <CreditCard size={16} /> },
    ],
  },
  {
    label: 'Outlets',
    items: [
      { href: '/admin/restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={16} /> },
      { href: '/admin/menu', label: 'Menu Management', icon: <ClipboardList size={16} /> },
      { href: '/admin/bar', label: 'Bar Management', icon: <Martini size={16} /> },
      { href: '/admin/amenities/vip-lounge', label: 'VIP Lounge', icon: <MonitorPlay size={16} /> },
      { href: '/admin/amenities/gym', label: 'Gym', icon: <MonitorPlay size={16} /> },
      { href: '/admin/amenities/pool', label: 'Pool', icon: <MonitorPlay size={16} /> },
      { href: '/admin/amenities/games', label: 'Games', icon: <MonitorPlay size={16} /> },
      { href: '/admin/amenities/club', label: 'Club', icon: <MonitorPlay size={16} /> },
      { href: '/admin/annex', label: 'Annex Management', icon: <Building2 size={16} /> },
      { href: '/admin/shortlets', label: 'Short-lets', icon: <Building2 size={16} /> },
      { href: '/admin/events', label: 'Events', icon: <PartyPopper size={16} /> },
      { href: '/admin/billboards', label: 'Billboards', icon: <Image size={16} /> },
      { href: '/admin/parking', label: 'Parking', icon: <Car size={16} /> },
      { href: '/admin/offers', label: 'Offers & Promos', icon: <Tag size={16} /> },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/gallery', label: 'Gallery', icon: <Image size={16} /> },
      { href: '/admin/website', label: 'Website Content', icon: <FileCode size={16} /> },
      { href: '/admin/seo', label: 'SEO', icon: <Search size={16} /> },
    ],
  },
  {
    label: 'Team',
    items: [
      { href: '/admin/staff', label: 'Staff Management', icon: <UserCog size={16} /> },
      { href: '/admin/permissions', label: 'Permissions', icon: <ShieldCheck size={16} /> },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/reports/revenue', label: 'Reports', icon: <BarChart3 size={16} /> },
      { href: '/admin/activity', label: 'Activity Log', icon: <Activity size={16} /> },
    ],
  },
  {
    label: 'Front Desk',
    items: [
      { href: '/reception/dashboard', label: 'Reception Dashboard', icon: <LayoutGrid size={16} />, end: true },
      { href: '/reception/arrivals', label: "Today's Arrivals", icon: <LogIn size={16} /> },
      { href: '/reception/departures', label: "Today's Departures", icon: <LogOut size={16} /> },
      { href: '/reception/room-assignment', label: 'Room Assignment', icon: <BedDouble size={16} /> },
      { href: '/reception/requests', label: 'Guest Requests', icon: <MessageSquare size={16} /> },
    ],
  },
  {
    label: 'Housekeeping',
    items: [
      { href: '/housekeeping/dashboard', label: 'Housekeeping Dashboard', icon: <Sparkles size={16} />, end: true },
      { href: '/housekeeping/tasks', label: 'Cleaning Tasks', icon: <ClipboardList size={16} /> },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { href: '/maintenance/dashboard', label: 'Maintenance Dashboard', icon: <Wrench size={16} />, end: true },
      { href: '/maintenance/tickets', label: 'Tickets', icon: <Wrench size={16} /> },
    ],
  },
]

/**
 * Keeps only the pages the staff member is allowed to open. Pages with no
 * permission section defined stay visible so nobody loses navigation.
 */
export function filterGroups(
  groups: PortalNavGroup[],
  allowed: (section: string) => boolean,
): PortalNavGroup[] {
  return groups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        const section = sectionForPath(item.href)
        return !section || allowed(section)
      }),
    }))
    .filter(group => group.items.length > 0)
}
