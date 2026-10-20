import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getPlan, formatNgn } from '@/lib/plans'
import { initTransaction, isPaystackConfigured } from '@/lib/paystack'

/**
 * POST /api/pay/init  Body: { planId }
 * Starts a Paystack transaction for the logged-in user and returns the checkout
 * URL. The client redirects there; completion is confirmed via /pay/callback and
 * the webhook.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isPaystackConfigured) {
      return NextResponse.json({ error: 'Payments are not available yet. Please check back soon.' }, { status: 503 })
    }
    const payload = await getPayload({ config: configPromise })
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const plan = getPlan((body as { planId?: string }).planId)
    if (!plan) return NextResponse.json({ error: 'Unknown plan.' }, { status: 400 })

    const email = (user as { email?: string }).email
    if (!email) return NextResponse.json({ error: 'No email on your account.' }, { status: 400 })

    const reference = `prepady_${user.id}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

    const { authorizationUrl } = await initTransaction({
      email,
      amountKobo: plan.priceNgn * 100,
      reference,
      callbackUrl: `${base}/pay/callback`,
      metadata: { userId: user.id, planId: plan.id, label: `${plan.name} (${formatNgn(plan.priceNgn)})` },
    })

    return NextResponse.json({ authorizationUrl, reference })
  } catch (err) {
    console.error('pay/init error:', err)
    return NextResponse.json({ error: 'Could not start the payment. Please try again.' }, { status: 500 })
  }
}
