'use client'
import { useStore } from '../../store/useStore'
import { CheckCircle2, Info, XCircle, X } from 'lucide-react'

export default function ToastHost() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center w-full px-4">
      {toasts.map(t => (
        <div key={t.id} className={
          'flex items-center gap-2.5 px-5 py-3 rounded-full shadow-pop text-sm font-semibold text-white ' +
          (t.tone === 'success' ? 'bg-navy-900' : t.tone === 'error' ? 'bg-red-700' : 'bg-navy-700')
        }>
          {t.tone === 'success' && <CheckCircle2 size={16} className="text-gold-400" />}
          {t.tone === 'info' && <Info size={16} className="text-gold-300" />}
          {t.tone === 'error' && <XCircle size={16} className="text-red-200" />}
          <span>{t.text}</span>
          <button onClick={() => dismissToast(t.id)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}
