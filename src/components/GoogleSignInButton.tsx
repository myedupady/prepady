'use client'

import { useEffect, useRef } from 'react'

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

/**
 * Renders Google's official "Continue with Google" button via Google Identity
 * Services. On success it posts the ID token to /api/auth/google (which sets the
 * session cookie) and redirects. Renders nothing unless NEXT_PUBLIC_GOOGLE_CLIENT_ID
 * is set, so the app works without Google configured.
 */
export function GoogleSignInButton({ onError }: { onError?: (msg: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return

    function init() {
      const google = (window as unknown as { google?: any }).google
      if (!google?.accounts?.id || !ref.current) return
      google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp: { credential?: string }) => {
          try {
            const r = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: resp.credential }),
            })
            const data = await r.json()
            if (r.ok) window.location.href = data.redirect || '/dashboard'
            else onError?.(data.error || 'Google sign-in failed.')
          } catch {
            onError?.('Google sign-in failed. Please try again.')
          }
        },
      })
      google.accounts.id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        shape: 'pill',
      })
    }

    if (document.getElementById('gsi-script')) {
      init()
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.id = 'gsi-script'
    s.async = true
    s.defer = true
    s.onload = init
    document.head.appendChild(s)
  }, [onError])

  if (!CLIENT_ID) return null
  return <div ref={ref} style={{ display: 'flex', justifyContent: 'center' }} />
}
