import type { Payload } from 'payload'
import { getPlan } from './plans'

/**
 * Grant (or extend) premium for a user after a successful payment. If the user
 * still has unexpired premium, we add the new days on top; otherwise we start
 * from now. Idempotency is the caller's job (match on the Paystack reference).
 */
export async function grantPremium(
  payload: Payload,
  args: { userId: number | string; planId: string; customerCode?: string },
): Promise<boolean> {
  const plan = getPlan(args.planId)
  if (!plan) return false

  const user = await payload
    .findByID({ collection: 'users', id: args.userId, overrideAccess: true })
    .catch(() => null)
  if (!user) return false

  const existing = (user as { subscriptionExpiresAt?: string | null }).subscriptionExpiresAt
  const base = existing && new Date(existing).getTime() > Date.now() ? new Date(existing).getTime() : Date.now()
  const expiresAt = new Date(base + plan.days * 24 * 60 * 60 * 1000).toISOString()

  await payload.update({
    collection: 'users',
    id: args.userId,
    overrideAccess: true,
    data: {
      plan: 'premium',
      subscriptionExpiresAt: expiresAt,
      ...(args.customerCode ? { paystackCustomerCode: args.customerCode } : {}),
    } as Record<string, unknown>,
  })
  return true
}
