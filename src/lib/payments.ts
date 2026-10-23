import type { Payload, RequiredDataFromCollectionSlug } from 'payload'

/** Paystack won't charge below ~₦100; never let a discount drop below this. */
export const MIN_CHARGE_NGN = 100

export interface PartnerLike {
  id?: number | string
  active?: boolean
  discountType?: 'percent' | 'fixed'
  discountValue?: number
  revenueShareType?: 'percent' | 'fixed'
  revenueShareValue?: number
  profile?: { id?: number | string } | number | string | null
}

/** Find an active partner by code (case-insensitive). */
export async function resolvePartnerByCode(payload: Payload, code?: string | null): Promise<PartnerLike | null> {
  const c = (code ?? '').trim().toUpperCase()
  if (!c) return null
  const res = await payload
    .find({ collection: 'partners', where: { and: [{ code: { equals: c } }, { active: { equals: true } }] }, limit: 1, depth: 0, overrideAccess: true })
    .catch(() => ({ docs: [] as PartnerLike[] }))
  return (res.docs[0] as PartnerLike) ?? null
}

/** Discount (₦) a referred student gets on a base price, clamped so a minimum stays payable. */
export function computeDiscount(partner: PartnerLike | null, baseAmount: number): number {
  if (!partner || partner.active === false) return 0
  const v = Math.max(0, Number(partner.discountValue) || 0)
  let d = partner.discountType === 'fixed' ? v : Math.round((baseAmount * v) / 100)
  d = Math.max(0, Math.min(d, Math.max(0, baseAmount - MIN_CHARGE_NGN)))
  return d
}

/** Revenue (₦) attributed to the partner for a payment of `amountPaid`. */
export function computePartnerShare(partner: PartnerLike | null, amountPaid: number): number {
  if (!partner) return 0
  const v = Math.max(0, Number(partner.revenueShareValue) || 0)
  const s = partner.revenueShareType === 'fixed' ? v : Math.round((amountPaid * v) / 100)
  return Math.max(0, Math.min(s, amountPaid))
}

export function partnerProfileId(partner: PartnerLike | null): number | string | undefined {
  const p = partner?.profile
  if (p == null) return undefined
  return typeof p === 'object' ? p.id : p
}

export interface RecordPaymentArgs {
  reference: string
  userId: number | string
  email?: string
  planId?: string
  baseAmount: number
  discountAmount: number
  amount: number
  status?: 'success' | 'pending' | 'failed'
  partnerId?: number | string
  partnerCode?: string
  partnerProfileId?: number | string
  partnerShareAmount?: number
  customerCode?: string
}

/**
 * Idempotently record a payment (matched on the Paystack reference). Safe to call
 * from both the verify callback and the webhook — the second call updates rather
 * than duplicates.
 */
export async function recordPayment(payload: Payload, a: RecordPaymentArgs): Promise<void> {
  const data: Record<string, unknown> = {
    reference: a.reference,
    user: a.userId,
    email: a.email,
    planId: a.planId,
    status: a.status ?? 'success',
    baseAmount: a.baseAmount,
    discountAmount: a.discountAmount,
    amount: a.amount,
    partner: a.partnerId ?? undefined,
    partnerCode: a.partnerCode ?? undefined,
    partnerProfile: a.partnerProfileId ?? undefined,
    partnerShareAmount: a.partnerShareAmount ?? 0,
    paystackCustomerCode: a.customerCode ?? undefined,
    paidAt: new Date().toISOString(),
  }
  const payData = data as unknown as RequiredDataFromCollectionSlug<'payments'>
  const existing = await payload
    .find({ collection: 'payments', where: { reference: { equals: a.reference } }, limit: 1, depth: 0, overrideAccess: true })
    .catch(() => ({ docs: [] as Array<{ id: number | string }> }))
  if (existing.docs[0]) {
    await payload.update({ collection: 'payments', id: existing.docs[0].id, data: payData, overrideAccess: true }).catch((e) => console.error('recordPayment update:', e))
  } else {
    await payload.create({ collection: 'payments', data: payData, overrideAccess: true }).catch((e) => console.error('recordPayment create:', e))
  }
}
