'use client'

import { useLinkStatus } from 'next/link'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Shows a spinner while its parent <Link> is navigating (Next's useLinkStatus),
 * otherwise renders `idle`. Drop it inside a Link to give slow navigations
 * (e.g. starting a quiz) instant feedback and stop double-clicks.
 */
export function LinkSpinner({ idle, className = 'w-5 h-5' }: { idle?: ReactNode; className?: string }) {
  const { pending } = useLinkStatus()
  return pending ? <Loader2 className={`${className} animate-spin text-gold-600`} /> : <>{idle}</>
}
