'use client'

import { useState } from 'react'
import { Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Starts a Paystack checkout for a plan and redirects to the payment page.
 * Disabled + spinner while in flight so it can't be double-clicked.
 */
export function UpgradeButton({ planId, label, disabled }: { planId: string; label: string; disabled?: boolean }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function pay() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const r = await fetch('/api/pay/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ planId }),
      })
      const data = await r.json()
      if (r.ok && data.authorizationUrl) {
        window.location.href = data.authorizationUrl // → Paystack checkout
        return // keep spinner during navigation
      }
      setError(data.error || 'Could not start the payment.')
    } catch {
      setError('Could not start the payment. Please try again.')
    } finally {
      // Only clear if we didn't navigate.
      setLoading(false)
    }
  }

  return (
    <div>
      <Button onClick={pay} disabled={loading || disabled} variant="accent" className="w-full rounded-xl font-black h-12">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{disabled ? <Lock className="w-4 h-4" /> : null} {label}</>}
      </Button>
      {error && <p className="text-xs text-destructive font-medium mt-2 text-center">{error}</p>}
    </div>
  )
}
