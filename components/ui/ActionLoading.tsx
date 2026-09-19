'use client'

import { useEffect } from 'react'

const ACTION_SELECTOR = 'button.btn, button.btn-primary, button.btn-gold, button.btn-outline, button.btn-ghost-light, button[type="submit"]'

export default function ActionLoading() {
  useEffect(() => {
    const pending = new Map<HTMLButtonElement, number>()
    let clickedButton: HTMLButtonElement | null = null
    let clearClickTimer: ReturnType<typeof setTimeout> | null = null

    const setLoading = (button: HTMLButtonElement, loading: boolean) => {
      if (!button.isConnected) return
      button.classList.toggle('action-loading', loading)
      button.setAttribute('aria-busy', String(loading))
      button.disabled = loading
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const button = target?.closest(ACTION_SELECTOR) as HTMLButtonElement | null
      if (!button || button.disabled || button.dataset.noLoading === 'true') return
      if (button.closest('[aria-expanded="true"]') || button.hasAttribute('aria-expanded') || button.hasAttribute('aria-haspopup')) return
      clickedButton = button
      if (clearClickTimer) clearTimeout(clearClickTimer)
      clearClickTimer = setTimeout(() => { clickedButton = null }, 1500)
      pending.set(button, (pending.get(button) ?? 0) + 1)
      setLoading(button, true)
      setTimeout(() => {
        if ((pending.get(button) ?? 0) === 1) {
          pending.delete(button)
          setLoading(button, false)
        }
      }, 1500)
    }

    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const button = clickedButton
      if (clearClickTimer) {
        clearTimeout(clearClickTimer)
        clearClickTimer = null
      }
      const response = await originalFetch(...args)
      if (button) {
        const count = pending.get(button) ?? 0
        if (count > 0) {
          pending.set(button, count)
          Promise.resolve().then(() => {
            const next = pending.get(button) ?? 0
            if (next <= 1) {
              pending.delete(button)
              setLoading(button, false)
            } else {
              pending.set(button, next - 1)
            }
          })
        }
      }
      return response
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.fetch = originalFetch
      if (clearClickTimer) clearTimeout(clearClickTimer)
      pending.forEach((_, button) => setLoading(button, false))
    }
  }, [])

  return null
}
