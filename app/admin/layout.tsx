import type { Metadata } from 'next'
import PortalShell, {
  type PortalNavGroup,
} from '../../components/layout/PortalShell'
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
} from 'lucide-react'
import { getCurrentStaff } from '../../lib/staff'
import { getMyPermissions } from '../../lib/permissions'
import { sectionForPath } from '../../lib/permissionSections'
import StoreLoader from '../../components/providers/StoreLoader'

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

const ALL_GROUPS: PortalNavGroup[] = [
  {
    label: 'Overview',
    items: [
      {
        href: '/admin/dashboard',
        label: 'Dashboard',
        icon: <LayoutGrid size={16} />,
        end: true,
      },
    ],
  },

  {
    label: 'Operations',
    items: [
      {
        href: '/admin/bookings',
        label: 'Bookings',
        icon: <CalendarCheck size={16} />,
      },
      {
        href: '/admin/rooms',
        label: 'Room Management',
        icon: <BedDouble size={16} />,
      },
      {
        href: '/admin/availability',
        label: 'Room Availability',
        icon: <Grid3x3 size={16} />,
      },
      {
        href: '/admin/checkins',
        label: 'Check-in',
        icon: <LogIn size={16} />,
      },
      {
        href: '/admin/checkouts',
        label: 'Check-out',
        icon: <LogOut size={16} />,
      },
      {
        href: '/admin/customers',
        label: 'Customers',
        icon: <Users size={16} />,
      },
      {
        href: '/admin/payments',
        label: 'Payments',
        icon: <CreditCard size={16} />,
      },
    ],
  },

  {
    label: 'Outlets',
    items: [
      {
        href: '/admin/restaurant',
        label: 'Restaurant',
        icon: <UtensilsCrossed size={16} />,
      },
      {
        href: '/admin/menu',
        label: 'Menu Management',
        icon: <ClipboardList size={16} />,
      },
      {
        href: '/admin/bar',
        label: 'Bar Management',
        icon: <Martini size={16} />,
      },
      {
        href: '/admin/amenities/vip-lounge',
        label: 'VIP Lounge',
        icon: <MonitorPlay size={16} />,
      },
      {
        href: '/admin/amenities/gym',
        label: 'Gym',
        icon: <MonitorPlay size={16} />,
      },
      {
        href: '/admin/amenities/pool',
        label: 'Pool',
        icon: <MonitorPlay size={16} />,
      },
      {
        href: '/admin/amenities/games',
        label: 'Games',
        icon: <MonitorPlay size={16} />,
      },
      {
        href: '/admin/amenities/club',
        label: 'Club',
        icon: <MonitorPlay size={16} />,
      },
      {
        href: '/admin/annex',
        label: 'Annex Management',
        icon: <Building2 size={16} />,
      },
      {
        href: '/admin/shortlets',
        label: 'Short-lets',
        icon: <Building2 size={16} />,
      },
      {
        href: '/admin/events',
        label: 'Events',
        icon: <PartyPopper size={16} />,
      },
      {
        href: '/admin/billboards',
        label: 'Billboards',
        icon: <Image size={16} />,
      },
      {
        href: '/admin/parking',
        label: 'Parking',
        icon: <Car size={16} />,
      },
      {
        href: '/admin/offers',
        label: 'Offers & Promos',
        icon: <Tag size={16} />,
      },
    ],
  },

  {
    label: 'Content',
    items: [
      {
        href: '/admin/gallery',
        label: 'Gallery',
        icon: <Image size={16} />,
      },
      {
        href: '/admin/website',
        label: 'Website Content',
        icon: <FileCode size={16} />,
      },
      {
        href: '/admin/seo',
        label: 'SEO',
        icon: <Search size={16} />,
      },
    ],
  },

  {
    label: 'Team',
    items: [
      {
        href: '/admin/staff',
        label: 'Staff Management',
        icon: <UserCog size={16} />,
      },
      {
        href: '/admin/permissions',
        label: 'Permissions',
        icon: <ShieldCheck size={16} />,
      },
    ],
  },

  {
    label: 'Insights',
    items: [
      {
        href: '/admin/reports/revenue',
        label: 'Reports',
        icon: <BarChart3 size={16} />,
      },
    ],
  },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { name, roleLabel } = await getCurrentStaff()
  const { allowed } = await getMyPermissions()

  const groups = ALL_GROUPS
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const section = sectionForPath(item.href)

        // Routes without a defined permission section remain visible.
        // Routes with a permission section are checked against the
        // current staff member's permissions.
        return !section || allowed(section)
      }),
    }))
    .filter((group) => group.items.length > 0)

  return (
    <>
      <StoreLoader />

      <PortalShell
        portalName="Admin"
        portalTag="Hotel Management"
        userName={name}
        userRole={roleLabel}
        groups={groups}
      >
        {children}
      </PortalShell>
    </>
  )
}