'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const r = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.ok) {
        const params = new URLSearchParams(window.location.search)
        const to = params.get('redirect')
        window.location.href = to && to.startsWith('/') ? to : '/dashboard'
      } else {
        setError(data?.errors?.[0]?.message || data?.message || 'Invalid email or password.')
        setLoading(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 font-display font-extrabold text-2xl text-ink-900 mb-8">
          <GraduationCap className="w-7 h-7 text-gold-500" />
          Prepady<span className="text-gold-500">.</span>
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-brand p-7 sm:p-9">
          <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-6">Log in to keep practising.</p>

          {error && (
            <div className="mb-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium px-4 py-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-900 mb-1.5">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-900 mb-1.5">Password</label>
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <div className="text-right mt-1.5">
                <Link href="/forgot-password" className="text-xs font-semibold text-muted-foreground hover:text-gold-600">Forgot password?</Link>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl font-black h-12">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log in'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton onError={setError} />

          <p className="text-center text-sm text-muted-foreground mt-6">
            New to Prepady?{' '}
            <Link href="/signup" className="font-semibold text-ink-900 hover:text-gold-600">Create an account</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
