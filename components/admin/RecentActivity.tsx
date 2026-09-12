'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Activity, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase/client'

type Row = { id: string; action: string; entity_type: string; description: string; created_at: string }

function pretty(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function RecentActivity() {
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data } = await supabase
        .from('activity_logs')
        .select('id, action, entity_type, description, created_at')
        .order('created_at', { ascending: false })
        .limit(8)
      if (!cancelled) setRows((data ?? []) as Row[])
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="card p-6 mt-6">
      <div className="flex items-center justify-between mb-5">
        <div><h3 className="font-semibold">Recent hotel activity</h3><p className="text-xs text-navy-400 mt-1">The latest changes recorded across the hotel.</p></div>
        <Link href="/admin/activity" className="text-xs font-semibold text-gold-600 flex items-center gap-1">View all <ArrowRight size={13} /></Link>
      </div>
      {rows.length ? <div className="divide-y divide-black/5">{rows.map(row => <div key={row.id} className="py-3 first:pt-0 last:pb-0 flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gold-50 flex items-center justify-center shrink-0"><Activity size={14} className="text-gold-600" /></div><div className="min-w-0 flex-1"><p className="text-sm text-navy-700 truncate">{row.description}</p><p className="text-[11px] text-navy-400 mt-0.5">{pretty(row.entity_type)} · {new Date(row.created_at).toLocaleString('en-NG')}</p></div><span className="text-[10px] uppercase font-bold text-navy-300">{row.action}</span></div>)}</div> : <p className="text-sm text-navy-400">Activity will appear here as staff and hotel operations change data.</p>}
    </div>
  )
}
