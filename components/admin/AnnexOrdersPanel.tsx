'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, ChevronDown, Clock3, Mail, MapPin, Package, Phone, RefreshCw, Search, Truck } from 'lucide-react'
import { pushToast } from '../ui/Toast'

type BarOrder = {
  id: string
  reference: string
  delivery_label: string
  delivery_location: string
  takeout: boolean
  contact_email?: string | null
  contact_phone?: string | null
  delivery_address?: string | null
  notes?: string | null
  total: number
  status: string
  created_at: string
  customer?: { name?: string | null; email?: string | null } | null
  outlet?: string | null
  bar_order_items?: Array<{
    id: string
    drink_name: string
    quantity: number
    line_total: number
  }>
}

const STATUSES = [
  { value: 'pending', label: 'New', icon: Package },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle2 },
  { value: 'preparing', label: 'Preparing', icon: Clock3 },
  { value: 'ready', label: 'Ready', icon: CheckCircle2 },
  { value: 'delivered', label: 'Delivered', icon: Truck },
  { value: 'cancelled', label: 'Cancelled', icon: Package },
] as const

const statusLabel = (status: string) => STATUSES.find(item => item.value === status)?.label || status.replaceAll('_', ' ')
const outletLabel = (outlet?: string | null) => ({ bar: 'Annex Bar', restaurant: 'Annex Restaurant', grilling: 'Annex Grilling', outdoor_eatery: 'Outdoor Eatery' } as Record<string,string>)[outlet || ''] || 'Annex Order'
const naira = (value: unknown) => '₦' + Number(value || 0).toLocaleString('en-NG')

function statusClass(status: string) {
  if (status === 'pending') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (status === 'accepted') return 'border-blue-200 bg-blue-50 text-blue-800'
  if (status === 'preparing') return 'border-violet-200 bg-violet-50 text-violet-800'
  if (status === 'ready') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'delivered') return 'border-slate-200 bg-slate-50 text-slate-700'
  return 'border-red-200 bg-red-50 text-red-700'
}

