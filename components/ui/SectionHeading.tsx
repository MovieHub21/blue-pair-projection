export default function SectionHeading({ eyebrow, title, subtitle, center, light }: {
  eyebrow: string; title: string; subtitle?: string; center?: boolean; light?: boolean
}) {
  return (
    <div className={'max-w-2xl mb-12 ' + (center ? 'mx-auto text-center' : '')}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className={'text-3xl md:text-[2.6rem] leading-[1.08] mt-3 mb-4 font-semibold ' + (light ? 'text-white' : 'text-navy-950')}>{title}</h2>
      {subtitle && <p className={(light ? 'text-white/65' : 'text-navy-500') + ' text-[15px] leading-relaxed'}>{subtitle}</p>}
    </div>
  )
}
