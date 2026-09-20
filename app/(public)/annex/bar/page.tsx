import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getDrinks, getAmenity } from '../../../../lib/data'
import { getMyCustomer } from '../../../../lib/account'
import { createSupabaseAdminClient } from '../../../../lib/supabase/admin'
import AnnexMenuExperience from '../../../../components/annex/AnnexMenuExperience'

export const metadata = buildMetadata({
  title: 'Annex Bar Drinks Menu in Uromi, Edo State | Blue Pair Hotel',
  description: 'Explore drinks at the Blue Pair Hotel Annex Bar in Uromi, Edo State, with a browsable menu of available selections.',
  keywords: 'annex bar uromi, drinks menu uromi, bar uromi, blue pair annex bar, drinks edo state',
  path: '/annex/bar',
})

export default async function AnnexBarPage() {
  const [drinks, amenity, customer] = await Promise.all([getDrinks(), getAmenity('annex-bar'), getMyCustomer()])
  const activeBookings: { id: string; type: 'room' | 'short_let'; label: string; reference: string }[] = []
  if (customer?.id) {
    const admin = createSupabaseAdminClient()
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' })
    const { data: bookings } = await admin.from('bookings').select('id,reference,check_in,check_out,status,payment_status,room_id,short_let_id').eq('customer_id', customer.id).in('status', ['confirmed','checked_in']).eq('payment_status','paid').lte('check_in',today).gt('check_out',today).order('check_in',{ascending:false})
    const roomIds = (bookings ?? []).map(b => b.room_id).filter(Boolean)
    const shortLetIds = (bookings ?? []).map(b => b.short_let_id).filter(Boolean)
    const [{ data: rooms }, { data: shortLets }] = await Promise.all([
      roomIds.length ? admin.from('rooms').select('id,room_number').in('id', roomIds) : Promise.resolve({ data: [] as any[] }),
      shortLetIds.length ? admin.from('short_lets').select('id,name').in('id', shortLetIds) : Promise.resolve({ data: [] as any[] }),
    ])
    for (const booking of bookings ?? []) {
      if (booking.room_id) {
        const room = (rooms ?? []).find(r => r.id === booking.room_id)
        if (room?.room_number) activeBookings.push({ id: booking.id, type: 'room', label: `Room ${room.room_number}`, reference: booking.reference })
      } else if (booking.short_let_id) {
        const property = (shortLets ?? []).find(s => s.id === booking.short_let_id)
        if (property?.name) activeBookings.push({ id: booking.id, type: 'short_let', label: property.name, reference: booking.reference })
      }
    }
  }
  const items = drinks.filter(d => d.bar === 'Annex Bar')
  const breadcrumbs = [{ name: 'Home', path: '/' }, { name: 'The Annex', path: '/annex' }, { name: 'Annex Bar', path: '/annex/bar' }]
  const barJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BarOrPub',
    '@id': `${SITE_URL}/annex/bar#bar`,
    name: amenity?.name || 'Annex Bar',
    url: `${SITE_URL}/annex/bar`,
  }
  return (
    <>
      <JsonLd data={[breadcrumbJsonLd(breadcrumbs, SITE_URL), barJsonLd]} />
      <AnnexMenuExperience mode="bar" eyebrow={amenity?.eyebrow || 'Drinks & nightlife'} title={amenity?.name || 'Annex Bar'} description={amenity?.description || 'A relaxed Annex bar for drinks, conversation and late-evening atmosphere.'} heroImage={amenity?.heroImage || ''} items={items} activeBookings={activeBookings} />
    </>
  )
}
