import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft, Sparkles, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAuthContext } from '@/lib/auth'
import { isPremiumPlus } from '@/lib/quiz'
import { SnapSolve } from './SnapSolve'

export const metadata: Metadata = { title: 'Snap & Solve — Prepady' }
export const dynamic = 'force-dynamic'

export default async function SnapPage() {
  const { user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/snap')
  const plus = isPremiumPlus(user as { plan?: string; subscriptionExpiresAt?: string })

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900"><ArrowLeft className="w-4 h-4" /> Dashboard</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-1"><Sparkles className="w-4 h-4" /> Premium Plus</p>
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Snap &amp; Solve · Voice Ask</h1>
        <p className="text-muted-foreground mb-8">Photograph any question for a worked solution, or just ask — by voice or text.</p>

        {plus ? (
          <SnapSolve />
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-gold-300 bg-gold-50/60 p-10 text-center">
            <Lock className="w-10 h-10 text-gold-600 mx-auto mb-3" />
            <p className="font-display text-xl font-extrabold text-ink-900 mb-1">Unlock Snap &amp; Solve</p>
            <p className="text-muted-foreground text-sm mb-6">Snap a photo of any question for an instant worked solution, and ask the tutor by voice — on Premium Plus.</p>
            <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/upgrade"><Sparkles className="w-4 h-4" /> Get Premium Plus</Link></Button>
          </div>
        )}
      </div>
    </main>
  )
}
