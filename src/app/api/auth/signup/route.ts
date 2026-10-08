import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import type { RequiredDataFromCollectionSlug } from 'payload'
import configPromise from '@payload-config'
import { verifyTurnstile } from '@/lib/turnstile'
import { clientIp } from '@/lib/rate-limit'
import { generateVerifyToken, sendVerificationEmail, VERIFY_TOKEN_TTL_MS } from '@/lib/email-verify'

/**
 * POST /api/auth/signup  Body: { name, email, password, turnstileToken? }
 *
 * CAPTCHA-protected account creation (rate-limited in middleware). Creates the
 * user, sends a verification email, and returns — the client then logs in via
 * /api/users/login. Verification only *gates AI* (see the AI routes); it does
 * not block login, so sign-up stays low-friction.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { name, email, password, turnstileToken } = body as {
      name?: string
      email?: string
      password?: string
      turnstileToken?: string
    }

    const cleanEmail = (email ?? '').trim().toLowerCase()
    const cleanName = (name ?? '').trim()
    if (!cleanName || !cleanEmail || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
    }

    // ── CAPTCHA ───────────────────────────────────────────────────────────────
    const captcha = await verifyTurnstile(turnstileToken, clientIp(req))
    if (!captcha.success) {
      return NextResponse.json({ error: 'Please complete the verification challenge.' }, { status: 400 })
    }

    const payload = await getPayload({ config: configPromise })

    const token = generateVerifyToken()
    try {
      await payload.create({
        collection: 'users',
        data: {
          name: cleanName,
          email: cleanEmail,
          password,
          emailVerified: false,
          emailVerifyToken: token,
          emailVerifyExpiry: new Date(Date.now() + VERIFY_TOKEN_TTL_MS).toISOString(),
        } as unknown as RequiredDataFromCollectionSlug<'users'>,
      })
    } catch {
      // Most likely a duplicate email — keep the message generic.
      return NextResponse.json(
        { error: 'Could not create your account. That email may already be in use.' },
        { status: 400 },
      )
    }

    // Fire the verification email (non-fatal).
    await sendVerificationEmail(payload, { to: cleanEmail, name: cleanName, token })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('auth/signup error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
