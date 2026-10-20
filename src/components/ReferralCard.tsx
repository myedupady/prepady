'use client'

import { useState } from 'react'
import { Gift, Copy, Check } from 'lucide-react'

/**
 * Shows the student's referral link + count, with a copy button. The referrer
 * earns premium days when a friend signs up with their link.
 */
export function ReferralCard({ code, count, rewardDays }: { code: string; count: number; rewardDays: number }) {
  const [copied, setCopied] = useState(false)
  const link = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${code}` : `/signup?ref=${code}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card shadow-brand p-5">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
        <Gift className="w-3.5 h-3.5" /> Refer friends, earn Premium
      </p>
      <p className="text-sm text-ink-900 mb-3">
        Share your link — you get <b>{rewardDays} days of Premium</b> for every friend who signs up.
        {count > 0 && <> You’ve referred <b>{count}</b> so far. 🎉</>}
      </p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 h-10 rounded-xl border border-input bg-background px-3 text-xs sm:text-sm text-ink-900 truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <button
          onClick={copy}
          className="h-10 px-4 rounded-xl bg-ink-900 text-ink-50 text-sm font-black inline-flex items-center gap-1.5 hover:bg-ink-800 transition-colors shrink-0"
        >
          {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
        </button>
      </div>
    </div>
  )
}
