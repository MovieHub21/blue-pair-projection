// Next 14 caches server-side fetch() GET requests in its Data Cache (with no expiry) unless told
// otherwise. Supabase reads are GET requests, so without this, pages and API routes keep serving
// the first result they ever read (e.g. old room statuses, offers, events, footer content) on
// production. Every server-side Supabase client uses this so reads always reach the database.
export const noStoreFetch: typeof fetch = (input, init) => fetch(input, { ...init, cache: 'no-store' })
