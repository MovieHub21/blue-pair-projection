import { NextResponse } from 'next/server'
import { getGoogleReviews } from '../../../lib/googleReviews'

export const dynamic = 'force-dynamic'

export async function GET() {
  const data = await getGoogleReviews()
  return NextResponse.json({ data }, { headers: { 'Cache-Control': 'no-store' } })
}
