'use client'

import { useState } from 'react'
import { Copy, Check, LinkIcon } from 'lucide-react'

/** Shows the partner's shareable signup link + a copy button. */
export function PartnerShare({ code, discountLabel }: { code: string; discountLabel: string }) {
  const [copied, setCopied] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://prepady.com'
  const link = `${origin}/signup?ref=${code}`

  function copy() {
    navigator.clipboard?.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }, () => {})
  }

  return (
    <div className="rounded-2xl border border-gold-200 bg-gold-50/60 p-5">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gold-700 mb-2"><LinkIcon className="w-3.5 h-3.5" /> Your referral link</p>
      <p className="text-sm text-muted-foreground mb-3">Anyone who signs up with this link gets <b className="text-ink-900">{discountLabel}</b> on every payment — and each payment is credited to you.</p>
      <div className="flex gap-2">
        <input
          readOnly
          value={link}
          className="flex-1 h-11 rounded-xl border border-input bg-background px-3.5 text-sm text-ink-900 font-mono focus-visible:outline-none"
        />
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 px-4 h-11 rounded-xl bg-ink-900 text-gold-400 text-sm font-black hover:bg-ink-800 transition-colors"
        >
          {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">Code: <span className="font-mono font-bold text-ink-900">{code}</span></p>
    </div>
  )
}
