'use client'
export default function ContentField({ label, value, onChange, textarea, hint }: {
  label: string; value: string; onChange: (v: string) => void; textarea?: boolean; hint?: string
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} className="field-input !h-auto py-2.5" />
      ) : (
        <input value={value} onChange={e => onChange(e.target.value)} className="field-input" />
      )}
      {hint && <span className="text-[11px] text-navy-400 mt-1 block">{hint}</span>}
    </div>
  )
}
