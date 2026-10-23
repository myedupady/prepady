'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layers, Sparkles, Lock, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Premium "custom mix": pick several subjects and sit them together in one
 * adaptive session (e.g. JAMB's four subjects at a go). Free users see a lock.
 */
export function MultiSubjectPicker({
  examId,
  subjects,
  premium,
}: {
  examId: string
  subjects: { id: number; name: string }[]
  premium: boolean
}) {
  const router = useRouter()
  const [picked, setPicked] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  if (subjects.length < 2) return null

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  if (!premium) {
    return (
      <Link
        href="/upgrade"
        className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-gold-200 bg-gold-50/60 p-5 hover:shadow-brand transition-shadow"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center shrink-0"><Lock className="w-5 h-5 text-gold-700" /></div>
          <div>
            <p className="font-black text-ink-900">Custom mix — pick your subjects</p>
            <p className="text-xs text-muted-foreground">Sit several subjects at once (e.g. all four JAMB subjects). Premium feature.</p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-gold-600 shrink-0" />
      </Link>
    )
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card shadow-brand p-5">
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="w-full flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ink-900 flex items-center justify-center shrink-0"><Layers className="w-5 h-5 text-gold-400" /></div>
            <div>
              <p className="font-black text-ink-900">Custom mix — pick your subjects</p>
              <p className="text-xs text-muted-foreground">Choose several subjects and sit them together in one session.</p>
            </div>
          </div>
          <span className="text-sm font-black text-gold-700 shrink-0">Choose →</span>
        </button>
      ) : (
        <>
          <p className="font-black text-ink-900 mb-1">Pick subjects to mix</p>
          <p className="text-xs text-muted-foreground mb-4">Select two or more. We’ll serve an adaptive session across them.</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {subjects.map((s) => {
              const on = picked.includes(s.id)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${on ? 'border-ink-900 bg-ink-900 text-gold-400' : 'border-border bg-background text-ink-900 hover:border-ink-900'}`}
                >
                  {s.name}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => { setLoading(true); router.push(`/quiz/${examId}?subjects=${picked.join(',')}`) }}
              disabled={picked.length < 2 || loading}
              variant="accent"
              className="rounded-xl font-black"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : `Start mix (${picked.length})`}
            </Button>
            <button type="button" onClick={() => { setOpen(false); setPicked([]) }} className="text-sm font-semibold text-muted-foreground hover:text-ink-900">Cancel</button>
          </div>
        </>
      )}
    </div>
  )
}
