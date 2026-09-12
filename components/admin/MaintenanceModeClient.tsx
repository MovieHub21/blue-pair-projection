import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase/client'
import { useStore } from '../../store/useStore'
import { Wrench, ShieldCheck } from 'lucide-react'

function getEnvironment() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'development'
  }
  return 'production'
}

export default function MaintenanceModeClient({ canEdit }: { canEdit: boolean }) {
  const [enabled, setEnabled] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const pushToast = useStore(s => s.pushToast)
  const environment = getEnvironment()

  useEffect(() => {
    let active = true
    supabase
      .from('site_settings')
      .select('maintenance_mode')
      .eq('environment', environment)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) pushToast('Could not load maintenance status: ' + error.message, 'error')
        setEnabled(!!data?.maintenance_mode)
        setLoaded(true)
      })
    return () => { active = false }
  }, [environment, pushToast])

  async function toggle() {
    if (!canEdit || saving) return
    const next = !enabled
    setSaving(true)
    const { data, error } = await supabase
      .from('site_settings')
      .update({ maintenance_mode: next })
      .eq('environment', environment)
      .select('maintenance_mode')
      .maybeSingle()
    setSaving(false)

    if (error || !data) {
      pushToast('Could not update maintenance mode: ' + (error?.message || 'The change was not saved.'), 'error')
      return
    }

    setEnabled(!!data.maintenance_mode)
    pushToast(`Maintenance mode ${next ? 'enabled' : 'disabled'} for ${environment}`, 'success')
  }

  return (
    <div className="card p-6 mt-8 max-w-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700 shrink-0">
            <Wrench size={18} />
          </div>
          <div>
            <h3 className="font-semibold">Website maintenance mode</h3>
            <p className="text-xs text-navy-400 mt-1 max-w-xl">
              Temporarily show the Blue Pair maintenance screen to public visitors while staff and Super Admins can continue working.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={!canEdit || !loaded || saving}
          aria-label="Toggle website maintenance mode"
          className={'relative w-12 h-7 rounded-full transition-colors shrink-0 disabled:opacity-50 ' + (enabled ? 'bg-amber-500' : 'bg-black/15')}
        >
          <span className={'absolute left-1 top-1 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ' + (enabled ? 'translate-x-5' : 'translate-x-0')} />
        </button>
      </div>

      <div className="mt-5 pt-4 border-t border-black/5 flex items-center justify-between gap-4 text-xs">
        <span className="flex items-center gap-2 text-navy-500">
          <ShieldCheck size={14} className={enabled ? 'text-amber-600' : 'text-emerald-600'} />
          {enabled ? 'Visitors are seeing the maintenance screen' : 'Website is live'}
        </span>
        <span className="uppercase tracking-wider font-semibold text-navy-400">{environment}</span>
      </div>

      {!canEdit && <p className="text-[11px] text-navy-400 mt-3">Only a Super Admin can change this setting.</p>}
    </div>
  )
}
