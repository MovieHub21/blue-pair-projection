import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { buildMetadata } from '../../../../../lib/buildMetadata'
import JsonLd, { breadcrumbJsonLd } from '../../../../../components/JsonLd'
import { SITE_URL } from '../../../../../lib/siteConfig'
import { getRoomTypes, getRoomTypeBySlug, getRoomBySlug } from '../../../../../lib/data'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { naira } from '../../../../../lib/format'
import ImageCarousel from '../../../../../components/ui/ImageCarousel'

export async function generateStaticParams(){
 const types=await getRoomTypes(); const out:{slug:string;roomSlug:string}[]=[]
 for(const t of types){ const {data}=await (await import('../../../../../lib/supabase/server')).createSupabasePublicClient().from('rooms').select('slug').eq('room_type_id',t.id); for(const r of data??[])out.push({slug:t.slug,roomSlug:r.slug}) }
 return out
}
export async function generateMetadata({params}:{params:{slug:string;roomSlug:string}}):Promise<Metadata>{
 const type=await getRoomTypeBySlug(params.slug); if(!type)return buildMetadata({title:'Room Not Found',description:'Room not found',path:`/rooms/${params.slug}/${params.roomSlug}`,noindex:true}); const unit=await getRoomBySlug(type.id,params.roomSlug); if(!unit)return buildMetadata({title:'Room Not Found',description:'Room not found',path:`/rooms/${params.slug}/${params.roomSlug}`,noindex:true})
 const name=unit.name||`Room ${unit.room_number}`; return buildMetadata({title:`${name} — ${type.name} | Blue Pair Hotel Uromi`,description:`Stay in ${name}, a ${type.name} at Blue Pair Hotel, Uromi, Edo State. ${type.description} Enjoy ${type.amenities.slice(0,6).join(', ')}. From ₦${type.price.toLocaleString()} per night.`,keywords:`${name.toLowerCase()} blue pair hotel, ${type.name.toLowerCase()} room uromi, room ${unit.room_number} uromi, hotel room edo state`,path:`/rooms/${params.slug}/${params.roomSlug}`,image:unit.image_url||type.images[0]})
}
export default async function IndividualRoomPage({params}:{params:{slug:string;roomSlug:string}}){
 const type=await getRoomTypeBySlug(params.slug); if(!type)notFound(); const unit=await getRoomBySlug(type.id,params.roomSlug); if(!unit)notFound(); const name=unit.name||`Room ${unit.room_number}`; const available=unit.status==='available'; const crumbs=[{name:'Home',path:'/'},{name:'Rooms & Suites',path:'/rooms'},{name:type.name,path:`/rooms/${type.slug}`},{name,path:`/rooms/${type.slug}/${unit.slug}`}]
 const data={'@context':'https://schema.org','@type':'HotelRoom',name,description:type.description,image:unit.image_url||type.images[0],occupancy:{'@type':'QuantitativeValue',value:type.guests},amenityFeature:type.amenities.map(a=>({'@type':'LocationFeatureSpecification',name:a,value:true})),offers:{'@type':'Offer',price:type.price,priceCurrency:'NGN',availability:available?'https://schema.org/InStock':'https://schema.org/SoldOut',url:`${SITE_URL}/rooms/${type.slug}/${unit.slug}`}}
 const gallery=type.images?.length?type.images:[unit.image_url].filter(Boolean) as string[]
 return <div className="container-w px-6 md:px-10 py-8"><JsonLd data={[breadcrumbJsonLd(crumbs,SITE_URL),data]}/><Link href={`/rooms/${type.slug}`} className="text-xs text-navy-400">← Back to {type.name}</Link><div className="grid lg:grid-cols-[1.4fr,.6fr] gap-10 mt-5"><div><ImageCarousel images={gallery} alt={`${name}, ${type.name}, Blue Pair Hotel`} className="h-[500px] rounded-2xl" showArrows showDots showCounter /><span className="eyebrow mt-8 inline-block">{type.category} · Room {unit.room_number}</span><h1 className="text-4xl font-semibold mt-2">{name}</h1><p className="text-navy-500 leading-relaxed mt-4">{type.description}</p><h2 className="text-xl font-semibold mt-10 mb-4">Amenities</h2><div className="grid sm:grid-cols-2 gap-3">{type.amenities.map(a=><div key={a} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="text-gold-500"/>{a}</div>)}</div></div><aside className="card p-6 h-fit sticky top-24"><div className="text-xs text-navy-400 mb-2">Room rate</div><b className="font-display text-3xl">{naira(type.price)}</b><span className="text-xs text-navy-400"> / night</span><div className={`mt-5 rounded-lg px-3 py-2 text-sm font-semibold ${available?'bg-emerald-50 text-emerald-700':'bg-red-50 text-red-700'}`}>{available?'Available to book':'Currently unavailable'}</div>{available&&<Link href={`/booking?room=${type.slug}&unit=${unit.id}`} className="btn-primary w-full justify-center mt-5">Book {name} <ArrowRight size={15}/></Link>}</aside></div></div>
}
