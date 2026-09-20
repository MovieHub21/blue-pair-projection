'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import DeleteConfirmDialog from '../../../components/ui/DeleteConfirmDialog'
import ImageUploader from '../../../components/admin/ImageUploader'
import { pushToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabase/client'
import { mapAmenity, mapDrink, mapMenuItem, mapShortLet } from '../../../lib/mappers'
import type { Drink, MenuItem, ShortLet } from '../../../data/mock'

type Amenity = {
  key: string
  name: string
  eyebrow: string
  description: string
  heroImage: string
  gallery: string[]
  hours: string
  facilities: string[]
  pricingNote: string
  ctaLabel: string
  published: boolean
}

type ShortLetDraft = {
  name: string
  type: string
  price: string
  bedrooms: string
  amenities: string
  image: string
  description: string
}

type BookingRow = {
  id: string
  reference: string
  customer_id: string
  short_let_id: string
  check_in: string
  check_out: string
  amount: number
  payment_status: string
  status: string
  customers?: { name?: string; email?: string } | null
}

const OUTLETS = [
  { key: 'annex-home', label: 'Annex Home' },
  { key: 'annex-outdoor-eatery', label: 'Outdoor Eatery' },
  { key: 'annex-grilling', label: 'Grilling' },
  { key: 'annex-bar', label: 'Bar' },
  { key: 'annex-vip-lounge', label: 'VIP Lounge' },
  { key: 'annex-restaurant', label: 'Restaurant' },
] as const

type Tab = 'Content' | 'Menu' | 'Drinks' | 'Short-lets' | 'Bookings'

const TABS: Tab[] = ['Content', 'Menu', 'Drinks', 'Short-lets', 'Bookings']

function blankAmenity(key: string, name: string): Amenity {
  return {
    key,
    name,
    eyebrow: '',
    description: '',
    heroImage: '',
    gallery: [],
    hours: '',
    facilities: [],
    pricingNote: '',
    ctaLabel: 'Reserve now',
    published: false,
  }
}

export default function AnnexManagement() {
  const [tab, setTab] = useState<Tab>('Content')
  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [shortLets, setShortLets] = useState<ShortLet[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [selectedKey, setSelectedKey] = useState<string>(OUTLETS[0].key)
  const [amenityDraft, setAmenityDraft] = useState<Amenity>(
    blankAmenity(OUTLETS[0].key, OUTLETS[0].label),
  )
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null)
  const [editingDrink, setEditingDrink] = useState<Drink | null>(null)
  const [editingShortLet, setEditingShortLet] = useState<ShortLet | null>(null)
  const [showAddShortLet, setShowAddShortLet] = useState(false)
  const [deleteShortLet, setDeleteShortLet] = useState<ShortLet | null>(null)
  const [saving, setSaving] = useState(false)
  const [shortLetDraft, setShortLetDraft] = useState<ShortLetDraft>({
    name: '',
    type: 'Apartment',
    price: '',
    bedrooms: '1',
    amenities: '',
    image: '',
    description: '',
  })

  const load = useCallback(async () => {
    const [a, m, d, s, b] = await Promise.all([
      supabase.from('amenities').select('*').like('key', 'annex-%').order('name'),
      supabase
        .from('menu_items')
        .select('*')
        .in('outlet', ['Annex Grilling', 'Annex Restaurant'])
        .order('name'),
      supabase.from('drinks').select('*').eq('bar', 'Annex Bar').order('name'),
      supabase.from('short_lets').select('*').order('price'),
      supabase
        .from('bookings')
        .select(
          'id,reference,customer_id,short_let_id,check_in,check_out,amount,payment_status,status,customers(name,email)',
        )
        .not('short_let_id', 'is', null)
        .order('created_at', { ascending: false }),
    ])

    if (a.data) setAmenities(a.data.map(mapAmenity))
    if (m.data) setMenuItems(m.data.map(mapMenuItem))
    if (d.data) setDrinks(d.data.map(mapDrink))
    if (s.data) setShortLets(s.data.map(mapShortLet))
    if (b.data) setBookings(b.data as BookingRow[])
  }, [])

  useEffect(() => {
    void load()

    const refresh = (event: Event) => {
      const table = (event as CustomEvent).detail?.table
      if (
        !table ||
        ['amenities', 'menu_items', 'drinks', 'short_lets', 'bookings'].includes(table)
      ) {
        void load()
      }
    }

    window.addEventListener('bluepair:database-change', refresh)
    return () => window.removeEventListener('bluepair:database-change', refresh)
  }, [load])

  useEffect(() => {
    const found = amenities.find((item) => item.key === selectedKey)
    const label = OUTLETS.find((item) => item.key === selectedKey)?.label || selectedKey
    setAmenityDraft(found ? { ...found } : blankAmenity(selectedKey, label))
  }, [amenities, selectedKey])

  async function saveAmenity() {
    setSaving(true)

    const { error } = await supabase.from('amenities').upsert(
      {
        key: amenityDraft.key,
        name: amenityDraft.name,
        eyebrow: amenityDraft.eyebrow,
        description: amenityDraft.description,
        hero_image: amenityDraft.heroImage,
        gallery: amenityDraft.gallery,
        hours: amenityDraft.hours,
        facilities: amenityDraft.facilities,
        pricing_note: amenityDraft.pricingNote,
        cta_label: amenityDraft.ctaLabel,
        published: amenityDraft.published,
      },
      { onConflict: 'key' },
    )

    setSaving(false)

    if (error) {
      pushToast('Failed to save Annex content: ' + error.message, 'error')
      return
    }

    await load()
    pushToast('Annex content saved', 'success')
  }

  async function saveMenu(item: MenuItem) {
    const { error } = await supabase
      .from('menu_items')
      .update({
        outlet: item.outlet,
        category: item.category,
        name: item.name,
        price: item.price,
        image: item.image,
        available: item.available,
      })
      .eq('id', item.id)

    if (error) {
      pushToast('Failed to save menu item: ' + error.message, 'error')
      return
    }

    setEditingMenu(null)
    await load()
    pushToast('Menu item saved', 'success')
  }

  async function saveDrink(item: Drink) {
    const { error } = await supabase
      .from('drinks')
      .update({
        bar: item.bar,
        category: item.category,
        name: item.name,
        price: item.price,
        available: item.available,
      })
      .eq('id', item.id)

    if (error) {
      pushToast('Failed to save drink: ' + error.message, 'error')
      return
    }

    setEditingDrink(null)
    await load()
    pushToast('Drink saved', 'success')
  }

  async function saveShortLet() {
    if (!shortLetDraft.name.trim()) {
      pushToast('Property name is required', 'error')
      return
    }

    const patch = {
      name: shortLetDraft.name.trim(),
      type: shortLetDraft.type.trim(),
      price: Number(shortLetDraft.price) || 0,
      bedrooms: Number(shortLetDraft.bedrooms) || 1,
      amenities: shortLetDraft.amenities
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      image: shortLetDraft.image,
      description: shortLetDraft.description,
    }

    const result = editingShortLet
      ? await supabase.from('short_lets').update(patch).eq('id', editingShortLet.id)
      : await supabase
          .from('short_lets')
          .insert({ id: 'sl_' + Date.now(), ...patch, available: true })

    if (result.error) {
      pushToast('Failed to save short-let: ' + result.error.message, 'error')
      return
    }

    setEditingShortLet(null)
    setShowAddShortLet(false)
    await load()
    pushToast('Short-let saved', 'success')
  }

  function editShortLet(item: ShortLet) {
    setEditingShortLet(item)
    setShortLetDraft({
      name: item.name,
      type: item.type,
      price: String(item.price),
      bedrooms: String(item.bedrooms),
      amenities: item.amenities.join(', '),
      image: item.image,
      description: item.description,
    })
  }

  function newShortLet() {
    setEditingShortLet(null)
    setShortLetDraft({
      name: '',
      type: 'Apartment',
      price: '',
      bedrooms: '1',
      amenities: '',
      image: '',
      description: '',
    })
    setShowAddShortLet(true)
  }

  async function removeShortLet() {
    if (!deleteShortLet) return

    const { error } = await supabase
      .from('short_lets')
      .delete()
      .eq('id', deleteShortLet.id)

    if (error) {
      pushToast('Failed to delete property: ' + error.message, 'error')
      return
    }

    setDeleteShortLet(null)
    await load()
    pushToast('Short-let deleted', 'success')
  }

  return (
    <div className="max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Annex Management</h1>
        <p className="mt-1 text-sm text-navy-400">
          All Annex business content is controlled here and stored in Supabase.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              'rounded-full border px-4 py-2.5 text-sm font-semibold ' +
              (tab === item
                ? 'border-navy-950 bg-navy-950 text-white'
                : 'border-black/15')
            }
          >
            {item}
          </button>
        ))}
      </div>

      {tab === 'Content' && (
        <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]">
          <div className="card h-fit space-y-1 p-3">
            {OUTLETS.map((outlet) => (
              <button
                key={outlet.key}
                type="button"
                onClick={() => setSelectedKey(outlet.key)}
                className={
                  'w-full rounded-lg px-3 py-2.5 text-left text-sm ' +
                  (selectedKey === outlet.key
                    ? 'bg-navy-950 text-white'
                    : 'hover:bg-cream-100')
                }
              >
                {outlet.label}
              </button>
            ))}
          </div>

          <div className="card p-5 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  className="field-input"
                  value={amenityDraft.name}
                  onChange={(event) =>
                    setAmenityDraft({ ...amenityDraft, name: event.target.value })
                  }
                />
              </Field>

              <Field label="Eyebrow">
                <input
                  className="field-input"
                  value={amenityDraft.eyebrow}
                  onChange={(event) =>
                    setAmenityDraft({ ...amenityDraft, eyebrow: event.target.value })
                  }
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Description">
                  <textarea
                    rows={4}
                    className="field-input !h-auto py-2.5"
                    value={amenityDraft.description}
                    onChange={(event) =>
                      setAmenityDraft({
                        ...amenityDraft,
                        description: event.target.value,
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="Opening hours">
                <input
                  className="field-input"
                  value={amenityDraft.hours}
                  onChange={(event) =>
                    setAmenityDraft({ ...amenityDraft, hours: event.target.value })
                  }
                />
              </Field>

              <Field label="Pricing note">
                <input
                  className="field-input"
                  value={amenityDraft.pricingNote}
                  onChange={(event) =>
                    setAmenityDraft({
                      ...amenityDraft,
                      pricingNote: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="CTA label">
                <input
                  className="field-input"
                  value={amenityDraft.ctaLabel}
                  onChange={(event) =>
                    setAmenityDraft({
                      ...amenityDraft,
                      ctaLabel: event.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Facilities (one per line)">
                <textarea
                  rows={5}
                  className="field-input !h-auto py-2.5"
                  value={amenityDraft.facilities.join('\n')}
                  onChange={(event) =>
                    setAmenityDraft({
                      ...amenityDraft,
                      facilities: event.target.value
                        .split('\n')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Hero image">
                  <div className="flex items-center gap-4">
                    <div className="h-24 w-36 overflow-hidden rounded-xl bg-cream-100">
                      {amenityDraft.heroImage && (
                        <img
                          src={amenityDraft.heroImage}
                          className="h-full w-full object-cover"
                          alt=""
                        />
                      )}
                    </div>
                    <ImageUploader
                      folder={'annex/' + amenityDraft.key}
                      label="Upload image"
                      onUploaded={(urls) =>
                        setAmenityDraft({
                          ...amenityDraft,
                          heroImage: urls[0] || '',
                        })
                      }
                    />
                  </div>
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Gallery image URLs (one per line)">
                  <textarea
                    rows={4}
                    className="field-input !h-auto py-2.5"
                    value={amenityDraft.gallery.join('\n')}
                    onChange={(event) =>
                      setAmenityDraft({
                        ...amenityDraft,
                        gallery: event.target.value
                          .split('\n')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={amenityDraft.published}
                  onChange={(event) =>
                    setAmenityDraft({
                      ...amenityDraft,
                      published: event.target.checked,
                    })
                  }
                />
                Published on public Annex
              </label>
            </div>

            <button
              type="button"
              onClick={() => void saveAmenity()}
              disabled={saving}
              className="btn-primary mt-6"
            >
              <Save size={14} />
              {saving ? 'Saving…' : 'Save Annex content'}
            </button>
          </div>
        </div>
      )}

      {tab === 'Menu' && (
        <ContentList<MenuItem>
          title="Annex Grilling & Restaurant menu"
          items={menuItems}
          onEdit={(item) => setEditingMenu(item)}
        />
      )}

      {tab === 'Drinks' && (
        <ContentList<Drink>
          title="Annex Bar drinks"
          items={drinks}
          onEdit={(item) => setEditingDrink(item)}
        />
      )}

      {tab === 'Short-lets' && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Annex short-let properties</h2>
              <p className="mt-1 text-xs text-navy-400">
                Properties, pricing, descriptions, images and amenities are editable here.
              </p>
            </div>
            <button type="button" onClick={newShortLet} className="btn-primary btn-sm">
              <Plus size={14} />
              Add property
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {shortLets.map((item) => {
              const today = new Date().toISOString().slice(0, 10)
              const booked = bookings.some(
                (booking) =>
                  booking.short_let_id === item.id &&
                  ['confirmed', 'checked_in'].includes(booking.status) &&
                  booking.payment_status === 'paid' &&
                  booking.check_in <= today &&
                  booking.check_out > today,
              )

              return (
                <div
                  key={item.id}
                  className="card grid grid-cols-[100px_minmax(0,1fr)] overflow-hidden"
                >
                  <img
                    src={item.image}
                    className="h-full min-h-[170px] w-full object-cover"
                    alt={item.name}
                  />

                  <div className="min-w-0 p-4">
                    <div className="flex justify-between gap-2">
                      <div>
                        <b>{item.name}</b>
                        <p className="mt-1 text-xs text-navy-400">
                          {item.type} · {item.bedrooms} bedrooms
                        </p>
                      </div>

                      <span
                        className={
                          booked || !item.available ? 'pill-red' : 'pill-green'
                        }
                      >
                        {booked ? 'Booked' : item.available ? 'Available' : 'Disabled'}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs text-navy-500">
                      {item.description}
                    </p>

                    <div className="font-display mt-3">
                      ₦{item.price.toLocaleString()}
                      <span className="font-body text-xs text-navy-400"> /night</span>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => editShortLet(item)}
                        className="flex items-center gap-1 text-xs font-semibold"
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteShortLet(item)}
                        className="flex items-center gap-1 text-xs font-semibold text-red-600"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'Bookings' && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/5 text-left text-xs text-navy-400">
                <th className="p-4">Property</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Dates</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id} className="border-b border-black/5">
                  <td className="p-4 font-medium">
                    {shortLets.find((item) => item.id === booking.short_let_id)?.name ||
                      'Short-let'}
                  </td>
                  <td className="p-4">
                    {booking.customers?.name || booking.customers?.email || 'Guest'}
                  </td>
                  <td className="p-4">
                    {booking.check_in} → {booking.check_out}
                  </td>
                  <td className="p-4">
                    ₦{Number(booking.amount).toLocaleString()}
                  </td>
                  <td className="p-4 capitalize">{booking.payment_status}</td>
                  <td className="p-4 capitalize">{booking.status}</td>
                </tr>
              ))}

              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-navy-400">
                    No short-let bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <EditMenuModal
        item={editingMenu}
        onClose={() => setEditingMenu(null)}
        onSave={saveMenu}
      />

      <EditDrinkModal
        item={editingDrink}
        onClose={() => setEditingDrink(null)}
        onSave={saveDrink}
      />

      <ShortLetModal
        open={showAddShortLet || Boolean(editingShortLet)}
        draft={shortLetDraft}
        onChange={setShortLetDraft}
        onClose={() => {
          setShowAddShortLet(false)
          setEditingShortLet(null)
        }}
        onSave={() => void saveShortLet()}
      />

      <DeleteConfirmDialog
        open={Boolean(deleteShortLet)}
        itemName={deleteShortLet?.name}
        description="This short-let will be permanently removed."
        onCancel={() => setDeleteShortLet(null)}
        onConfirm={() => void removeShortLet()}
      />
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      {children}
    </div>
  )
}

function ContentList<T extends MenuItem | Drink>({
  title,
  items,
  onEdit,
}: {
  title: string
  items: T[]
  onEdit: (item: T) => void
}) {
  return (
    <div className="card divide-y divide-black/5">
      <div className="p-5">
        <h2 className="font-semibold">{title}</h2>
      </div>

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 p-4">
          <img
            src={'image' in item ? item.image : ''}
            className="h-14 w-16 rounded-lg bg-cream-100 object-cover"
            alt=""
          />
          <div className="min-w-0 flex-1">
            <b className="block truncate">{item.name}</b>
            <span className="text-xs text-navy-400">
              {item.category} · ₦{Number(item.price).toLocaleString()}
            </span>
          </div>
          <span className={item.available ? 'pill-green' : 'pill-red'}>
            {item.available ? 'Available' : 'Sold out'}
          </span>
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="text-xs font-semibold"
          >
            <Pencil size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

function EditMenuModal({
  item,
  onClose,
  onSave,
}: {
  item: MenuItem | null
  onClose: () => void
  onSave: (item: MenuItem) => void
}) {
  const [draft, setDraft] = useState<MenuItem | null>(null)

  useEffect(() => {
    setDraft(item ? { ...item } : null)
  }, [item])

  if (!draft) {
    return null
  }

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="Edit Annex menu item">
      <div className="grid gap-4">
        <input
          className="field-input"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <input
          className="field-input"
          value={draft.category}
          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
        />
        <input
          type="number"
          className="field-input"
          value={draft.price}
          onChange={(event) =>
            setDraft({ ...draft, price: Number(event.target.value) })
          }
        />
        <input
          className="field-input"
          value={draft.image}
          onChange={(event) => setDraft({ ...draft, image: event.target.value })}
        />
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.available}
            onChange={(event) =>
              setDraft({ ...draft, available: event.target.checked })
            }
          />
          Available
        </label>
        <button type="button" className="btn-primary" onClick={() => onSave(draft)}>
          Save
        </button>
      </div>
    </Modal>
  )
}

function EditDrinkModal({
  item,
  onClose,
  onSave,
}: {
  item: Drink | null
  onClose: () => void
  onSave: (item: Drink) => void
}) {
  const [draft, setDraft] = useState<Drink | null>(null)

  useEffect(() => {
    setDraft(item ? { ...item } : null)
  }, [item])

  if (!draft) {
    return null
  }

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="Edit Annex drink">
      <div className="grid gap-4">
        <input
          className="field-input"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
        <input
          className="field-input"
          value={draft.category}
          onChange={(event) => setDraft({ ...draft, category: event.target.value })}
        />
        <input
          type="number"
          className="field-input"
          value={draft.price}
          onChange={(event) =>
            setDraft({ ...draft, price: Number(event.target.value) })
          }
        />
        <select
          className="field-input"
          value={draft.bar}
          onChange={(event) =>
            setDraft({
              ...draft,
              bar: event.target.value as Drink['bar'],
            })
          }
        >
          <option value="Main Bar">Main Bar</option>
          <option value="VIP Bar">VIP Bar</option>
          <option value="Outdoor Bar">Outdoor Bar</option>
          <option value="Annex Bar">Annex Bar</option>
        </select>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.available}
            onChange={(event) =>
              setDraft({ ...draft, available: event.target.checked })
            }
          />
          Available
        </label>
        <button type="button" className="btn-primary" onClick={() => onSave(draft)}>
          Save
        </button>
      </div>
    </Modal>
  )
}

function ShortLetModal({
  open,
  draft,
  onChange,
  onClose,
  onSave,
}: {
  open: boolean
  draft: ShortLetDraft
  onChange: (draft: ShortLetDraft) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <Modal open={open} onClose={onClose} title="Short-let property">
      <div className="grid gap-4">
        <input
          className="field-input"
          placeholder="Property name"
          value={draft.name}
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <input
            className="field-input"
            placeholder="Type"
            value={draft.type}
            onChange={(event) => onChange({ ...draft, type: event.target.value })}
          />
          <input
            type="number"
            className="field-input"
            placeholder="Bedrooms"
            value={draft.bedrooms}
            onChange={(event) =>
              onChange({ ...draft, bedrooms: event.target.value })
            }
          />
        </div>

        <input
          type="number"
          className="field-input"
          placeholder="Price / night"
          value={draft.price}
          onChange={(event) => onChange({ ...draft, price: event.target.value })}
        />

        <input
          className="field-input"
          placeholder="Amenities, comma separated"
          value={draft.amenities}
          onChange={(event) =>
            onChange({ ...draft, amenities: event.target.value })
          }
        />

        <textarea
          rows={4}
          className="field-input !h-auto py-2.5"
          placeholder="Description"
          value={draft.description}
          onChange={(event) =>
            onChange({ ...draft, description: event.target.value })
          }
        />

        <div>
          <label className="field-label">Image URL</label>
          <input
            className="field-input"
            value={draft.image}
            onChange={(event) => onChange({ ...draft, image: event.target.value })}
          />
          <ImageUploader
            folder="annex/shortlets"
            label="Upload image"
            onUploaded={(urls) =>
              onChange({ ...draft, image: urls[0] || '' })
            }
          />
        </div>

        <button
          type="button"
          className="btn-primary w-full justify-center"
          onClick={onSave}
        >
          Save property
        </button>
      </div>
    </Modal>
  )
}
