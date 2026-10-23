'use client'

import { useState } from 'react'
import { BrandLogo } from '@/components/BrandLogo'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PasswordInput } from '@/components/ui/password-input'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) return setError('This reset link is invalid or has expired. Request a new one.')

    setLoading(true)
    try {
      const r = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })
      if (r.ok) {
        window.location.href = '/dashboard'
      } else {
        const data = await r.json().catch(() => ({}))
        setError(data?.errors?.[0]?.message || 'This reset link is invalid or has expired. Request a new one.')
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
          <BrandLogo className="w-8 h-8" />
          Prepady<span className="text-gold-500">.</span>
        </Link>
        <div className="bg-card border border-border rounded-3xl shadow-brand p-7 sm:p-9">
          <h1 className="font-display text-2xl font-extrabold text-ink-900 mb-1">Set a new password</h1>
          <p className="text-muted-foreground text-sm mb-6">Choose a new password for your account.</p>
          {error && <div className="mb-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium px-4 py-3">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-900 mb-1.5">New password</label>
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-900 mb-1.5">Confirm password</label>
              <PasswordInput required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" autoComplete="new-password" />
              {confirm.length > 0 && (
                <p className={`text-xs font-semibold mt-1.5 ${password === confirm ? 'text-success' : 'text-destructive'}`}>
                  {password === confirm ? '✓ Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl font-black h-12">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset password'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            <Link href="/login" className="font-semibold text-ink-900 hover:text-gold-600">Back to log in</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
