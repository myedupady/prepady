import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

/**
 * GET /api/auth/verify-email?token=...
 * Confirms a user's email. Idempotent-ish: an invalid/expired token returns 400.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')?.trim()
  if (!token) return NextResponse.json({ error: 'Missing token.' }, { status: 400 })

  try {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'users',
      where: { emailVerifyToken: { equals: token } },
      limit: 1,
      overrideAccess: true,
    })
    const user = res.docs[0] as
      | { id: number | string; emailVerifyExpiry?: string | null }
      | undefined
    if (!user) return NextResponse.json({ error: 'This verification link is invalid.' }, { status: 400 })

    const expiry = user.emailVerifyExpiry ? new Date(user.emailVerifyExpiry).getTime() : 0
    if (expiry && expiry < Date.now()) {
      return NextResponse.json({ error: 'This verification link has expired.' }, { status: 400 })
    }

    await payload.update({
      collection: 'users',
      id: user.id,
      overrideAccess: true,
      data: { emailVerified: true, emailVerifyToken: null, emailVerifyExpiry: null } as Record<string, unknown>,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('auth/verify-email error:', err)
    return NextResponse.json({ error: 'Could not verify right now. Please try again.' }, { status: 500 })
  }
}
