export default function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-20">
      <div className="w-8 h-8 rounded-full border-2 border-navy-900/15 border-t-navy-900 animate-spin" />
      {label && <p className="text-xs text-navy-400">{label}</p>}
    </div>
  )
}
