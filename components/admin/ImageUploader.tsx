'use client'
import { useRef, useState } from 'react'
import { Upload, Loader2 } from 'lucide-react'
import { uploadImage } from '../../lib/upload'

export default function ImageUploader({ folder, onUploaded, label = 'Upload image', className, multiple }: {
  folder: string
  onUploaded: (urls: string[]) => void
  label?: string
  className?: string
  multiple?: boolean
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(files: FileList | null) {
    if (!files || files.length === 0) return
    setBusy(true); setError(null)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) urls.push(await uploadImage(file, folder))
      onUploaded(urls)
    } catch (e: any) {
      setError(e?.message ?? 'Upload failed')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className={className}>
      <input ref={input} type="file" accept="image/*" multiple={multiple} className="hidden"
        onChange={e => handle(e.target.files)} />
      <button type="button" disabled={busy} onClick={() => input.current?.click()}
        className="btn-outline btn-sm flex items-center gap-1.5 disabled:opacity-60">
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        {busy ? 'Uploading…' : label}
      </button>
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  )
}