export default function AnnexOrdersPanel({
  orders,
  onRefresh,
}: {
  orders: BarOrder[]
  onRefresh: () => Promise<void>
}) {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: orders.length }
    for (const status of STATUSES) result[status.value] = orders.filter(order => order.status === status.value).length
    return result
  }, [orders])

  const visibleOrders = useMemo(() => {
    const query = search.trim().toLowerCase()
    return orders.filter(order => {
      const matchesFilter = filter === 'all' || order.status === filter
      if (!matchesFilter) return false
      if (!query) return true
      const itemNames = (order.bar_order_items ?? []).map(item => item.drink_name).join(' ')
      return [
        order.reference,
        order.delivery_label,
        order.delivery_location,
        order.contact_email,
        order.contact_phone,
        order.delivery_address,
        itemNames,
      ].filter(Boolean).join(' ').toLowerCase().includes(query)
    })
  }, [orders, filter, search])

  async function updateStatus(order: BarOrder, status: string) {
    if (status === order.status) return
    setUpdating(order.id)
    try {
      const response = await fetch('/api/bar/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update order')
      await onRefresh()
    } catch (error: any) {
      pushToast(error?.message || 'Failed to update bar order', 'error')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-gold-600">Order desk</p>
          <h2 className="mt-1 text-2xl font-semibold text-navy-950">Annex Bar Orders</h2>
          <p className="mt-1 max-w-2xl text-sm text-navy-400">A clearer live queue for receiving, preparing and completing guest drink orders.</p>
        </div>
        <button type="button" onClick={() => void onRefresh()} className="btn-outline btn-sm self-start lg:self-auto">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard label="All orders" value={counts.all} />
        <SummaryCard label="New" value={counts.pending} />
        <SummaryCard label="Preparing" value={(counts.accepted || 0) + (counts.preparing || 0)} />
        <SummaryCard label="Ready" value={counts.ready} />
      </div>

      <div className="card p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              className="field-input pl-9"
              placeholder="Search reference, location, drink or contact…"
              aria-label="Search Annex Bar orders"
            />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {[
              ['all', 'All'],
              ['pending', 'New'],
              ['accepted', 'Accepted'],
              ['preparing', 'Preparing'],
              ['ready', 'Ready'],
              ['delivered', 'Delivered'],
              ['cancelled', 'Cancelled'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={'shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition ' + (
                  filter === value
                    ? 'border-navy-950 bg-navy-950 text-white'
                    : 'border-black/10 bg-white text-navy-600 hover:border-gold-500'
                )}
              >
                {label} <span className="ml-1 opacity-60">{counts[value] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="card p-10 text-center">
          <Package size={28} className="mx-auto text-navy-300" />
          <h3 className="mt-3 font-semibold text-navy-950">{orders.length ? 'No matching orders' : 'No Annex Bar orders yet'}</h3>
          <p className="mt-1 text-sm text-navy-400">{orders.length ? 'Try another status or search term.' : 'Paid guest orders will appear here automatically.'}</p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleOrders.map(order => {
            const isExpanded = expanded === order.id
            const nextStatus = order.status === 'pending' ? 'accepted' : order.status === 'accepted' ? 'preparing' : order.status === 'preparing' ? 'ready' : order.status === 'ready' ? 'delivered' : null
            return (
              <article key={order.id} className="card overflow-hidden">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-2"><span className="font-mono text-sm font-bold text-navy-950">{order.reference}</span><span className="rounded-full bg-cream-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-500">{outletLabel(order.outlet)}</span></div>
                        <span className={'rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ' + statusClass(order.status)}>
                          {statusLabel(order.status)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-navy-400">{new Date(order.created_at).toLocaleString('en-NG')}</p>
                    </div>
                    <span className="shrink-0 rounded-xl bg-cream-50 px-3 py-2 text-sm font-bold text-navy-950">{naira(order.total)}</span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-black/5 bg-cream-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-xl bg-white p-2 text-gold-600 shadow-sm"><MapPin size={15} /></div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[.14em] text-navy-400">Delivery</p>
                        <p className="mt-1 font-semibold text-navy-950">{order.takeout ? 'Takeaway / Pickup' : order.delivery_label}</p>
                        {!order.takeout && <p className="mt-1 text-xs text-navy-500">{order.delivery_location.replaceAll('_', ' ')}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {(order.bar_order_items ?? []).map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-black/5 px-3.5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy-900">{item.drink_name}</p>
                          <p className="mt-0.5 text-xs text-navy-400">{item.quantity} × {naira(item.line_total / Math.max(1, item.quantity))}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-navy-900">{naira(item.line_total)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-black/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500 hover:text-navy-950"
                    >
                      {isExpanded ? 'Hide details' : 'View order details'}
                      <ChevronDown size={14} className={'transition-transform ' + (isExpanded ? 'rotate-180' : '')} />
                    </button>

                    {order.status !== 'cancelled' && order.status !== 'delivered' && (
                      <button
                        type="button"
                        disabled={updating === order.id}
                        onClick={() => void updateStatus(order, 'cancelled')}
                        className="btn-outline btn-sm justify-center border-red-200 text-red-600 hover:bg-red-50 sm:min-w-[120px]"
                      >
                        Cancel order
                      </button>
                    )}

                    {nextStatus && (
                      <button
                        type="button"
                        disabled={updating === order.id}
                        onClick={() => void updateStatus(order, nextStatus)}
                        className="btn-primary btn-sm justify-center sm:min-w-[150px]"
                      >
                        {updating === order.id ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                        {updating === order.id ? 'Updating…' : 'Mark ' + statusLabel(nextStatus)}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 grid gap-3 rounded-2xl border border-black/5 bg-white p-4 sm:grid-cols-2">
                      {order.takeout ? (
                        <>
                          {order.contact_email && <Detail icon={<Mail size={14} />} label="Email" value={order.contact_email} />}
                          {order.contact_phone && <Detail icon={<Phone size={14} />} label="Phone" value={order.contact_phone} />}
                          {order.delivery_address && <Detail icon={<MapPin size={14} />} label="Pickup / address" value={order.delivery_address} />}
                        </>
                      ) : (
                        order.customer?.email ? <Detail icon={<Mail size={14} />} label="Account email" value={order.customer.email} /> : null
                      )}
                      {order.notes && <div className="sm:col-span-2"><Detail icon={<Package size={14} />} label="Instructions" value={order.notes} /></div>}
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,auto]">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[.14em] text-navy-400">Update status</label>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={event => void updateStatus(order, event.target.value)}
                      className="field-input"
                    >
                      {STATUSES.map(status => <option key={status.value} value={status.value}>{status.label}</option>)}
                    </select>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return <div className="card p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-navy-400">{label}</p><p className="mt-2 text-2xl font-semibold text-navy-950">{value}</p></div>
}

function Detail({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 items-start gap-2.5"><span className="mt-0.5 text-gold-600">{icon}</span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-navy-400">{label}</p><p className="mt-1 break-words text-xs font-medium text-navy-800">{value}</p></div></div>
}
