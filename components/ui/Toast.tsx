'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Info, XCircle, X } from 'lucide-react'

export interface ToastMsg {
  id: number
  text: string
  tone: 'success' | 'info' | 'error'
}

let toastSeq = 1

export function pushToast(text: string, tone: 'success' | 'info' | 'error' = 'success') {
  if (typeof window === 'undefined') return
  const id = toastSeq++
  window.dispatchEvent(
    new CustomEvent('bluepair:toast', {
      detail: { id, text, tone },
    })
  )
}

export default function ToastHost() {
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  useEffect(() => {
    const handleToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastMsg>).detail
      if (!detail || !detail.text) return
      setToasts(prev => [...prev, detail])

      window.setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== detail.id))
      }, 3600)
    }

    window.addEventListener('bluepair:toast', handleToast)
    return () => window.removeEventListener('bluepair:toast', handleToast)
  }, [])

  const dismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center w-full max-w-xl px-3 sm:px-4 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          role="status"
          className={
            'motion-fade-up pointer-events-auto flex items-center gap-2.5 w-full sm:w-auto max-w-lg px-4 sm:px-5 py-3 rounded-2xl sm:rounded-full shadow-pop text-sm font-semibold text-white backdrop-blur-xl border border-white/10 ' +
            (t.tone === 'success' ? 'bg-navy-900/95' : t.tone === 'error' ? 'bg-red-700/95' : 'bg-navy-700/95')
          }
        >
          <span className="shrink-0 motion-success">
            {t.tone === 'success' && <CheckCircle2 size={16} className="text-gold-400" />}
            {t.tone === 'info' && <Info size={16} className="text-gold-300" />}
            {t.tone === 'error' && <XCircle size={16} className="text-red-200" />}
          </span>
          <span className="min-w-0 flex-1 leading-snug">{t.text}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => dismissToast(t.id)}
            className="shrink-0 opacity-60 hover:opacity-100 transition-all duration-200 hover:rotate-90 active:scale-90"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
