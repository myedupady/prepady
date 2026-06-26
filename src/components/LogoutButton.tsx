'use client'

import { useState } from 'react'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  async function logout() {
    setLoading(true)
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.href = '/'
  }
  return (
    <button
      onClick={logout}
      disabled={loading}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900 transition-colors"
    >
      <LogOut className="w-4 h-4" /> {loading ? '…' : 'Log out'}
    </button>
  )
}
