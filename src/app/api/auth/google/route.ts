import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'

/**
 * Google sign-in (adapted from Myedupady). The client sends a Google ID token;
 * we verify it, find/create the student, mint a Payload session token, and set
 * the payload-token cookie. Requires GOOGLE creds — the button only renders when
 * NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { idToken } = body as { idToken?: string }
    if (!idToken) {
      return NextResponse.json({ error: 'ID Token is required.' }, { status: 400 })
    }

    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`)
    if (!googleRes.ok) {
      return NextResponse.json({ error: 'Invalid Google login session. Please try again.' }, { status: 401 })
    }
    const googlePayload = await googleRes.json()
    const { email, email_verified, name, aud } = googlePayload as {
      email?: string
      email_verified?: string | boolean
      name?: string
      aud?: string
    }

    if (!email) {
      return NextResponse.json({ error: 'Email not provided by your Google account.' }, { status: 400 })
    }
    if (email_verified !== 'true' && email_verified !== true) {
      return NextResponse.json({ error: 'Your Google email address is not verified.' }, { status: 401 })
    }
    const expectedClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').replace(/^["']|["']$/g, '')
    if (expectedClientId && aud !== expectedClientId) {
      return NextResponse.json({ error: 'App client ID mismatch.' }, { status: 401 })
    }

    const payload = await getPayload({ config: configPromise })
    const found = await payload.find({
      collection: 'users',
      where: { email: { equals: email.toLowerCase() } },
      limit: 1,
    })
    let user = found.docs[0]
    if (!user) {
      user = await payload.create({
        collection: 'users',
        data: {
          email: email.toLowerCase(),
          name: name || email.split('@')[0],
          password: crypto.randomBytes(32).toString('hex'),
          role: 'student',
          // Google already verified this email, so mark it verified for our
          // email-gate (and keep Payload's _verified for compatibility).
          emailVerified: true,
          _verified: true,
        } as Record<string, unknown> as never,
      })
    }

    // Mint a genuine Payload token: set a temp password, log in, then scramble it.
    const tempPassword = crypto.randomBytes(32).toString('hex')
    await payload.update({ collection: 'users', id: user.id, data: { password: tempPassword } })
    const loginResult = await payload.login({
      collection: 'users',
      data: { email: email.toLowerCase(), password: tempPassword },
    })
    await payload.update({ collection: 'users', id: user.id, data: { password: crypto.randomBytes(32).toString('hex') } })

    if (!loginResult.token) {
      return NextResponse.json({ error: 'Failed to generate session token.' }, { status: 500 })
    }

    const res = NextResponse.json({ success: true, redirect: '/dashboard' })
    res.cookies.set('payload-token', loginResult.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      // Share across apex + www when COOKIE_DOMAIN is set (e.g. .prepady.com).
      ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
    })
    return res
  } catch (err) {
    console.error('[auth/google] error:', err)
    return NextResponse.json({ error: 'Google login failed. Please try again.' }, { status: 500 })
  }
}
