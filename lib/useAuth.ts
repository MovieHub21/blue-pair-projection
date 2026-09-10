'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase/client'

export type AppRole =
  | 'super_admin' | 'manager' | 'reception' | 'housekeeping'
  | 'maintenance' | 'restaurant' | 'bar' | 'accountant'

export interface Profile { id: string; name: string; email: string; phone: string }
export interface CustomerRow { id: string; name: string; email: string; phone: string }

export interface AuthState {
  loading: boolean
  userId: string | null
  email: string | null
  profile: Profile | null
  customer: CustomerRow | null
  roles: AppRole[]
  isStaff: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
}

export function useAuth(): AuthState {
  const [state, setState] = useState<Omit<AuthState, 'signOut'>>({
    loading: true, userId: null, email: null, profile: null, customer: null,
    roles: [], isStaff: false, isAdmin: false,
  })

  useEffect(() => {
    let active = true

    async function load(userId: string | null, email: string | null) {
      if (!userId) {
        if (active) setState({ loading: false, userId: null, email: null, profile: null, customer: null, roles: [], isStaff: false, isAdmin: false })
        return
      }
      const [{ data: profile }, { data: roleRows }, { data: customer }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
        supabase.from('customers').select('id,name,email,phone').eq('user_id', userId).maybeSingle(),
      ])
      const roles = (roleRows ?? []).map((r: any) => r.role as AppRole)
      if (!active) return
      setState({
        loading: false, userId, email,
        profile: (profile as Profile) ?? null,
        customer: (customer as CustomerRow) ?? null,
        roles,
        isStaff: roles.length > 0,
        isAdmin: roles.includes('super_admin') || roles.includes('manager'),
      })
    }

    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null, data.user?.email ?? null))

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        void load(session?.user?.id ?? null, session?.user?.email ?? null)
      }
    })
    return () => { active = false; sub.subscription.unsubscribe() }
  }, [])

  return {
    ...state,
    signOut: async () => {
      await supabase.auth.signOut()
      window.location.href = '/'
    },
  }
}

/** Ensures a customers row exists for the signed-in guest and returns its id. */
export async function ensureCustomer(userId: string, name: string, email: string, phone: string) {
  const { data: existing } = await supabase.from('customers').select('id').eq('user_id', userId).maybeSingle()
  if (existing) return (existing as any).id as string
  const id = `c_${Date.now()}`
  const { error } = await supabase.from('customers').insert({ id, user_id: userId, name, email, phone })
  if (error) console.error('customer create failed', error.message)
  return id
}
