/**
 * Paystack helpers. The secret key stays server-side; the public key is only
 * used if we ever switch to the inline (client) checkout. We use the redirect
 * flow: initialize a transaction → send the user to Paystack → verify on return
 * and via webhook. Graceful when unconfigured (isPaystackConfigured = false).
 */
import crypto from 'crypto'

const SECRET = process.env.PAYSTACK_SECRET_KEY
const BASE = 'https://api.paystack.co'

export const isPaystackConfigured = !!SECRET

export interface InitResult {
  authorizationUrl: string
  reference: string
}

export async function initTransaction(args: {
  email: string
  amountKobo: number
  reference: string
  callbackUrl: string
  metadata: Record<string, unknown>
}): Promise<InitResult> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountKobo,
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
      currency: 'NGN',
    }),
    cache: 'no-store',
  })
  const data = (await res.json()) as { status: boolean; message: string; data?: { authorization_url: string; reference: string } }
  if (!res.ok || !data.status || !data.data) {
    throw new Error(`Paystack init failed: ${data.message || res.status}`)
  }
  return { authorizationUrl: data.data.authorization_url, reference: data.data.reference }
}

export interface VerifyResult {
  success: boolean
  reference: string
  amount: number
  customerCode?: string
  metadata?: Record<string, unknown>
}

export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${SECRET}` },
    cache: 'no-store',
  })
  const data = (await res.json()) as {
    status: boolean
    data?: { status: string; reference: string; amount: number; customer?: { customer_code?: string }; metadata?: Record<string, unknown> }
  }
  if (!res.ok || !data.status || !data.data) {
    return { success: false, reference, amount: 0 }
  }
  return {
    success: data.data.status === 'success',
    reference: data.data.reference,
    amount: data.data.amount,
    customerCode: data.data.customer?.customer_code,
    metadata: data.data.metadata,
  }
}

/** Verify a Paystack webhook signature (HMAC-SHA512 of the raw body with the secret). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!SECRET || !signature) return false
  const hash = crypto.createHmac('sha512', SECRET).update(rawBody).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
  } catch {
    return false
  }
}
