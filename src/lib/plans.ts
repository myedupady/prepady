/**
 * Subscription plans (NGN, billed via Paystack). Prices are in naira; Paystack
 * works in kobo (×100). Perks describe what each tier unlocks; the actual gating
 * lives in the AI/marking routes (isPremium) and the daily caps in lib/quiz.ts.
 */

export interface Plan {
  id: string
  name: string
  priceNgn: number
  /** Days of premium access granted on successful payment. */
  days: number
  blurb: string
}

export const PLANS: Record<string, Plan> = {
  'premium-monthly': {
    id: 'premium-monthly',
    name: 'Premium — Monthly',
    priceNgn: 1500,
    days: 30,
    blurb: 'Billed monthly.',
  },
  'premium-termly': {
    id: 'premium-termly',
    name: 'Premium — Termly',
    priceNgn: 3500,
    days: 120,
    blurb: 'One term (4 months) — best value.',
  },
}

export const PREMIUM_PERKS = [
  'Unlimited AI tutor follow-ups',
  'AI essay & theory marking',
  'Full timed CBT mock exams',
  'Complete past-question bank',
  'Priority new content',
]

export const FREE_PERKS = [
  'Daily adaptive practice',
  '5 AI tutor questions/day',
  'Instant answer explanations',
  'Sample past questions',
]

export function getPlan(id: string | undefined): Plan | null {
  return (id && PLANS[id]) || null
}

/** Format naira for display, e.g. ₦1,500. */
export function formatNgn(n: number): string {
  return `₦${n.toLocaleString('en-NG')}`
}
