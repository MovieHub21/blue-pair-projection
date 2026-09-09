'use client'
import { ReactNode } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, subtitle, children, wide }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[150] bg-navy-950/60 backdrop-blur-[2px] flex items-start justify-center overflow-y-auto p-4 md:p-8" onClick={onClose}>
      <div
        className={'bg-white rounded-xl2 shadow-pop w-full mt-6 md:mt-10 overflow-hidden ' + (wide ? 'max-w-3xl' : 'max-w-lg')}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-7 pt-7 pb-4 border-b border-black/5">
          <div>
            <h3 className="text-xl font-semibold text-navy-950">{title}</h3>
            {subtitle && <p className="text-sm text-navy-500 mt-1">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-cream-100 flex items-center justify-center hover:bg-cream-200 shrink-0">
            <X size={16} />
          </button>
        </div>
        <div className="px-7 py-6">{children}</div>
      </div>
    </div>
  )
}
