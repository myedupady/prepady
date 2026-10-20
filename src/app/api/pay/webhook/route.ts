import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { verifyWebhookSignature } from '@/lib/paystack'
import { grantPremium } from '@/lib/subscription'

/**
 * POST /api/pay/webhook — Paystack server-to-server events (the reliable source
 * of truth for granting premium). Verifies the HMAC signature on the RAW body,
 * then on charge.success grants premium using the transaction metadata.
 *
 * Configure this URL in the Paystack dashboard → Settings → API Keys & Webhooks.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text()
  const signature = req.headers.get('x-paystack-signature')
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  let event: { event?: string; data?: { status?: string; customer?: { customer_code?: string }; metadata?: Record<string, unknown> } }
  try {
    event = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Bad payload.' }, { status: 400 })
  }

  try {
    if (event.event === 'charge.success' && event.data?.status === 'success') {
      const meta = (event.data.metadata ?? {}) as { userId?: number | string; planId?: string }
      if (meta.userId && meta.planId) {
        const payload = await getPayload({ config: configPromise })
        await grantPremium(payload, {
          userId: meta.userId,
          planId: String(meta.planId),
          customerCode: event.data.customer?.customer_code,
        })
      }
    }
  } catch (err) {
    console.error('pay/webhook processing error:', err)
    // Still 200 so Paystack doesn't retry forever on our internal error.
  }
  return NextResponse.json({ received: true })
}
