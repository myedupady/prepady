import type { Payload } from 'payload'
import { getPlan } from './plans'

/** Premium days a referrer earns for each successful referral. */
export const REFERRAL_REWARD_DAYS = 7

/**
 * Grant (or extend) premium by a number of days. If the user still has unexpired
 * premium, the new days stack on top; otherwise it starts from now.
 */
export async function grantPremiumDays(
  payload: Payload,
  args: { userId: number | string; days: number; customerCode?: string; plan?: 'premium' | 'premium-plus' },
): Promise<boolean> {
  if (!args.days || args.days <= 0) return false
  const user = await payload
    .findByID({ collection: 'users', id: args.userId, overrideAccess: true })
    .catch(() => null)
  if (!user) return false

  const existing = (user as { subscriptionExpiresAt?: string | null }).subscriptionExpiresAt
  const base = existing && new Date(existing).getTime() > Date.now() ? new Date(existing).getTime() : Date.now()
  const expiresAt = new Date(base + args.days * 24 * 60 * 60 * 1000).toISOString()

  // Don't downgrade a current Premium Plus user to Premium (e.g. via a referral
  // bonus that defaults to 'premium') while their Plus sub is still active.
  const current = (user as { plan?: string }).plan
  const stillPlus = current === 'premium-plus' && existing && new Date(existing).getTime() > Date.now()
  const plan = args.plan ?? (stillPlus ? 'premium-plus' : 'premium')

  await payload.update({
    collection: 'users',
    id: args.userId,
    overrideAccess: true,
    data: {
      plan,
      subscriptionExpiresAt: expiresAt,
      ...(args.customerCode ? { paystackCustomerCode: args.customerCode } : {}),
    } as Record<string, unknown>,
  })
  return true
}

/**
 * Grant (or extend) premium after a successful payment. Idempotency is the
 * caller's job (match on the Paystack reference).
 */
export async function grantPremium(
  payload: Payload,
  args: { userId: number | string; planId: string; customerCode?: string },
): Promise<boolean> {
  const plan = getPlan(args.planId)
  if (!plan) return false
  return grantPremiumDays(payload, { userId: args.userId, days: plan.days, customerCode: args.customerCode, plan: plan.tier })
}
