import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '../supabase/config'

const KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const MAP:Array<[string,string]>=[['/api/admin/paystack','payments'],['/api/paystack','payments'],['/api/payments','payments'],['/api/booking','bookings'],['/api/bookings','bookings'],['/api/availability','availability'],['/api/auth','auth'],['/api/reviews','reviews'],['/api/restaurant','restaurant'],['/api/menu','restaurant'],['/api/bar','bar'],['/api/drinks','bar'],['/api/shortlet','shortlets'],['/api/shortlets','shortlets'],['/api/events','events'],['/api/ai','ai'],['/api/email','emails']]
function scope(){if(process.env.VERCEL_ENV==='preview')return 'preview';if(process.env.VERCEL_ENV==='production')return 'production';return process.env.NODE_ENV==='development'?'development':'production'}
export function resolveRouteState(path:string){return MAP.find(([p])=>path===p||path.startsWith(p+'/'))?.[1]??null}
export async function readRouteState(path:string){const item=resolveRouteState(path);if(!item)return {ok:true,item:null};if(!KEY){console.error('[runtime][config] Missing server key');return {ok:true,item}}const db=createClient(SUPABASE_URL,KEY,{auth:{autoRefreshToken:false,persistSession:false}});const {data,error}=await db.from('runtime_matrix').select('item,active').eq('scope',scope()).in('item',['global',item]);if(error){console.error('[runtime][read]',error.message);return {ok:true,item}}const global=data?.find(r=>r.item==='global');const specific=data?.find(r=>r.item===item);return {ok:global?.active!==false&&specific?.active!==false,item}}
