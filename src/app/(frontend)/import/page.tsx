import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { ArrowLeft } from 'lucide-react'
import { getAuthContext } from '@/lib/auth'
import { ImportUploader } from './ImportUploader'

export const metadata: Metadata = { title: 'Import questions — Prepady Admin' }
export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const { user } = await getAuthContext()
  if (!user) redirect('/login?redirect=/import')
  const role = (user as { role?: string }).role
  if (role !== 'admin' && role !== 'editor') redirect('/dashboard')

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" /> Prepady<span className="text-gold-500">.</span>
          </Link>
          <a href="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Admin
          </a>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Bulk import questions</h1>
        <p className="text-muted-foreground mb-8">Upload or paste a CSV to add a year’s paper in one go. Re-importing updates matched rows (by source_ref), so it’s safe to run again.</p>
        <ImportUploader />
      </div>
    </main>
  )
}
