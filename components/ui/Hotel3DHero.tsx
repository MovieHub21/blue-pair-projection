'use client'

import { useState } from 'react'

export default function Hotel3DHero() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    setTilt({
      x: y * -7,
      y: x * 10,
    })
  }

  const resetTilt = () => setTilt({ x: 0, y: 0 })

  return (
    <div
      className="absolute inset-0 flex items-center justify-center md:justify-end px-4 md:px-8 lg:px-14 pointer-events-none overflow-hidden"
      style={{ perspective: '1600px' }}
    >
      <div
        className="relative w-[330px] sm:w-[430px] md:w-[530px] lg:w-[620px] h-[420px] sm:h-[510px] md:h-[600px] transition-transform duration-300 ease-out pointer-events-auto touch-none cursor-grab active:cursor-grabbing"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(-1deg)`,
          transformStyle: 'preserve-3d',
        }}
        onPointerMove={handleMove}
        onPointerLeave={resetTilt}
        aria-label="Interactive three-dimensional Blue Pair hotel"
      >
        <div className="absolute inset-x-8 bottom-5 h-12 rounded-[50%] bg-black/45 blur-3xl" style={{ transform: 'translateZ(-80px)' }} />

        <div className="absolute right-7 bottom-20 w-[68%] h-[76%] rounded-t-[22px] bg-gradient-to-br from-[#e8ebee] via-[#aeb8c3] to-[#596676] border border-white/45 shadow-2xl overflow-hidden" style={{ transform: 'translateZ(28px)' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-black/20" />
          <div className="absolute inset-x-5 top-8 grid grid-cols-5 gap-3 opacity-95">
            {Array.from({ length: 35 }).map((_, i) => (
              <span key={i} className="h-9 rounded-[4px] border border-white/25 bg-gradient-to-br from-[#e5f4f5] via-[#7396a8] to-[#23394c] shadow-inner" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#101f31] via-[#20374b]/90 to-transparent" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-32 h-32 rounded-t-full bg-gradient-to-b from-[#b8d8df] to-[#29465a] border border-white/30 shadow-inner" />
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-16 rounded-t bg-[#0d1d2e]" />
        </div>

        <div className="absolute left-4 bottom-20 w-[45%] h-[50%] rounded-t-[18px] bg-gradient-to-br from-[#d7dce1] via-[#929eaa] to-[#566372] border border-white/35 shadow-xl overflow-hidden" style={{ transform: 'translateZ(12px) rotateY(7deg)' }}>
          <div className="absolute inset-5 grid grid-cols-4 gap-3 opacity-90">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="h-8 rounded-[4px] border border-white/20 bg-gradient-to-br from-[#e0f1f2] via-[#7193a5] to-[#263d50] shadow-inner" />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#142538] to-transparent" />
        </div>

        <div className="absolute left-[19%] bottom-[11%] w-[46%] h-[18%] rounded-t-2xl bg-gradient-to-b from-[#203c54] to-[#071526] border border-white/25 shadow-2xl" style={{ transform: 'translateZ(78px)' }}>
          <div className="absolute inset-2 rounded-xl border border-white/15 bg-gradient-to-b from-[#88b6c1]/70 to-[#102a40]/90" />
          <div className="absolute inset-x-7 bottom-0 h-2 bg-[#d4a94f] rounded-full shadow-[0_0_22px_rgba(212,169,79,.75)]" />
        </div>

        <div className="absolute right-[11%] top-[8%] w-[50%] h-12 bg-gradient-to-r from-[#8f6624] via-[#f1d083] to-[#9a7129] shadow-xl rounded-t-[50%]" style={{ transform: 'translateZ(44px) rotateX(-8deg)' }} />
        <div className="absolute right-[27%] top-[3%] w-2 h-20 bg-[#d8b15d] rounded-full" style={{ transform: 'translateZ(52px)' }} />
        <div className="absolute right-[25%] top-[1%] w-6 h-6 rounded-full bg-[#ecd083] shadow-[0_0_24px_rgba(236,208,131,.7)]" style={{ transform: 'translateZ(57px)' }} />

        <div className="absolute left-[3%] right-[1%] bottom-[2%] h-[18%] rounded-[50%] bg-gradient-to-br from-[#b2e1e6] via-[#43879a] to-[#12374d] border border-white/30 shadow-2xl" style={{ transform: 'rotateX(58deg) translateZ(5px)' }}>
          <div className="absolute inset-5 rounded-[50%] border border-white/20" />
          <div className="absolute left-[20%] top-[30%] w-24 h-2 rounded-full bg-white/35 blur-sm" />
        </div>

        <div className="absolute left-0 top-[20%] rounded-2xl border border-white/20 bg-[#08172b]/80 backdrop-blur-xl px-5 py-4 shadow-2xl" style={{ transform: 'translateZ(92px)' }}>
          <div className="text-[9px] uppercase tracking-[0.28em] text-[#e2bd69]">Blue Pair</div>
          <div className="mt-1 text-sm font-semibold text-white">Signature Crown</div>
          <div className="mt-1 text-[10px] text-white/50">Uromi · Edo State</div>
        </div>

        <div className="absolute left-[8%] bottom-[14%] w-3 h-3 rounded-full bg-[#e8c46d] shadow-[0_0_22px_rgba(232,196,109,.9)]" style={{ transform: 'translateZ(86px)' }} />
        <div className="absolute right-[3%] bottom-[18%] w-3 h-3 rounded-full bg-[#e8c46d] shadow-[0_0_22px_rgba(232,196,109,.9)]" style={{ transform: 'translateZ(86px)' }} />
      </div>
    </div>
  )
}
