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

type AuthLookup = {
  profile: Profile | null
  roles: AppRole[]
  customer: CustomerRow | null
}

// Multiple widgets may call useAuth on one screen (for example, every event
// reservation card). Share overlapping auth and per-user reads in memory only.
let initialUserRequest: ReturnType<typeof supabase.auth.getUser> | null = null
const authLookups = new Map<string, Promise<AuthLookup>>()
let lastAuthEventSignature = ''

function getInitialUserRequest() {
  initialUserRequest ??= supabase.auth.getUser()
  return initialUserRequest
}

function getAuthLookup(userId: string) {
  const existing = authLookups.get(userId)
  if (existing) return existing
  const request = Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', userId),
    supabase.from('customers').select('id,name,email,phone').eq('user_id', userId).maybeSingle(),
  ]).then(([profileResult, roleResult, customerResult]) => ({
    profile: (profileResult.data as Profile | null) ?? null,
    roles: (roleResult.data ?? []).map((row: any) => row.role as AppRole),
    customer: (customerResult.data as CustomerRow | null) ?? null,
  }))
  authLookups.set(userId, request)
  void request.finally(() => {
    if (authLookups.get(userId) === request) authLookups.delete(userId)
  })
  return request
}

function invalidateAuthLookup(event: string, userId: string | null, accessToken: string | null) {
  const signature = `${event}:${userId ?? ''}:${accessToken ?? ''}`
  if (signature === lastAuthEventSignature) return
  lastAuthEventSignature = signature
  queueMicrotask(() => {
    if (lastAuthEventSignature === signature) lastAuthEventSignature = ''
  })
  initialUserRequest = null
  if (userId) authLookups.delete(userId)
  else authLookups.clear()
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
      const { profile, roles, customer } = await getAuthLookup(userId)
      if (!active) return
      setState({
        loading: false, userId, email,
        profile,
        customer,
        roles,
        isStaff: roles.length > 0,
        isAdmin: roles.includes('super_admin') || roles.includes('manager'),
      })
    }

    getInitialUserRequest().then(({ data }) => load(data.user?.id ?? null, data.user?.email ?? null))

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        invalidateAuthLookup(event, session?.user?.id ?? null, session?.access_token ?? null)
      }
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

  const normalizedEmail = email.trim().toLowerCase()
  if (normalizedEmail) {
    const { data: emailCustomer, error: emailLookupError } = await supabase
      .from('customers')
      .select('id,user_id,name,email,phone')
      .ilike('email', normalizedEmail)
      .maybeSingle()

    if (emailLookupError) {
      console.error('customer email lookup failed', emailLookupError.message)
    } else if (emailCustomer) {
      // Walk-in customers are created with user_id = null. Claim that customer
      // when the guest later creates an account with the same email so all of
      // their existing bookings/payments immediately appear in the account.
      if (!emailCustomer.user_id) {
        const { error } = await supabase
          .from('customers')
          .update({ user_id: userId, name, phone })
          .eq('id', emailCustomer.id)
          .is('user_id', null)
        if (!error) return emailCustomer.id as string
        console.error('walk-in customer linking failed', error.message)
      } else if (emailCustomer.user_id === userId) {
        return emailCustomer.id as string
      }
    }
  }

  const id = `c_${Date.now()}`
  const { error } = await supabase.from('customers').insert({ id, user_id: userId, name, email: normalizedEmail, phone })
  if (error) console.error('customer create failed', error.message)
  return id
}
