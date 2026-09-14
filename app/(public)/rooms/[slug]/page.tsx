import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildMetadata } from '../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../components/JsonLd'
import { SITE_URL } from '../../../../lib/siteConfig'
import { getRoomTypes, getRoomTypeBySlug, getRoomsByType, getRooms } from '../../../../lib/data'
import RoomDetailsClient from './RoomDetailsClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateStaticParams(){ return (await getRoomTypes()).map(r=>({slug:r.slug})) }
export async function generateMetadata({params}:{params:{slug:string}}):Promise<Metadata>{
 const room=await getRoomTypeBySlug(params.slug); if(!room)return buildMetadata({title:'Room Not Found',description:'This room type could not be found.',path:`/rooms/${params.slug}`,noindex:true})
 return buildMetadata({title:`${room.name} in Uromi, Edo State — ₦${room.price.toLocaleString()}/night | Blue Pair Hotel`,description:`${room.description} Sleeps ${room.guests}, ${room.bedType}, ${room.sizeSqm}m². Explore available ${room.name} rooms at Blue Pair Hotel, Uromi, Edo State.`,keywords:`${room.name.toLowerCase()} uromi, blue pair hotel ${room.name.toLowerCase()}, hotel room uromi price`,path:`/rooms/${room.slug}`,image:room.images[0]})
}
export default async function RoomDetailsPage({params}:{params:{slug:string}}){
 const room=await getRoomTypeBySlug(params.slug); if(!room)notFound()
 const [units,allRooms]=await Promise.all([getRoomsByType(room.id),getRooms()])
 const others=(await getRoomTypes()).filter(r=>r.id!==room.id&&r.active).slice(0,3)
 const availability=Object.fromEntries(others.map(r=>[r.id,allRooms.filter((u:any)=>u.roomTypeId===r.id&&u.status==='available').length]))
 const breadcrumbs=[{name:'Home',path:'/'},{name:'Rooms & Suites',path:'/rooms'},{name:room.name,path:`/rooms/${room.slug}`}]
 const jsonld={'@context':'https://schema.org','@type':'HotelRoom',name:room.name,description:room.description,image:room.images,occupancy:{'@type':'QuantitativeValue',value:room.guests},offers:{'@type':'Offer',price:room.price,priceCurrency:'NGN',availability:units.some((u:any)=>u.status==='available')?'https://schema.org/InStock':'https://schema.org/SoldOut',url:`${SITE_URL}/rooms/${room.slug}`}}
 return <><JsonLd data={[breadcrumbJsonLd(breadcrumbs,SITE_URL),jsonld]}/><Suspense><RoomDetailsClient room={room} units={units} others={others} availability={availability}/></Suspense></>
}
