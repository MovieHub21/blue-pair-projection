import { NextResponse } from 'next/server'
import { dispatchNewsletterBatch } from '../../../../lib/newsletter'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected || request.headers.get('authorization') !== `Bearer ${expected}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ ok: true, ...(await dispatchNewsletterBatch()) })
  } catch (error: any) {
    console.error('[newsletter-cron] dispatch failed', error)
    return NextResponse.json({ error: 'Unable to queue scheduled newsletter recipients.' }, { status: 500 })
  }
}
