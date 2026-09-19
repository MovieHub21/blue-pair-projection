import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildMetadata } from '../../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../../components/JsonLd'
import { SITE_URL } from '../../../../../lib/siteConfig'
import { getRoomTypes, getRoomTypeBySlug, getRoomBySlug } from '../../../../../lib/data'
import IndividualRoomClient from './IndividualRoomClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateStaticParams(){
 const types=await getRoomTypes(); const out:{slug:string;roomSlug:string}[]=[]
 for(const t of types){ const {data}=await (await import('../../../../../lib/supabase/server')).createSupabasePublicClient().from('rooms').select('slug').eq('room_type_id',t.id); for(const r of data??[])out.push({slug:t.slug,roomSlug:r.slug}) }
 return out
}

export async function generateMetadata({params}:{params:{slug:string;roomSlug:string}}):Promise<Metadata>{
 const type=await getRoomTypeBySlug(params.slug); if(!type)return buildMetadata({title:'Room Not Found',description:'Room not found',path:`/rooms/${params.slug}/${params.roomSlug}`,noindex:true})
 const unit=await getRoomBySlug(type.id,params.roomSlug); if(!unit)return buildMetadata({title:'Room Not Found',description:'Room not found',path:`/rooms/${params.slug}/${params.roomSlug}`,noindex:true})
 const name=unit.name||`Room ${unit.room_number}`
 return buildMetadata({title:`${name} — ${type.name} | Blue Pair Hotel Uromi`,description:`Stay in ${name}, a ${type.name} at Blue Pair Hotel, Uromi, Edo State. ${type.description} Enjoy ${type.amenities.slice(0,6).join(', ')}. From ₦${type.price.toLocaleString()} per night.`,keywords:`${name.toLowerCase()} blue pair hotel, ${type.name.toLowerCase()} room uromi, room ${unit.room_number} uromi, hotel room edo state`,path:`/rooms/${params.slug}/${params.roomSlug}`,image:unit.image_url||type.images[0]})
}

export default async function IndividualRoomPage({params}:{params:{slug:string;roomSlug:string}}){
 const type=await getRoomTypeBySlug(params.slug); if(!type)notFound()
 const unit=await getRoomBySlug(type.id,params.roomSlug); if(!unit)notFound()
 const name=unit.name||`Room ${unit.room_number}`
 const crumbs=[{name:'Home',path:'/'},{name:'Rooms & Suites',path:'/rooms'},{name:type.name,path:`/rooms/${type.slug}`},{name,path:`/rooms/${type.slug}/${unit.slug}`}]
 const data={'@context':'https://schema.org','@type':'HotelRoom',name,description:type.description,image:unit.image_url||type.images[0],occupancy:{'@type':'QuantitativeValue',value:type.guests},amenityFeature:type.amenities.map(a=>({'@type':'LocationFeatureSpecification',name:a,value:true})),offers:{'@type':'Offer',price:type.price,priceCurrency:'NGN',availability:'https://schema.org/InStock',url:`${SITE_URL}/rooms/${type.slug}/${unit.slug}`}}
 return <><JsonLd data={[breadcrumbJsonLd(crumbs,SITE_URL),data]}/><IndividualRoomClient type={type} unit={unit as any}/></>
}
