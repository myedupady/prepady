import React from 'react'
import { getPayload } from 'payload'
import type { CollectionSlug, Where } from 'payload'
import configPromise from '@payload-config'

/**
 * Custom admin home — rendered above the default Payload dashboard via
 * admin.components.beforeDashboard. Shows live content/user stats, AI spend,
 * and quick actions, so the panel opens on something useful rather than a bare
 * list of collections. Styled with Payload theme vars (Tailwind isn't loaded
 * inside the admin SPA). Registered in the import map via `generate:importmap`.
 */
async function countWhere(payload: Awaited<ReturnType<typeof getPayload>>, collection: CollectionSlug, where: Where) {
  const r = await payload.count({ collection, where, overrideAccess: true }).catch(() => ({ totalDocs: 0 }))
  return r.totalDocs ?? 0
}

const card: React.CSSProperties = {
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 12,
  padding: '16px 18px',
}

export async function AdminDashboard() {
  const payload = await getPayload({ config: configPromise })

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const [users, newUsers7d, premium, questions, published, passages, sessions, exams] = await Promise.all([
    countWhere(payload, 'users', {}),
    countWhere(payload, 'users', { createdAt: { greater_than: sevenDaysAgo } }),
    countWhere(payload, 'users', { plan: { equals: 'premium' } }),
    countWhere(payload, 'questions', {}),
    countWhere(payload, 'questions', { status: { equals: 'published' } }),
    countWhere(payload, 'passages', {}),
    countWhere(payload, 'quiz-sessions', {}),
    countWhere(payload, 'exams', {}),
  ])

  const ai = (await payload.findGlobal({ slug: 'ai-controls', overrideAccess: true }).catch(() => ({}))) as {
    usage?: { spendUsd?: number; currentMonth?: string }
    controls?: { monthlyBudgetUsd?: number }
  }
  const spend = ai.usage?.spendUsd ?? 0
  const budget = ai.controls?.monthlyBudgetUsd ?? 0

  const tiles: { label: string; value: string | number; sub: string }[] = [
    { label: 'Students', value: users, sub: `${newUsers7d} new (7d) · ${premium} premium` },
    { label: 'Questions', value: questions, sub: `${published} published` },
    { label: 'Passages', value: passages, sub: 'comprehension' },
    { label: 'Quiz sessions', value: sessions, sub: `${exams} exams` },
    { label: 'AI spend (mo)', value: `$${spend.toFixed(2)}`, sub: budget ? `of $${budget} budget` : 'no cap' },
  ]

  const actions: { label: string; href: string }[] = [
    { label: '➕ New question', href: '/admin/collections/questions/create' },
    { label: '⬆️ Bulk import', href: '/import' },
    { label: '🎬 New video lesson', href: '/admin/collections/video-lessons/create' },
    { label: '📝 New post', href: '/admin/collections/posts/create' },
    { label: '💰 Finance', href: '/finance' },
    { label: '📊 Full insights', href: '/insights' },
  ]

  return (
    <div style={{ margin: '0 0 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--theme-elevation-900)' }}>
          Welcome to Prepady
        </h2>
        <span style={{ fontSize: 12, color: 'var(--theme-elevation-500)' }}>
          {ai.usage?.currentMonth ? `AI spend for ${ai.usage.currentMonth}` : 'Live overview'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
        {tiles.map((t) => (
          <div key={t.label} style={card}>
            <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--theme-elevation-900)' }}>{t.value}</p>
            <p style={{ margin: '2px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--theme-elevation-700)' }}>{t.label}</p>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--theme-elevation-500)' }}>{t.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {actions.map((a) => (
          <a
            key={a.href}
            href={a.href}
            style={{
              display: 'inline-block',
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--theme-elevation-200)',
              background: 'var(--theme-elevation-0)',
              color: 'var(--theme-elevation-800)',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            {a.label}
          </a>
        ))}
      </div>
    </div>
  )
}
