'use client'

import { useState } from 'react'

export default function Hotel3DHero() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5
    setTilt({ x: y * -5, y: x * 7 })
  }

  return (
    <div
      className="absolute inset-0 flex items-center justify-center md:justify-end px-5 md:px-10 lg:px-16 pointer-events-none"
      style={{ perspective: '1400px' }}
      onPointerMove={handleMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <div
        className="relative w-[330px] sm:w-[420px] md:w-[500px] lg:w-[590px] h-[430px] sm:h-[500px] md:h-[570px] transition-transform duration-300 ease-out pointer-events-auto"
        style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(-1deg)`, transformStyle: 'preserve-3d' }}
        aria-label="Stylized three-dimensional Blue Pair hotel"
      >
        <div className="absolute inset-x-8 bottom-7 h-10 rounded-[50%] bg-black/40 blur-2xl" style={{ transform: 'translateZ(-60px)' }} />

        {/* Main hotel tower */}
        <div className="absolute right-8 bottom-16 w-[72%] h-[78%] rounded-t-[18px] bg-gradient-to-br from-[#dce1e8] via-[#aeb7c3] to-[#6f7b89] border border-white/40 shadow-2xl overflow-hidden" style={{ transform: 'translateZ(30px)' }}>
          <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/70 to-transparent" />
          <div className="absolute inset-x-5 top-8 grid grid-cols-5 gap-3 opacity-90">
            {Array.from({ length: 35 }).map((_, i) => (
              <span key={i} className="h-9 rounded-[3px] border border-white/20 bg-gradient-to-br from-[#d9eef2] via-[#7195a8] to-[#263f52] shadow-inner" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#16263a] via-[#263c52] to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-28 h-28 rounded-t-full bg-gradient-to-b from-[#b7d7df] to-[#314c61] border border-white/25" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-16 rounded-t bg-[#17283b]" />
        </div>

        {/* Side wing */}
        <div className="absolute left-5 bottom-16 w-[46%] h-[52%] rounded-t-[14px] bg-gradient-to-br from-[#cbd2da] via-[#919ca9] to-[#596574] border border-white/30 shadow-xl overflow-hidden" style={{ transform: 'translateZ(10px) rotateY(8deg)' }}>
          <div className="absolute inset-4 grid grid-cols-4 gap-3 opacity-90">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="h-8 rounded-[3px] border border-white/20 bg-gradient-to-br from-[#d9eef2] via-[#6f94a7] to-[#263f52]" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#17283b] to-transparent" />
        </div>

        {/* Entrance */}
        <div className="absolute left-[20%] bottom-[12%] w-[45%] h-[18%] rounded-t-xl bg-gradient-to-b from-[#1d354d] to-[#071525] border border-white/20 shadow-2xl" style={{ transform: 'translateZ(75px)' }}>
          <div className="absolute inset-2 rounded-lg border border-white/10 bg-gradient-to-b from-[#7eabb8]/70 to-[#10283d]/90" />
          <div className="absolute inset-x-7 bottom-0 h-2 bg-[#d3a54d] rounded-full shadow-[0_0_18px_rgba(211,165,77,.6)]" />
        </div>

        {/* Roof / crown */}
        <div className="absolute right-[12%] top-[9%] w-[48%] h-12 bg-gradient-to-r from-[#b88a32] via-[#f0cc79] to-[#8d6423] shadow-xl rounded-t-[50%]" style={{ transform: 'translateZ(42px) rotateX(-8deg)' }} />
        <div className="absolute right-[28%] top-[4%] w-2 h-20 bg-[#d7ae58] rounded-full" style={{ transform: 'translateZ(50px)' }} />
        <div className="absolute right-[26%] top-[2%] w-6 h-6 rounded-full bg-[#e5c477] shadow-[0_0_20px_rgba(229,196,119,.65)]" style={{ transform: 'translateZ(55px)' }} />

        {/* Pool / forecourt */}
        <div className="absolute left-[4%] right-[2%] bottom-[3%] h-[17%] rounded-[50%] bg-gradient-to-br from-[#9ed5dd] via-[#427f94] to-[#15374d] border border-white/25 shadow-2xl" style={{ transform: 'rotateX(58deg) translateZ(5px)' }}>
          <div className="absolute inset-5 rounded-[50%] border border-white/20" />
          <div className="absolute left-[20%] top-[30%] w-20 h-2 rounded-full bg-white/30 blur-sm" />
        </div>

        {/* Floating brand plaque */}
        <div className="absolute left-0 top-[20%] rounded-2xl border border-white/20 bg-[#08172b]/75 backdrop-blur-xl px-5 py-4 shadow-2xl" style={{ transform: 'translateZ(90px)' }}>
          <div className="text-[9px] uppercase tracking-[0.28em] text-[#e2bd69]">Blue Pair</div>
          <div className="mt-1 text-sm font-semibold text-white">Signature Crown</div>
          <div className="mt-1 text-[10px] text-white/50">Uromi · Edo State</div>
        </div>

        {/* Ground lights */}
        <div className="absolute left-[9%] bottom-[15%] w-3 h-3 rounded-full bg-[#e8c46d] shadow-[0_0_22px_rgba(232,196,109,.9)]" style={{ transform: 'translateZ(85px)' }} />
        <div className="absolute right-[4%] bottom-[19%] w-3 h-3 rounded-full bg-[#e8c46d] shadow-[0_0_22px_rgba(232,196,109,.9)]" style={{ transform: 'translateZ(85px)' }} />
      </div>
    </div>
  )
}
