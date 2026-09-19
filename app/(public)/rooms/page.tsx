import { Suspense } from 'react'
import { buildMetadata } from '../../../lib/buildMetadata'
import JsonLd,{breadcrumbJsonLd} from '../../../components/JsonLd'
import {SITE_URL} from '../../../lib/siteConfig'
import PageHero from '../../../components/layout/PageHero'
import {getRoomTypes,getRooms} from '../../../lib/data'
import RoomsClient from './RoomsClient'
import BookingDateFilter from '../../../components/booking/BookingDateFilter'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const metadata=buildMetadata({title:'Hotel Rooms & Suites in Uromi, Edo State | Prices & Online Booking',
    description:'Browse Blue Pair Hotel rooms and suites in Uromi, Edo State. See live room availability, guest capacity and book online.',
    keywords:'hotel rooms uromi, book hotel room edo state, uromi hotel rooms, hotel room prices uromi',
    path:'/rooms'})
const breadcrumbs=[{name:'Home',path:'/'},
    {name:'Rooms & Suites',path:'/rooms'}]
export default async function RoomsPage(){const [roomTypes,rooms]=await Promise.all([getRoomTypes(),getRooms()]);return <div><JsonLd data={breadcrumbJsonLd(breadcrumbs,SITE_URL)}/><PageHero image="https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1600&q=80" eyebrow="Accommodation" title="Rooms & Suites" crumbs="Home / Rooms & Suites"/><BookingDateFilter/><Suspense><RoomsClient roomTypes={roomTypes.filter(r=>r.active)} rooms={rooms}/></Suspense></div>}
