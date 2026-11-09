import type { Metadata } from 'next'
import { BrandLogo } from '@/components/BrandLogo'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Check, Sparkles } from 'lucide-react'
import { getAuthContext } from '@/lib/auth'
import { isPremium, isPremiumPlus } from '@/lib/quiz'
import { PLANS, PREMIUM_PERKS, PREMIUM_PLUS_PERKS, FREE_PERKS, formatNgn } from '@/lib/plans'
import { isPaystackConfigured } from '@/lib/paystack'
import { Card, CardContent } from '@/components/ui/card'
import { UpgradeButton } from './UpgradeButton'

export const metadata: Metadata = { title: 'Upgrade — Prepady' }
export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  const { user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/upgrade')
  const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })
  const plus = isPremiumPlus(user as { plan?: string; subscriptionExpiresAt?: string })
  const expiresAt = (user as { subscriptionExpiresAt?: string }).subscriptionExpiresAt
  const premiumPlans = Object.values(PLANS).filter((p) => p.tier === 'premium')
  const plusPlans = Object.values(PLANS).filter((p) => p.tier === 'premium-plus')

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Go Premium</h1>
        <p className="text-muted-foreground mb-8">Unlock unlimited AI help, essay marking, timed mocks, and the full past-question bank.</p>

        {premium && (
          <div className="mb-6 rounded-2xl bg-gold-50 border border-gold-200 p-4 text-sm text-ink-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-600" /> You’re on <b>{plus ? 'Premium Plus' : 'Premium'}</b>
            {expiresAt ? <> — active until {new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Renew or change below.</> : '.'}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Premium */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <p className="font-black text-ink-900 text-lg mb-1">Premium</p>
              <p className="text-xs text-muted-foreground mb-4">From {formatNgn(premiumPlans[0].priceNgn)}/month</p>
              <ul className="space-y-2 mb-6">
                {PREMIUM_PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-900"><Check className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" /> {p}</li>
                ))}
              </ul>
              <div className="space-y-2">
                {premiumPlans.map((plan) => (
                  <UpgradeButton key={plan.id} planId={plan.id} label={`${plan.name.replace('Premium — ', '')} · ${formatNgn(plan.priceNgn)}`} disabled={!isPaystackConfigured} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Plus */}
          <Card className="border-2 border-gold-300 bg-card shadow-brand relative">
            <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest bg-ink-900 text-gold-400 px-2 py-0.5 rounded-full">Most powerful</span>
            <CardContent className="p-6">
              <p className="flex items-center gap-1.5 font-black text-ink-900 text-lg mb-1"><Sparkles className="w-4 h-4 text-gold-600" /> Premium Plus</p>
              <p className="text-xs text-muted-foreground mb-4">From {formatNgn(plusPlans[0].priceNgn)}/month</p>
              <ul className="space-y-2 mb-6">
                {PREMIUM_PLUS_PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-900"><Check className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" /> {p}</li>
                ))}
              </ul>
              <div className="space-y-2">
                {plusPlans.map((plan) => (
                  <UpgradeButton key={plan.id} planId={plan.id} label={`${plan.name.replace('Premium Plus — ', '')} · ${formatNgn(plan.priceNgn)}`} disabled={!isPaystackConfigured} accent />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Free (reference) */}
        <Card className="border border-border bg-card mt-5">
          <CardContent className="p-5 flex flex-wrap items-center gap-x-6 gap-y-1">
            <p className="font-black text-ink-900">Free · ₦0</p>
            {FREE_PERKS.map((p) => (
              <span key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="w-3.5 h-3.5 text-muted-foreground" /> {p}</span>
            ))}
          </CardContent>
        </Card>

        {!isPaystackConfigured && (
          <p className="text-xs text-muted-foreground mt-6 text-center">Payments are being set up — check back shortly.</p>
        )}
        <p className="text-xs text-muted-foreground mt-6 text-center">Secure payment by Paystack. Prices in Nigerian naira.</p>
      </div>
    </main>
  )
}
