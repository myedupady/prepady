'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, Loader2, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Turnstile, TURNSTILE_ENABLED } from '@/components/Turnstile'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (TURNSTILE_ENABLED && !captchaToken) {
      setError('Please complete the verification challenge.')
      return
    }
    setLoading(true)
    // Returns 200 regardless (doesn't reveal whether the email exists).
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), turnstileToken: captchaToken }),
    }).catch(() => {})
    setSent(true)
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 font-display font-extrabold text-2xl text-ink-900 mb-8">
          <GraduationCap className="w-7 h-7 text-gold-500" />
          Prepady<span className="text-gold-500">.</span>
        </Link>
        <div className="bg-card border border-border rounded-3xl shadow-brand p-7 sm:p-9">
          {sent ? (
            <div className="text-center">
              <MailCheck className="w-9 h-9 text-gold-500 mx-auto mb-3" />
              <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-1">Check your email</h1>
              <p className="text-muted-foreground text-sm mb-6">
                If an account exists for <span className="font-semibold text-ink-900">{email}</span>, we’ve sent a link to reset your password.
              </p>
              <Button asChild variant="outline" className="rounded-xl font-black">
                <Link href="/login">Back to log in</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-1">Forgot your password?</h1>
              <p className="text-muted-foreground text-sm mb-6">Enter your email and we’ll send you a reset link.</p>
              {error && (
                <div className="mb-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium px-4 py-3">{error}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-900 mb-1.5">Email</label>
                  <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </div>
                <Turnstile onVerify={setCaptchaToken} />
                <Button type="submit" disabled={loading} className="w-full rounded-xl font-black h-12">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset link'}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                <Link href="/login" className="font-semibold text-ink-900 hover:text-gold-600">Back to log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
