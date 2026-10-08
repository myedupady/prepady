import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyTurnstile } from '@/lib/turnstile'
import { clientIp } from '@/lib/rate-limit'

/**
 * POST /api/auth/forgot-password  Body: { email, turnstileToken? }
 *
 * CAPTCHA-protected, rate-limited password-reset trigger. Always returns a
 * generic success so the endpoint can't be used to enumerate which emails exist.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { email, turnstileToken } = body as { email?: string; turnstileToken?: string }
    const cleanEmail = (email ?? '').trim().toLowerCase()

    const captcha = await verifyTurnstile(turnstileToken, clientIp(req))
    if (!captcha.success) {
      return NextResponse.json({ error: 'Please complete the verification challenge.' }, { status: 400 })
    }

    if (cleanEmail) {
      const payload = await getPayload({ config: configPromise })
      // Never reveal whether the email exists; swallow errors.
      await payload.forgotPassword({ collection: 'users', data: { email: cleanEmail } }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('auth/forgot-password error:', err)
    // Still return ok to avoid leaking information.
    return NextResponse.json({ ok: true })
  }
}
