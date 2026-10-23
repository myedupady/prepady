'use client'

import { useState } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { GoogleSignInButton } from '@/components/GoogleSignInButton'
import { Turnstile, TURNSTILE_ENABLED } from '@/components/Turnstile'

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: '', color: '' },
    { label: 'Weak', color: 'bg-destructive' },
    { label: 'Fair', color: 'bg-gold-400' },
    { label: 'Good', color: 'bg-gold-500' },
    { label: 'Strong', color: 'bg-success' },
    { label: 'Strong', color: 'bg-success' },
  ]
  return { score, ...levels[score] }
}

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError('Please complete the verification challenge.')
      return
    }
    setLoading(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      // Create the account (CAPTCHA-protected, rate-limited, sends a verify email)
      const createRes = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: cleanEmail,
          password,
          turnstileToken: captchaToken,
          ref: new URLSearchParams(window.location.search).get('ref') || undefined,
        }),
      })
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}))
        setError(data?.error || 'Could not create your account. That email may already be in use.')
        setLoading(false)
        return
      }
      // Log straight in
      const loginRes = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: cleanEmail, password }),
      })
      if (loginRes.ok) {
        window.location.href = '/dashboard'
      } else {
        // Account created but auto-login failed — send them to log in
        window.location.href = '/login'
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
          <BrandLogo className="w-8 h-8" />
          Prepady<span className="text-gold-500">.</span>
        </Link>

        <div className="bg-card border border-border rounded-3xl shadow-brand p-7 sm:p-9">
          <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-1">Create your free account</h1>
          <p className="text-muted-foreground text-sm mb-6">Start practising in seconds — no card needed.</p>

          {error && (
            <div className="mb-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium px-4 py-3">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-900 mb-1.5">Full name</label>
              <Input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Obi" autoComplete="name" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-900 mb-1.5">Email</label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-900 mb-1.5">Password</label>
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
              {password.length > 0 && (() => {
                const s = passwordStrength(password)
                return (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full transition-all ${s.color}`} style={{ width: `${(s.score / 5) * 100}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground w-12 text-right">{s.label}</span>
                  </div>
                )
              })()}
            </div>
            <Turnstile onVerify={setCaptchaToken} />
            <Button type="submit" disabled={loading} className="w-full rounded-xl font-black h-12">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton onError={setError} />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-ink-900 hover:text-gold-600">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
