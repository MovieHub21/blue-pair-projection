'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Users, BedDouble, Ruler, CheckCircle2, ArrowRight } from 'lucide-react'
import { naira, todayISO, addDaysISO } from '../../../../lib/format'
import RoomCard from '../../../../components/ui/RoomCard'
import ImageCarousel from '../../../../components/ui/ImageCarousel'
import type { RoomType } from '../../../../data/mock'
import { onAvailabilityChange } from '../../../../lib/availabilityRealtime'

// A physical room carries no photos of its own — it always shows the room type's images.
type Unit={id:string;room_number:string;name:string;slug:string;status:string;floor?:string}
type AvailabilityUnit=Unit & {guest_status?:'available'|'availableSoon'|'taken'|'held'|'reserved';available_from?:string|null}

function initialGuestStatus(unit: Unit): AvailabilityUnit['guest_status'] {
 return unit.status === 'available_soon' ? 'availableSoon' : 'available'
}

export default function RoomDetailsClient({room,units,others,availability}:{room:RoomType;units:Unit[];others:RoomType[];availability:Record<string,number>}){
 const params=useSearchParams()
 const [checkIn,setCheckIn]=useState(params.get('checkin')||todayISO()); const [checkOut,setCheckOut]=useState(params.get('checkout')||addDaysISO(2)); const [liveUnits,setLiveUnits]=useState<AvailabilityUnit[]>(() => units.map(u => ({...u,guest_status:initialGuestStatus(u)}))); const [checking,setChecking]=useState(false)
 const nights=Math.max(1,Math.round((new Date(checkOut).getTime()-new Date(checkIn).getTime())/86400000)); const total=room.price*nights; const tax=Math.round(total*.075)
 const [roomFilter, setRoomFilter] = useState<'available' | 'all'>('available');
const [showAllRooms, setShowAllRooms] = useState(false);
const [mobileRoomIndex, setMobileRoomIndex] = useState(0);

 useEffect(()=>{
  if(!checkIn||!checkOut||checkIn>=checkOut)return
  setChecking(true)
  fetch(`/api/public/availability?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}&roomTypeId=${encodeURIComponent(room.id)}&_=${Date.now()}`,{cache:'no-store'})
   .then(r=>r.ok?r.json():null).then(data=>{if(data?.rooms)setLiveUnits(data.rooms);}).catch(()=>{}).finally(()=>setChecking(false))
  const refresh=()=>{setChecking(true);fetch(`/api/public/availability?checkin=${encodeURIComponent(checkIn)}&checkout=${encodeURIComponent(checkOut)}&roomTypeId=${encodeURIComponent(room.id)}&_=${Date.now()}`,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{if(data?.rooms)setLiveUnits(data.rooms)}).catch(()=>{}).finally(()=>setChecking(false))}
  return onAvailabilityChange(refresh)
 },[checkIn,checkOut,room.id])

 const availableCount=liveUnits.filter(u=>u.guest_status==='available').length

 return <div className="container-w px-6 md:px-10 py-8">
  <div className="text-xs text-navy-400 mb-5">Home / Rooms & Suites / {room.name}</div>
  <div className="grid lg:grid-cols-[1.35fr,.65fr] gap-10 items-start">
   <div>
    <ImageCarousel images={room.images} alt={room.name} className="h-[420px] rounded-2xl" autoPlay interval={5500} transition="fade" showArrows showDots />
    <h1 className="text-3xl md:text-4xl font-semibold mt-8">{room.name}</h1>
    <p className="text-navy-500 mt-4 leading-relaxed max-w-2xl">{room.description}</p>
    <div className="flex flex-wrap gap-8 py-6 my-6 border-y border-black/10"><div className="flex gap-2"><Users size={18} className="text-gold-500"/><b>{room.guests} guests</b></div><div className="flex gap-2"><BedDouble size={18} className="text-gold-500"/><b>{room.bedType}</b></div><div className="flex gap-2"><Ruler size={18} className="text-gold-500"/><b>{room.sizeSqm} m²</b></div></div>
    <h3 className="text-lg font-semibold mb-4">Amenities</h3><div className="grid sm:grid-cols-2 gap-3 mb-10">{room.amenities.map(a=><div key={a} className="flex gap-2 text-sm"><CheckCircle2 size={16} className="text-gold-500"/>{a}</div>)}</div>
   <div>
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
    <div>
  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
    <div>
      <h2 className="text-2xl font-semibold">Choose your room</h2>
      <p className="text-sm text-navy-400 mt-1">
        {checking
          ? 'Checking dates…'
          : `${availableCount} of ${liveUnits.length} rooms available for your dates`}
      </p>
    </div>

    {/* Room filter */}
    <div className="inline-flex items-center self-start sm:self-auto rounded-full bg-navy-50 p-1">
      <button
        type="button"
        onClick={() => {
          setRoomFilter('available');
          setShowAllRooms(false);
          setMobileRoomIndex(0);
        }}
        className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
          roomFilter === 'available'
            ? 'bg-navy-900 text-white shadow-sm'
            : 'text-navy-500 hover:text-navy-800'
        }`}
      >
        Available
      </button>

      <button
        type="button"
        onClick={() => {
          setRoomFilter('all');
          setShowAllRooms(false);
          setMobileRoomIndex(0);
        }}
        className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
          roomFilter === 'all'
            ? 'bg-navy-900 text-white shadow-sm'
            : 'text-navy-500 hover:text-navy-800'
        }`}
      >
        All rooms
      </button>
    </div>
  </div>

  {(() => {
    const filteredUnits = liveUnits.filter(u => {
      const state = u.guest_status || initialGuestStatus(u);

      return roomFilter === 'available'
        ? state === 'available'
        : true;
    });

    const visibleUnits = showAllRooms
      ? filteredUnits
      : filteredUnits.slice(0, 3);

    return (
      <>
        {visibleUnits.length > 0 ? (
          <>
            {/* MOBILE: swipeable room carousel */}
            <div className="sm:hidden -mx-4 overflow-hidden">
              <div
                className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 scrollbar-none"
                onScroll={e => {
                  const el = e.currentTarget;
                  const firstCard = el.firstElementChild as HTMLElement | null;

                  if (!firstCard) return;

                  const cardWidth = firstCard.offsetWidth + 12;
                  const index = Math.round(el.scrollLeft / cardWidth);

                  setMobileRoomIndex(
                    Math.max(0, Math.min(index, visibleUnits.length - 1))
                  );
                }}
              >
                {visibleUnits.map(u => {
                  const state = u.guest_status || initialGuestStatus(u);
                  const ok = state === 'available';
                  const blocked = state !== 'available';
                  const unavailableSoon = state === 'availableSoon';

                  const roomContent = (
                    <>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                        <img
                          loading="lazy"
                          decoding="async"
                          src={room.images[0]}
                          alt={u.name || `Room ${u.room_number}`}
                          className={`w-full h-full object-cover transition-transform duration-500 ${
                            ok ? 'group-hover:scale-[1.03]' : 'grayscale opacity-40'
                          }`}
                        />

                        {ok && (
                          <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-navy-950/75 backdrop-blur-sm px-2.5 py-1 text-[10px] text-white">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                            Available
                          </span>
                        )}

                        {blocked && (
                          <span className="absolute top-3 right-3 rounded-full bg-navy-950/75 backdrop-blur-sm px-2.5 py-1 text-[10px] text-white">
                            {unavailableSoon
                              ? 'Available Soon'
                              : 'Unavailable'}
                          </span>
                        )}
                      </div>

                      <div className="pt-3 px-1 pb-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">
                              Room {u.room_number}
                            </h3>

                            <p className="text-xs text-navy-400 mt-1 truncate">
                              {u.name || room.name} · Floor {u.floor || '—'}
                            </p>
                          </div>

                          {ok && (
                            <ArrowRight
                              size={15}
                              className="shrink-0 text-navy-400"
                            />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-navy-400">
                          {room.bedType && <span>{room.bedType}</span>}
                          {room.guests && (
                            <span>{room.guests} Guests</span>
                          )}
                        </div>
                      </div>
                    </>
                  );

                  return ok ? (
                    <Link
                      key={u.id}
                      href={`/rooms/${room.slug}/${u.slug}?checkin=${encodeURIComponent(
                        checkIn
                      )}&checkout=${encodeURIComponent(checkOut)}`}
                      className="group block shrink-0 basis-[82%] snap-center"
                    >
                      {roomContent}
                    </Link>
                  ) : (
                    <div
                      key={u.id}
                      aria-disabled="true"
                      className={`shrink-0 basis-[82%] snap-center select-none cursor-not-allowed ${
                        unavailableSoon ? 'opacity-60' : 'opacity-45'
                      }`}
                    >
                      {roomContent}
                    </div>
                  );
                })}
              </div>

              {/* Mobile carousel indicators */}
              {visibleUnits.length > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-3">
                  {visibleUnits.map((_, index) => (
                    <span
                      key={index}
                      className={`h-1.5 rounded-full transition-all ${
                        index === mobileRoomIndex
                          ? 'w-5 bg-navy-800'
                          : 'w-1.5 bg-navy-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* DESKTOP / TABLET: normal grid */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleUnits.map(u => {
                const state = u.guest_status || initialGuestStatus(u);
                const ok = state === 'available';
                const blocked = state !== 'available';
                const unavailableSoon = state === 'availableSoon';

                const roomContent = (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={room.images[0]}
                        alt={u.name || `Room ${u.room_number}`}
                        className={`w-full h-full object-cover transition-transform duration-500 ${
                          ok
                            ? 'group-hover:scale-[1.03]'
                            : 'grayscale opacity-40'
                        }`}
                      />

                      {ok && (
                        <span className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-navy-950/75 backdrop-blur-sm px-2.5 py-1 text-[10px] text-white">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                          Available
                        </span>
                      )}

                      {blocked && (
                        <span className="absolute top-3 right-3 rounded-full bg-navy-950/75 backdrop-blur-sm px-2.5 py-1 text-[10px] text-white">
                          {unavailableSoon
                            ? 'Available Soon'
                            : 'Unavailable'}
                        </span>
                      )}
                    </div>

                    <div className="pt-3 px-1 pb-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">
                            Room {u.room_number}
                          </h3>

                          <p className="text-xs text-navy-400 mt-1 truncate">
                            {u.name || room.name} · Floor {u.floor || '—'}
                          </p>
                        </div>

                        {ok && (
                          <ArrowRight
                            size={15}
                            className="shrink-0 text-navy-400 group-hover:text-gold-500 transition-colors"
                          />
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] text-navy-400">
                        {room.bedType && <span>{room.bedType}</span>}
                        {room.guests && (
                          <span>{room.guests} Guests</span>
                        )}
                      </div>
                    </div>
                  </>
                );

                return ok ? (
                  <Link
                    key={u.id}
                    href={`/rooms/${room.slug}/${u.slug}?checkin=${encodeURIComponent(
                      checkIn
                    )}&checkout=${encodeURIComponent(checkOut)}`}
                    className="group block"
                  >
                    {roomContent}
                  </Link>
                ) : (
                  <div
                    key={u.id}
                    aria-disabled="true"
                    className={`select-none cursor-not-allowed ${
                      unavailableSoon ? 'opacity-60' : 'opacity-45'
                    }`}
                  >
                    {roomContent}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-10 text-center text-sm text-navy-400">
            {roomFilter === 'available'
              ? 'No rooms are available for these dates.'
              : 'No rooms found.'}
          </div>
        )}

        {filteredUnits.length > 3 && (
          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={() => {
                setShowAllRooms(prev => !prev);
                setMobileRoomIndex(0);
              }}
              className="text-sm font-medium text-navy-700 hover:text-gold-600 transition-colors"
            >
              {showAllRooms
                ? 'Show fewer rooms'
                : `See all ${filteredUnits.length} rooms`}
            </button>
          </div>
        )}
      </>
    );
  })()}
</div> 
</div> 
</div> 
</div>
   <aside className="card p-6 sticky top-24"><div className="flex items-baseline gap-2"><b className="font-display text-2xl">{naira(room.price)}</b><span className="text-xs text-navy-400">/ night</span></div><div className="h-px bg-black/10 my-5"/><label className="field-label">Check-in</label><input type="date" min={todayISO()} value={checkIn} onChange={e=>{setCheckIn(e.target.value);if(e.target.value>=checkOut)setCheckOut(addDaysISO(1,e.target.value))}} className="field-input mb-4"/><label className="field-label">Check-out</label><input type="date" min={addDaysISO(1,checkIn)} value={checkOut} onChange={e=>setCheckOut(e.target.value)} className="field-input mb-4"/><div className="flex justify-between text-sm"><span>{naira(room.price)} × {nights} nights</span><b>{naira(total)}</b></div><div className="flex justify-between text-sm mt-2"><span>Taxes & fees</span><b>{naira(tax)}</b></div><div className="flex justify-between font-semibold border-t border-black/10 mt-4 pt-4"><span>Total</span><b>{naira(total+tax)}</b></div>
    <div className="mt-5 rounded-xl bg-navy-50 border border-black/5 text-navy-600 text-sm p-4">Select a physical room above to see its specific details and the correct booking or reservation action.</div>
   </aside>
  </div>
  <h3 className="text-xl font-semibold mt-20 mb-5">Other room types</h3><div className="grid md:grid-cols-3 gap-6 pb-20">{others.map(r=><RoomCard key={r.id} room={r} availableCount={availability[r.id] ?? 0} showAvailabilityBadge={false}/>)}</div>
 </div>
} 