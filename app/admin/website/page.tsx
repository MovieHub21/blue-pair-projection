import { createSupabaseServerClient } from '../../../lib/supabase/server'
import WebsiteContentClient from './WebsiteContentClient'

export default async function WebsiteContentPage() {
  const db = createSupabaseServerClient()
  const { data } = await db.from('site_content').select('key, value')
  const content: Record<string, string> = {}
  for (const row of data ?? []) content[row.key] = row.value
  return <WebsiteContentClient initialContent={content} />
}
