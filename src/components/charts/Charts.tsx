/**
 * Lightweight, dependency-free SVG charts (server-rendered, themeable via the
 * brand Tailwind colours). Used on the student dashboard and admin insights.
 */
import { cn } from '@/lib/utils'

// ── Radial progress (donut) ───────────────────────────────────────────────────
export function RadialProgress({
  value,
  label,
  sublabel,
  size = 132,
  tone = 'gold',
}: {
  value: number // 0–100
  label?: string
  sublabel?: string
  size?: number
  tone?: 'gold' | 'success' | 'ink'
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)))
  const stroke = 12
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const dash = (v / 100) * c
  const toneClass = tone === 'success' ? 'text-success' : tone === 'ink' ? 'text-ink-900' : 'text-gold-500'
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="text-muted" stroke="currentColor" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className={toneClass}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-extrabold text-ink-900 leading-none">{label ?? `${v}%`}</span>
        {sublabel && <span className="text-[10px] font-semibold text-muted-foreground mt-0.5 uppercase tracking-wide">{sublabel}</span>}
      </div>
    </div>
  )
}

// ── Horizontal bar list (per-subject / per-topic performance) ─────────────────
export interface BarItem {
  label: string
  /** 0–100 percentage shown as the bar width. */
  pct: number
  /** Optional count/detail text on the right. */
  detail?: string
  tone?: 'good' | 'fair' | 'weak' | 'neutral'
}

const BAR_TONE: Record<NonNullable<BarItem['tone']>, string> = {
  good: 'bg-success',
  fair: 'bg-gold-500',
  weak: 'bg-destructive',
  neutral: 'bg-ink-900',
}

export function BarList({ items, className }: { items: BarItem[]; className?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Not enough data yet — practise a few questions to see this.</p>
  }
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1 text-sm">
            <span className="font-semibold text-ink-900 truncate pr-2">{it.label}</span>
            <span className="font-bold text-ink-900 shrink-0">
              {Math.round(it.pct)}%{it.detail ? <span className="text-muted-foreground font-medium"> · {it.detail}</span> : ''}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', BAR_TONE[it.tone ?? 'neutral'])} style={{ width: `${Math.max(2, Math.min(100, it.pct))}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Mini area/line chart (score trend over time) ──────────────────────────────
export function TrendChart({
  data,
  height = 120,
  tone = 'gold',
}: {
  data: number[] // values 0–100 in chronological order
  height?: number
  tone?: 'gold' | 'ink'
}) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No completed sessions yet.</p>
  }
  const w = 320
  const h = height
  const pad = 8
  const n = data.length
  const maxV = 100
  const x = (i: number) => (n === 1 ? w / 2 : pad + (i / (n - 1)) * (w - pad * 2))
  const y = (v: number) => h - pad - (v / maxV) * (h - pad * 2)
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L ${x(n - 1).toFixed(1)} ${h - pad} L ${x(0).toFixed(1)} ${h - pad} Z`
  const toneClass = tone === 'ink' ? 'text-ink-900' : 'text-gold-500'
  const gradId = `grad-${tone}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" className={toneClass}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[25, 50, 75].map((g) => (
        <line key={g} x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} className="text-border" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="currentColor" />
      ))}
    </svg>
  )
}
