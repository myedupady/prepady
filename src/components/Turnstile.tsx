'use client'

import { useEffect, useRef } from 'react'

export const TURNSTILE_ENABLED = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      remove: (id: string) => void
      reset: (id?: string) => void
    }
    __turnstileLoading?: Promise<void>
  }
}

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (window.__turnstileLoading) return window.__turnstileLoading
  window.__turnstileLoading = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(s)
  })
  return window.__turnstileLoading
}

/**
 * Cloudflare Turnstile CAPTCHA widget. Renders nothing when no site key is
 * configured, so forms work unchanged until you enable it. Calls `onVerify` with
 * the token to submit, and `onVerify(null)` when it expires/errors.
 */
export function Turnstile({ onVerify }: { onVerify: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return
    let cancelled = false
    const el = ref.current
    loadScript()
      .then(() => {
        if (cancelled || !window.turnstile || !el) return
        widgetId.current = window.turnstile.render(el, {
          sitekey: SITE_KEY,
          callback: (token: string) => onVerify(token),
          'expired-callback': () => onVerify(null),
          'error-callback': () => onVerify(null),
        })
      })
      .catch(() => onVerify(null))
    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current)
        } catch {
          /* ignore */
        }
      }
    }
  }, [onVerify])

  if (!SITE_KEY) return null
  return <div ref={ref} className="my-3" />
}
