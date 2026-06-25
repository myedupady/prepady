/**
 * Seeds the exam catalogue (6 regions + the full pan-African exam list) into the
 * database from the canonical list in src/lib/exams.ts. Idempotent — safe to
 * re-run; it updates existing rows (matched by slug / code+country) rather than
 * duplicating. Run with: pnpm seed
 */
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { REGIONS, EXAMS } from '@/lib/exams'

async function run() {
  const payload = await getPayload({ config: configPromise })

  // ── Regions ───────────────────────────────────────────────────────────────
  const regionId: Record<string, number> = {}
  for (const r of REGIONS) {
    const existing = await payload.find({ collection: 'regions', where: { slug: { equals: r.value } }, limit: 1 })
    if (existing.docs[0]) {
      regionId[r.value] = existing.docs[0].id as number
      await payload.update({ collection: 'regions', id: existing.docs[0].id, data: { name: r.label, color: r.color, order: r.order } })
    } else {
      const doc = await payload.create({ collection: 'regions', data: { name: r.label, slug: r.value, color: r.color, order: r.order } })
      regionId[r.value] = doc.id as number
    }
  }
  console.log(`Regions: ${REGIONS.length} ensured`)

  // ── Exams ─────────────────────────────────────────────────────────────────
  let created = 0
  let updated = 0
  for (const [i, e] of EXAMS.entries()) {
    const existing = await payload.find({
      collection: 'exams',
      where: { and: [{ code: { equals: e.label } }, { country: { equals: e.country } }] },
      limit: 1,
    })
    const data = {
      code: e.label,
      name: e.full ?? e.label,
      country: e.country,
      region: regionId[e.region],
      status: 'active' as const,
      order: i,
    }
    if (existing.docs[0]) {
      await payload.update({ collection: 'exams', id: existing.docs[0].id, data })
      updated++
    } else {
      await payload.create({ collection: 'exams', data })
      created++
    }
  }
  console.log(`Exams: ${created} created, ${updated} updated (total ${EXAMS.length})`)
  console.log('✅ Seed complete')
  process.exit(0)
}

run().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
