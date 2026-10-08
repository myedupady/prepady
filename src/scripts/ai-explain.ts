/**
 * Bulk-backfill AI explanations for the MCQ question bank.
 *
 *   pnpm ai:explain                      # fill every published MCQ missing an explanation
 *   pnpm ai:explain -- --dry-run         # show what would run + estimated cost, change nothing
 *   pnpm ai:explain -- --exam JAMB       # only questions for the exam whose code is JAMB
 *   pnpm ai:explain -- --limit 50        # cap the number processed
 *   pnpm ai:explain -- --force           # regenerate even where an explanation already exists
 *   pnpm ai:explain -- --concurrency 6   # parallelism (default 4)
 *
 * Each generated explanation is stored on the question, so from then on students
 * read it for free (no further AI cost). Spend is metered into the AI Controls
 * global exactly like live calls, and the monthly budget / pause switch are honoured.
 */
import { getPayload } from 'payload'
import type { Where } from 'payload'
import configPromise from '@payload-config'
import { generateExplanation, isAIConfigured, isAIError } from '@/lib/ai'
import { estimateCostUsd, priceFor } from '@/lib/ai/pricing'
import { relName } from '@/lib/utils'

interface Args {
  dryRun: boolean
  force: boolean
  limit: number
  exam?: string
  concurrency: number
}

function parseArgs(argv: string[]): Args {
  const a: Args = { dryRun: false, force: false, limit: Infinity, concurrency: 4 }
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i]
    if (t === '--dry-run') a.dryRun = true
    else if (t === '--force') a.force = true
    else if (t === '--limit') a.limit = Math.max(1, Number(argv[++i]) || 1)
    else if (t === '--exam') a.exam = argv[++i]
    else if (t === '--concurrency') a.concurrency = Math.max(1, Math.min(10, Number(argv[++i]) || 4))
  }
  return a
}

const EXPLAIN_MODEL = process.env.AI_EXPLAIN_MODEL ?? 'claude-haiku-4-5'
// Rough per-question token shape for the dry-run estimate.
const EST_USAGE = { inputTokens: 450, outputTokens: 300, cachedInputTokens: 200 }

async function run() {
  const args = parseArgs(process.argv.slice(2))
  const payload = await getPayload({ config: configPromise })

  if (!args.dryRun && !isAIConfigured()) {
    console.error('✗ No AI provider configured. Set ANTHROPIC_API_KEY and try again.')
    process.exit(1)
  }

  // Resolve --exam code → id.
  let examId: number | undefined
  if (args.exam) {
    const ex = await payload.find({ collection: 'exams', where: { code: { equals: args.exam } }, limit: 1, depth: 0 })
    if (!ex.docs[0]) {
      console.error(`✗ No exam found with code "${args.exam}".`)
      process.exit(1)
    }
    examId = ex.docs[0].id as number
    console.log(`Filtering to exam ${args.exam} (id ${examId}).`)
  }

  const where: Where = {
    and: [
      { status: { equals: 'published' } },
      { questionType: { equals: 'mcq' } },
      ...(examId ? [{ exam: { equals: examId } } as Where] : []),
    ],
  }

  const found = await payload.find({ collection: 'questions', where, limit: 10000, depth: 1 })
  const candidates = found.docs
    .filter((q) => args.force || !(typeof q.explanation === 'string' && q.explanation.trim().length > 0))
    .filter((q) => !!(q as { correctAnswer?: string }).correctAnswer)
    .slice(0, args.limit)

  console.log(`\nFound ${found.docs.length} published MCQ(s); ${candidates.length} need${candidates.length === 1 ? 's' : ''} an explanation${args.force ? ' (force mode)' : ''}.`)

  if (candidates.length === 0) {
    console.log('Nothing to do. ✅')
    process.exit(0)
  }

  const p = priceFor(EXPLAIN_MODEL)
  const estPer = estimateCostUsd(EXPLAIN_MODEL, EST_USAGE)
  console.log(
    `Model: ${EXPLAIN_MODEL} ($${p.input}/$${p.output} per 1M). Estimated ~$${estPer.toFixed(4)}/question → ~$${(estPer * candidates.length).toFixed(2)} total.`,
  )

  if (args.dryRun) {
    console.log('\n--dry-run: no API calls made, nothing written. ✅')
    process.exit(0)
  }

  let done = 0
  let failed = 0
  let spend = 0
  const queue = [...candidates]

  async function worker(id: number) {
    for (;;) {
      const q = queue.shift()
      if (!q) return
      const exam = q.exam as { code?: string; name?: string } | null
      const subject = q.subject as { name?: string } | null
      const options = Array.isArray(q.options)
        ? (q.options as Array<{ text?: string }>).map((o) => o.text ?? '').filter(Boolean)
        : []
      try {
        const { text, model, costUsd } = await generateExplanation(
          payload,
          {
            exam: exam?.code ?? exam?.name ?? 'this exam',
            subject: subject?.name ?? null,
            topic: relName(q.topicRef) ?? (typeof q.topic === 'string' ? q.topic : null),
            questionText: String(q.questionText ?? ''),
            options,
            correctAnswer: (q as { correctAnswer?: string }).correctAnswer ?? null,
          },
          { meterKind: 'autogen' },
        )
        if (text) {
          await payload.update({
            collection: 'questions',
            id: q.id,
            overrideAccess: true,
            context: { triggeredByAIGen: true },
            data: { explanation: text, explanationGeneratedBy: `ai:${model}` },
          })
        }
        spend += costUsd
        done++
        console.log(`  [${done}/${candidates.length}] ✓ q${q.id} (+$${costUsd.toFixed(4)}, total $${spend.toFixed(3)})`)
      } catch (err) {
        failed++
        if (isAIError(err) && (err.code === 'budget_exceeded' || err.code === 'paused' || err.code === 'not_configured')) {
          console.error(`\n✗ Stopping: ${err.message}`)
          queue.length = 0 // drain so other workers stop too
          return
        }
        console.error(`  ✗ q${q.id} failed: ${String(err)}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(args.concurrency, candidates.length) }, (_, i) => worker(i)))

  console.log(`\nDone. ${done} generated, ${failed} failed. Measured spend this run: $${spend.toFixed(4)}. ✅`)
  process.exit(failed > 0 ? 1 : 0)
}

run().catch((err) => {
  console.error('ai:explain failed:', err)
  process.exit(1)
})
