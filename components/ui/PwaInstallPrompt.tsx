'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

type InstallPromptEvent = Event & {
  prompt: () => Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (standalone) return

    const isIosDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !standalone
    setIos(isIosDevice)

    const timer = window.setTimeout(() => setVisible(true), 1800)

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
      setVisible(true)
    }

    const handleInstalled = () => {
      setInstallEvent(null)
      setVisible(false)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleInstalled)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  async function install() {
    if (!installEvent) return
    const result = await installEvent.prompt()
    setInstallEvent(null)
    if (result.outcome === 'accepted') setVisible(false)
    else setVisible(false)
  }

  if (!visible || (!installEvent && !ios)) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[180] px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[380px] sm:px-0">
      <div className="rounded-2xl border border-gold-400/25 bg-navy-950 text-white shadow-[0_20px_60px_rgba(5,18,45,.28)] overflow-hidden">
        <div className="p-4 sm:p-4.5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-10 w-10 shrink-0 rounded-xl bg-gold-500 text-navy-950 grid place-items-center shadow-lg shadow-gold-500/20">
              <Download size={18} />
            </div>
            <div className="min-w-0 flex-1 pr-1">
              <p className="text-sm font-semibold text-white">Stay connected with Blue Pair</p>
              <p className="text-xs leading-5 text-white/65 mt-1">Install the guest portal for quicker access to bookings, messages and hotel updates.</p>
            </div>
            <button onClick={() => setVisible(false)} className="h-8 w-8 shrink-0 rounded-full text-white/55 hover:text-white hover:bg-white/10 grid place-items-center" aria-label="Dismiss install reminder">
              <X size={16} />
            </button>
          </div>

          {ios ? (
            <div className="mt-3 rounded-xl bg-white/7 border border-white/10 px-3 py-2.5 text-xs leading-5 text-white/75">
              In Safari, tap <Share size={13} className="inline mx-0.5 align-[-2px]" /> <span className="font-semibold text-white">Share</span>, then choose <span className="font-semibold text-white">Add to Home Screen</span>.
            </div>
          ) : (
            <button onClick={install} className="mt-3 w-full h-10 rounded-xl bg-gold-500 text-navy-950 text-sm font-bold hover:bg-gold-400 transition-colors inline-flex items-center justify-center gap-2">
              <Download size={16} /> Install Blue Pair
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
