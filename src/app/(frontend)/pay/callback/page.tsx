'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { GraduationCap, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function CallbackInner() {
  const params = useSearchParams()
  const reference = params.get('reference') || params.get('trxref')
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!reference) {
      setState('error')
      setMessage('No payment reference found.')
      return
    }
    fetch(`/api/pay/verify?reference=${encodeURIComponent(reference)}`, { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (r.ok && data.ok) setState('ok')
        else {
          setState('error')
          setMessage(data?.error || 'We couldn’t confirm your payment yet. If you were charged, it will activate shortly.')
        }
      })
      .catch(() => {
        setState('error')
        setMessage('We couldn’t confirm your payment right now. If you were charged, it will activate shortly.')
      })
  }, [reference])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 font-display font-extrabold text-2xl text-ink-900 mb-8">
          <GraduationCap className="w-7 h-7 text-gold-500" /> Prepady<span className="text-gold-500">.</span>
        </Link>
        <div className="bg-card border border-border rounded-3xl shadow-brand p-8 text-center">
          {state === 'loading' && (
            <>
              <Loader2 className="w-9 h-9 text-gold-500 mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground text-sm">Confirming your payment…</p>
            </>
          )}
          {state === 'ok' && (
            <>
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h1 className="font-display text-xl font-extrabold text-ink-900 mb-1">You’re Premium! 🎉</h1>
              <p className="text-muted-foreground text-sm mb-6">Unlimited AI help, essay marking, timed mocks, and the full past-question bank are unlocked.</p>
              <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/dashboard">Go to dashboard</Link></Button>
            </>
          )}
          {state === 'error' && (
            <>
              <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <h1 className="font-display text-xl font-extrabold text-ink-900 mb-1">Payment not confirmed</h1>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/upgrade">Try again</Link></Button>
                <Button asChild variant="outline" className="rounded-xl font-black"><Link href="/dashboard">Dashboard</Link></Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function PayCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
