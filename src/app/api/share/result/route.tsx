import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/share/result?name=&pct=&score=&total=&exam=&subject=
 * Renders a branded, celebratory result card (1200×630 PNG) students can save
 * and post to social. User-initiated sharing of their own score — no auth; the
 * values are just rendered onto the card. Brand palette: ink + gold + cream.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const clamp = (s: string | null, n: number) => (s ?? '').slice(0, n)
  const name = clamp(sp.get('name'), 40) || 'A Prepady student'
  const firstName = name.split(' ')[0]
  const exam = clamp(sp.get('exam'), 40) || 'Exam'
  const subject = clamp(sp.get('subject'), 40)
  const pct = Math.max(0, Math.min(100, Math.round(Number(sp.get('pct')) || 0)))
  const score = clamp(sp.get('score'), 6)
  const total = clamp(sp.get('total'), 6)

  // Motivational percentile band derived from the score (not a precise ranking).
  const topPct = pct >= 90 ? 2 : pct >= 80 ? 8 : pct >= 70 ? 14 : pct >= 60 ? 25 : pct >= 50 ? 40 : 60
  const badge = pct >= 50 ? `Top ${topPct}% in Nigeria` : 'On the climb'

  const INK = '#201B15'
  const INK2 = '#2B2419'
  const GOLD = '#F2A33C'
  const GOLD_SOFT = '#F7C067'
  const CREAM = '#F6F2E9'
  const MUTED = '#C9BFAD'

  // Scattered confetti dots for a celebratory feel (brand golds/cream).
  const confetti = [
    { x: 90, y: 70, s: 14, c: GOLD, r: 20 }, { x: 1040, y: 60, s: 18, c: GOLD_SOFT, r: -15 },
    { x: 1120, y: 150, s: 10, c: CREAM, r: 0 }, { x: 60, y: 300, s: 10, c: GOLD_SOFT, r: 10 },
    { x: 1150, y: 420, s: 14, c: GOLD, r: 25 }, { x: 150, y: 540, s: 12, c: CREAM, r: -20 },
    { x: 980, y: 540, s: 16, c: GOLD, r: 15 }, { x: 540, y: 40, s: 10, c: GOLD_SOFT, r: 0 },
    { x: 1080, y: 320, s: 9, c: CREAM, r: 0 }, { x: 40, y: 150, s: 11, c: GOLD, r: 30 },
  ]

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: INK,
          backgroundImage: `radial-gradient(900px 500px at 50% -10%, ${INK2} 0%, ${INK} 60%)`,
          padding: '54px 64px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Confetti */}
        {confetti.map((d, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: d.x,
              top: d.y,
              width: d.s,
              height: d.s * 0.5,
              background: d.c,
              borderRadius: 2,
              transform: `rotate(${d.r}deg)`,
              display: 'flex',
            }}
          />
        ))}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 42, fontWeight: 800, color: CREAM }}>
            🚀 Prepady<span style={{ color: GOLD }}>.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 20, fontWeight: 800, color: INK, background: GOLD, padding: '10px 20px', borderRadius: 999 }}>
            🏆 {badge}
          </div>
        </div>

        {/* Hero score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', color: CREAM }}>
            <span style={{ display: 'flex', fontSize: 180, fontWeight: 800, lineHeight: 1 }}>{score}</span>
            <span style={{ display: 'flex', fontSize: 92, fontWeight: 800, color: GOLD, margin: '0 6px' }}>/</span>
            <span style={{ display: 'flex', fontSize: 120, fontWeight: 800, color: MUTED }}>{total}</span>
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, color: GOLD, marginTop: 6 }}>
            {firstName}’s score · {pct}% on {exam}{subject ? ` · ${subject}` : ''}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 30,
              fontWeight: 800,
              color: CREAM,
              background: INK2,
              border: `2px solid ${GOLD}`,
              padding: '16px 34px',
              borderRadius: 16,
            }}
          >
            Can you beat me? 🔥 prepady.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
