import { ReactNode } from 'react'
export default function PageHero({ image, eyebrow, title, crumbs, children, height = 'h-64' }: {
  image: string; eyebrow: string; title: string; crumbs?: string; children?: ReactNode; height?: string
}) {
  return (
    <header className={'relative ' + height + ' text-white flex items-end'}>
      <div className="absolute inset-0 bg-hero" style={{ backgroundImage: `url('${image}')` }} role="img" aria-label={title} />
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-navy-950/10" />
      <div className="relative z-10 container-w px-6 md:px-10 pb-10 w-full">
        {crumbs && <div className="text-xs text-white/60 mb-2">{crumbs}</div>}
        <span className="eyebrow text-gold-300">{eyebrow}</span>
        <h1 className="text-4xl md:text-5xl font-semibold mt-2">{title}</h1>
        {children}
      </div>
    </header>
  )
}
