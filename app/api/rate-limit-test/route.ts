import { NextResponse } from 'next/server'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, message: 'Rate-limit test request accepted.' })
}
