import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/share/result?name=&pct=&score=&total=&exam=&subject=
 * Renders a branded, downloadable result card (1200×630 PNG) students can save
 * and post to social. User-initiated sharing of their own score — no auth; the
 * values are just rendered onto the card.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const clamp = (s: string | null, n: number) => (s ?? '').slice(0, n)
  const name = clamp(sp.get('name'), 40) || 'A Prepady student'
  const firstName = name.split(' ')[0]
  const exam = clamp(sp.get('exam'), 40) || 'Exam'
  const subject = clamp(sp.get('subject'), 40)
  const pct = Math.max(0, Math.min(100, Number(sp.get('pct')) || 0))
  const score = clamp(sp.get('score'), 6)
  const total = clamp(sp.get('total'), 6)

  const INK = '#201B15'
  const INK2 = '#2B241B'
  const GOLD = '#F2A33C'
  const CREAM = '#F6F2E9'
  const MUTED = '#C9BFAD'
  const band = pct >= 75 ? 'Excellent' : pct >= 50 ? 'Solid effort' : 'Warming up'

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
          padding: '56px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, fontWeight: 800, color: CREAM }}>
            Prepady<span style={{ color: GOLD }}>.</span>
          </div>
          <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, color: GOLD, letterSpacing: 2, textTransform: 'uppercase' }}>
            {band}
          </div>
        </div>

        {/* Score block */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: 300,
              height: 300,
              borderRadius: 300,
              background: INK2,
              border: `10px solid ${GOLD}`,
            }}
          >
            <div style={{ display: 'flex', fontSize: 110, fontWeight: 800, color: CREAM, lineHeight: 1 }}>{pct}%</div>
            <div style={{ display: 'flex', fontSize: 26, color: MUTED, marginTop: 8 }}>{score} / {total}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
            <div style={{ display: 'flex', fontSize: 34, color: MUTED }}>{firstName} scored</div>
            <div style={{ display: 'flex', fontSize: 56, fontWeight: 800, color: CREAM, marginTop: 4 }}>{pct}% on {exam}</div>
            {subject ? (
              <div style={{ display: 'flex', fontSize: 30, color: GOLD, marginTop: 10 }}>{subject}</div>
            ) : null}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: CREAM }}>
            Think you can beat me?
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              fontWeight: 800,
              color: INK,
              background: GOLD,
              padding: '14px 28px',
              borderRadius: 14,
            }}
          >
            Practise free at prepady.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
