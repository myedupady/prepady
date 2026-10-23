import Link from 'next/link'
import { BrandLogo } from '@/components/BrandLogo'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { ArrowLeft } from 'lucide-react'
import { hexToRgba } from '@/lib/color'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'Practise — Prepady' }

export default async function QuizHub() {
  const payload = await getPayload({ config: configPromise })
  const [regionsRes, examsRes] = await Promise.all([
    payload.find({ collection: 'regions', sort: 'order', limit: 100, depth: 0 }),
    payload.find({ collection: 'exams', where: { status: { equals: 'active' } }, sort: 'order', limit: 1000, depth: 0 }),
  ])
  const exams = examsRes.docs as Array<{ id: number; code: string; region: number }>
  const regions = regionsRes.docs as Array<{ id: number; name: string; color: string }>

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-extrabold text-lg text-ink-900">
            <BrandLogo className="w-7 h-7" />
            Prepady<span className="text-gold-500">.</span>
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-ink-900">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="font-display text-3xl font-extrabold text-ink-900 mb-1">Choose your exam</h1>
        <p className="text-muted-foreground mb-8">Pick an exam to start an adaptive practice session.</p>

        <div className="space-y-8">
          {regions.map((region) => {
            const regionExams = exams.filter((e) => e.region === region.id)
            if (!regionExams.length) return null
            return (
              <section key={region.id}>
                <h2 className="flex items-center gap-2 font-black text-ink-900 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: region.color }} />
                  {region.name}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {regionExams.map((e) => (
                    <Link
                      key={e.id}
                      href={`/quiz/${e.id}`}
                      className="text-sm font-semibold px-3.5 py-2 rounded-xl border border-border bg-card hover:shadow-brand transition-shadow"
                      style={{ color: region.color }}
                    >
                      {e.code}
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
