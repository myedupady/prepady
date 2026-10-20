import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyTransaction } from '@/lib/paystack'
import { grantPremium } from '@/lib/subscription'

/**
 * GET /api/pay/verify?reference=...
 * Called from the /pay/callback page after Paystack redirects back. Verifies the
 * transaction and grants premium immediately (the webhook is the backup path).
 * Only grants to the authenticated user when the reference's metadata matches.
 */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get('reference')?.trim()
  if (!reference) return NextResponse.json({ ok: false, error: 'Missing reference.' }, { status: 400 })

  try {
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ ok: false, error: 'You must be logged in.' }, { status: 401 })

    const result = await verifyTransaction(reference)
    if (!result.success) {
      return NextResponse.json({ ok: false, error: 'Payment not confirmed.' }, { status: 402 })
    }

    const meta = (result.metadata ?? {}) as { userId?: number | string; planId?: string }
    // Guard: the transaction must belong to this user.
    if (String(meta.userId) !== String(user.id)) {
      return NextResponse.json({ ok: false, error: 'This payment is not for your account.' }, { status: 403 })
    }

    const granted = await grantPremium(payload, { userId: user.id, planId: String(meta.planId), customerCode: result.customerCode })
    return NextResponse.json({ ok: granted })
  } catch (err) {
    console.error('pay/verify error:', err)
    return NextResponse.json({ ok: false, error: 'Could not verify the payment.' }, { status: 500 })
  }
}
