import { Facebook, Globe, Instagram, Linkedin, Music2 } from 'lucide-react'

const platforms = [
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'tiktok', label: 'TikTok', icon: Music2 },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
] as const

export default function SocialLinks({ content, className = '' }: { content: Record<string, string>; className?: string }) {
  const links = platforms.flatMap(platform => {
    const enabled = content[`social_${platform.key}_enabled`] === 'true'
    const url = content[`social_${platform.key}_url`]
    return enabled && url ? [{ ...platform, url }] : []
  })

  const otherEnabled = content.social_other_enabled === 'true' && !!content.social_other_url
  if (otherEnabled) links.push({ key: 'other', label: content.social_other_label || 'Other', icon: Globe, url: content.social_other_url })
  if (!links.length) return null

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      {links.map(({ key, label, icon: Icon, url }) => (
        <a key={key} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="w-9 h-9 rounded-full border border-white/15 bg-white/5 text-white/70 hover:text-white hover:border-gold-400/60 hover:bg-gold-500/10 flex items-center justify-center transition-all">
          <Icon size={16} />
        </a>
      ))}
    </div>
  )
}
