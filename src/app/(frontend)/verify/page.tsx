'use client'

import { Suspense, useEffect, useState } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

function VerifyInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token found.')
      return
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (r.ok) setState('ok')
        else {
          setState('error')
          setMessage(data?.error || 'This verification link is invalid.')
        }
      })
      .catch(() => {
        setState('error')
        setMessage('Could not verify right now. Please try again.')
      })
  }, [token])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 font-display font-extrabold text-2xl text-ink-900 mb-8">
          <BrandLogo className="w-8 h-8" />
          Prepady<span className="text-gold-500">.</span>
        </Link>
        <div className="bg-card border border-border rounded-3xl shadow-brand p-8 text-center">
          {state === 'loading' && (
            <>
              <Loader2 className="w-9 h-9 text-gold-500 mx-auto mb-3 animate-spin" />
              <p className="text-muted-foreground text-sm">Confirming your email…</p>
            </>
          )}
          {state === 'ok' && (
            <>
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h1 className="font-display text-xl font-extrabold text-ink-900 mb-1">Email confirmed</h1>
              <p className="text-muted-foreground text-sm mb-6">Your AI tutor is unlocked. Happy practising!</p>
              <Button asChild variant="accent" className="rounded-xl font-black"><Link href="/dashboard">Go to dashboard</Link></Button>
            </>
          )}
          {state === 'error' && (
            <>
              <XCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <h1 className="font-display text-xl font-extrabold text-ink-900 mb-1">Verification failed</h1>
              <p className="text-muted-foreground text-sm mb-6">{message}</p>
              <Button asChild variant="outline" className="rounded-xl font-black"><Link href="/dashboard">Back to dashboard</Link></Button>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  )
}
