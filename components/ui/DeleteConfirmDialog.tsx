'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Check, Loader2, Trash2, X } from 'lucide-react'

type DeleteConfirmDialogProps = {
  open: boolean
  title?: string
  description?: string
  itemName?: string
  confirmLabel?: string
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export default function DeleteConfirmDialog({ open, title = 'Delete this item?', description = 'This action cannot be undone.', itemName, confirmLabel = 'Delete', onCancel, onConfirm }: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setDeleting(false)
      setDeleted(false)
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
  }, [open])
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])
  if (!open) return null

  async function confirmDelete() {
    if (deleting || deleted) return
    setDeleting(true)
    try {
      await onConfirm()
      setDeleted(true)
      closeTimer.current = setTimeout(onCancel, 900)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <>
      <style jsx>{`@keyframes deleteOverlayIn{from{opacity:0}to{opacity:1}}@keyframes deletePanelIn{from{opacity:0;transform:translateY(18px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes deleteIconIn{from{opacity:0;transform:scale(.65) rotate(-8deg)}to{opacity:1;transform:scale(1) rotate(0)}}@media(min-width:640px){@keyframes deletePanelIn{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}}`}</style>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-navy-950/55 backdrop-blur-sm p-3 sm:p-5" style={{ animation: 'deleteOverlayIn 180ms ease-out both' }} role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
        <button aria-label="Close delete dialog" className="absolute inset-0 cursor-default" onClick={() => !deleting && onCancel()} />
        <div className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] bg-white shadow-2xl ring-1 ring-black/10" style={{ animation: 'deletePanelIn 280ms cubic-bezier(.2,.8,.2,1) both' }}>
          <div className="h-1 bg-gradient-to-r from-red-500 via-red-600 to-rose-500" />
          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <div className={`relative shrink-0 grid place-items-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all duration-300 ${deleted ? 'bg-emerald-100 text-emerald-600' : deleting ? 'bg-red-50 text-red-500' : 'bg-red-50 text-red-600'}`}>
                {deleted ? <Check size={24} strokeWidth={2.5} style={{ animation: 'deleteIconIn 240ms ease-out both' }} /> : deleting ? <Loader2 size={23} className="animate-spin" /> : <Trash2 size={23} />}
                {!deleting && !deleted && <span className="absolute inset-0 rounded-2xl border border-red-200 animate-ping opacity-30" />}
              </div>
              <div className="min-w-0 flex-1 pr-5">
                <h2 id="delete-dialog-title" className="text-base sm:text-lg font-semibold text-navy-950">{deleted ? 'Deleted successfully' : title}</h2>
                <p className="text-sm leading-5 text-navy-500 mt-1">{deleted ? 'The item has been removed.' : description}</p>
                {itemName && !deleted && <div className="mt-3 rounded-xl bg-cream-100 border border-black/5 px-3 py-2 text-sm font-medium text-navy-800 truncate">{itemName}</div>}
              </div>
              {!deleting && !deleted && <button onClick={onCancel} className="absolute right-4 top-4 p-1.5 rounded-lg text-navy-400 hover:text-navy-800 hover:bg-cream-100 transition" aria-label="Cancel"><X size={17} /></button>}
            </div>
            {!deleted && <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-red-50/80 border border-red-100 px-3 py-2.5 text-xs leading-4 text-red-700"><AlertTriangle size={15} className="shrink-0 mt-0.5" /><span>Deleting this item permanently removes it. Make sure you want to continue.</span></div>}
            {!deleted && <div className="mt-5 flex gap-2.5 sm:justify-end"><button disabled={deleting} onClick={onCancel} className="btn-outline flex-1 sm:flex-none justify-center">Cancel</button><button disabled={deleting} onClick={confirmDelete} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-70">{deleting ? <><Loader2 size={15} className="animate-spin" />Deleting…</> : <><Trash2 size={15} />{confirmLabel}</>}</button></div>}
          </div>
        </div>
      </div>
    </>
  )
}
