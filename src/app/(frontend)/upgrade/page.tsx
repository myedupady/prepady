import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { getAuthContext } from '@/lib/auth'
import { isPremium } from '@/lib/quiz'
import { PLANS, PREMIUM_PERKS, FREE_PERKS, formatNgn } from '@/lib/plans'
import { isPaystackConfigured } from '@/lib/paystack'
import { Card, CardContent } from '@/components/ui/card'
import { UpgradeButton } from './UpgradeButton'

export const metadata: Metadata = { title: 'Upgrade — Prepady' }
export const dynamic = 'force-dynamic'

export default async function UpgradePage() {
  const { user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/upgrade')
  const premium = isPremium(user as { plan?: string; subscriptionExpiresAt?: string })
  const expiresAt = (user as { subscriptionExpiresAt?: string }).subscriptionExpiresAt

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <GraduationCap className="w-6 h-6 text-gold-500" /> Prepady<span className="text-gold-500">.</span>
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
            <Sparkles className="w-4 h-4 text-gold-600" /> You’re on <b>Premium</b>
            {expiresAt ? <> — active until {new Date(expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. Renew any time below.</> : '.'}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          {/* Free */}
          <Card className="border border-border bg-card">
            <CardContent className="p-6">
              <p className="font-black text-ink-900 mb-1">Free</p>
              <p className="font-display text-2xl font-extrabold text-ink-900 mb-4">₦0</p>
              <ul className="space-y-2 mb-6">
                {FREE_PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-900"><Check className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> {p}</li>
                ))}
              </ul>
              <div className="h-12 flex items-center justify-center text-sm font-semibold text-muted-foreground">Current base plan</div>
            </CardContent>
          </Card>

          {/* Premium plans */}
          {Object.values(PLANS).map((plan, i) => (
            <Card key={plan.id} className={`border bg-card ${i === 1 ? 'border-gold-300 shadow-brand' : 'border-border'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-black text-ink-900">{plan.name.replace('Premium — ', '')}</p>
                  {i === 1 && <span className="text-[10px] font-black uppercase tracking-widest bg-gold-100 text-gold-800 px-2 py-0.5 rounded-full">Best value</span>}
                </div>
                <p className="font-display text-2xl font-extrabold text-ink-900">{formatNgn(plan.priceNgn)}</p>
                <p className="text-xs text-muted-foreground mb-4">{plan.blurb}</p>
                <ul className="space-y-2 mb-6">
                  {PREMIUM_PERKS.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-ink-900"><Check className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" /> {p}</li>
                  ))}
                </ul>
                <UpgradeButton planId={plan.id} label={premium ? 'Renew / extend' : `Pay ${formatNgn(plan.priceNgn)}`} disabled={!isPaystackConfigured} />
              </CardContent>
            </Card>
          ))}
        </div>

        {!isPaystackConfigured && (
          <p className="text-xs text-muted-foreground mt-6 text-center">Payments are being set up — check back shortly.</p>
        )}
        <p className="text-xs text-muted-foreground mt-6 text-center">Secure payment by Paystack. Prices in Nigerian naira.</p>
      </div>
    </main>
  )
}
