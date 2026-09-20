'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { getPublicBackTarget, labelForPath } from '../../lib/backNavigation'

interface BackButtonProps {
  /** Where the button leads. Omit it on the public website: the parent page is worked out from the URL. */
  href?: string
  /** Text after "Back to". Omit it to use the name of the target page. */
  label?: string
  className?: string
}

/**
 * "Back to <parent page>" for inner pages only. On top-level pages (no parent) it renders nothing.
 * It is a normal link to the parent page, so it always lands somewhere predictable.
 */
export default function BackButton({ href, label, className = '' }: BackButtonProps) {
  const pathname = usePathname()
  const target = href ?? getPublicBackTarget(pathname)
  if (!target) return null

  const name = label ?? labelForPath(target)

  return (
    <Link
      href={target}
      aria-label={`Back to ${name}`}
      className={
        'group inline-flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-full border border-black/[0.08] bg-white/90 px-3.5 py-2 text-[12px] font-semibold text-navy-700 shadow-[0_8px_30px_rgba(10,24,48,0.08)] backdrop-blur-xl transition-all duration-300 hover:-translate-x-0.5 hover:border-navy-900/15 hover:bg-white hover:text-navy-950 hover:shadow-[0_12px_34px_rgba(10,24,48,0.12)] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold-400/60 ' + className
      }
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-950 text-white transition-transform duration-300 group-hover:-translate-x-0.5">
        <ArrowLeft size={13} strokeWidth={2.4} />
      </span>
      <span className="truncate">Back to {name}</span>
    </Link>
  )
}
