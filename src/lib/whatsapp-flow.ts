import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import { shuffle, isCorrectAnswer } from '@/lib/quiz'
import { examMatch } from '@/lib/exam-match'
import { sendText, sendList, sendImage, type Row } from '@/lib/whatsapp'

/**
 * Lean WhatsApp funnel: greet → pick exam → pick subject → 3 sample questions
 * graded in chat → shareable score card → deep-link to the full web CBT + signup.
 * The goal is acquisition, not a full in-chat CBT: it converts WhatsApp traffic
 * into the web app we already own.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://prepady.com').replace(/\/$/, '')
const SAMPLE_COUNT = 3
const LETTERS = ['A', 'B', 'C', 'D', 'E']
const enc = encodeURIComponent

interface QItem { id: number; q: string; options: string[]; correct: string }
interface SessionData {
  name?: string
  examId?: number; examName?: string
  subjectId?: number; subjectName?: string
  queue?: QItem[]; idx?: number; correct?: number
}

async function loadSession(payload: Payload, phone: string) {
  const res = await payload.find({ collection: 'whatsapp-sessions', where: { phone: { equals: phone } }, limit: 1, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
  return res.docs[0] as { id: number | string; step?: string; name?: string; data?: SessionData } | undefined
}
async function saveSession(payload: Payload, phone: string, name: string | undefined, step: string, data: SessionData, existingId?: number | string) {
  const body = { phone, name, step, data } as unknown as RequiredDataFromCollectionSlug<'whatsapp-sessions'>
  if (existingId) await payload.update({ collection: 'whatsapp-sessions', id: existingId, data: body, overrideAccess: true }).catch((e) => console.error('[wa] save', e))
  else await payload.create({ collection: 'whatsapp-sessions', data: body, overrideAccess: true }).catch((e) => console.error('[wa] create', e))
}

/** Exams that actually have published MCQs, top 10 by question count. */
async function examsWithContent(payload: Payload): Promise<Array<{ id: number; name: string }>> {
  const res = await payload.find({ collection: 'questions', where: { and: [{ status: { equals: 'published' } }, { questionType: { equals: 'mcq' } }, { passage: { exists: false } }] }, select: { exam: true, extraExams: true }, limit: 8000, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as Array<{ exam?: number; extraExams?: number[] }> }))
  const tally = new Map<number, number>()
  const bump = (id: unknown) => { if (typeof id === 'number') tally.set(id, (tally.get(id) ?? 0) + 1) }
  for (const d of res.docs) { bump((d as { exam?: number }).exam); for (const x of (d as { extraExams?: number[] }).extraExams ?? []) bump(x) }
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id)
  if (top.length === 0) return []
  const ex = await payload.find({ collection: 'exams', where: { id: { in: top } }, limit: 10, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as Array<{ id: number; code?: string }> }))
  const byId = new Map(ex.docs.map((e) => [e.id as number, String((e as { code?: string }).code ?? `Exam ${e.id}`)]))
  return top.map((id) => ({ id, name: byId.get(id) ?? `Exam ${id}` }))
}

async function subjectsWithContent(payload: Payload, examId: number): Promise<Array<{ id: number; name: string }>> {
  const res = await payload.find({ collection: 'questions', where: { and: [examMatch(examId), { status: { equals: 'published' } }, { questionType: { equals: 'mcq' } }, { passage: { exists: false } }] }, select: { subject: true }, limit: 8000, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as Array<{ subject?: number }> }))
  const tally = new Map<number, number>()
  for (const d of res.docs) { const id = (d as { subject?: number }).subject; if (typeof id === 'number') tally.set(id, (tally.get(id) ?? 0) + 1) }
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id)
  if (top.length === 0) return []
  const su = await payload.find({ collection: 'subjects', where: { id: { in: top } }, limit: 10, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as Array<{ id: number; name?: string }> }))
  const byId = new Map(su.docs.map((s) => [s.id as number, String((s as { name?: string }).name ?? `Subject ${s.id}`)]))
  return top.map((id) => ({ id, name: byId.get(id) ?? `Subject ${id}` }))
}

async function sendQuestion(phone: string, item: QItem, idx: number, total: number) {
  const rows: Row[] = item.options.slice(0, 5).map((o, i) => ({ id: `ans:${i}`, title: LETTERS[i], description: o }))
  await sendList(phone, item.q, 'Choose answer', rows, `Question ${idx + 1} of ${total}`)
}

async function startExam(payload: Payload, phone: string, name: string | undefined, id?: number | string) {
  const exams = await examsWithContent(payload)
  if (exams.length === 0) {
    await sendText(phone, `Welcome to Prepady 🎓\nPractise real past questions for your exam.\n\nWe’re loading questions right now — try again shortly, or start free at ${SITE_URL}`)
    return
  }
  await sendList(phone, 'Welcome to Prepady 🎓\nReal past questions, marked as soon as you answer.\n\nWhich exam?', 'Choose exam', exams.map((e) => ({ id: `exam:${e.id}`, title: e.name })), 'Prepady')
  await saveSession(payload, phone, name, 'await_exam', { name }, id)
}

export async function handleInbound(payload: Payload, args: { phone: string; name?: string; text?: string; replyId?: string | null }): Promise<void> {
  const { phone } = args
  const text = (args.text ?? '').trim()
  const replyId = args.replyId ?? null
  const sess = await loadSession(payload, phone)
  const name = args.name ?? sess?.name ?? undefined
  let step = sess?.step ?? 'new'
  const data: SessionData = sess?.data ?? {}

  // Global restart on a greeting / keyword.
  if (!replyId && /^(hi|hello|hey|start|menu|restart|begin|main|practice|past ?questions?)\b/i.test(text)) step = 'new'

  if (step === 'new' || (!replyId && step === 'done')) return startExam(payload, phone, name, sess?.id)

  // ── Exam chosen ───────────────────────────────────────────────────────────
  if (replyId?.startsWith('exam:')) {
    const examId = Number(replyId.slice(5))
    const subjects = await subjectsWithContent(payload, examId)
    const ex = await payload.findByID({ collection: 'exams', id: examId, depth: 0, overrideAccess: true }).catch(() => null)
    const examName = (ex as { code?: string } | null)?.code ?? 'Exam'
    if (subjects.length === 0) { await sendText(phone, `No questions for ${examName} yet. Start free at ${SITE_URL}`); return }
    await sendList(phone, `${examName} — which subject?`, 'Choose subject', subjects.map((s) => ({ id: `subj:${s.id}`, title: s.name })), examName)
    await saveSession(payload, phone, name, 'await_subject', { ...data, examId, examName }, sess?.id)
    return
  }

  // ── Subject chosen → serve sample questions ───────────────────────────────
  if (replyId?.startsWith('subj:')) {
    const subjectId = Number(replyId.slice(5))
    const su = await payload.findByID({ collection: 'subjects', id: subjectId, depth: 0, overrideAccess: true }).catch(() => null)
    const subjectName = (su as { name?: string } | null)?.name ?? 'Subject'
    const pool = await payload.find({ collection: 'questions', where: { and: [examMatch(data.examId as number), { subject: { equals: subjectId } }, { status: { equals: 'published' } }, { questionType: { equals: 'mcq' } }, { passage: { exists: false } }] }, limit: 50, depth: 0, overrideAccess: true }).catch(() => ({ docs: [] as Array<Record<string, unknown>> }))
    const picked = shuffle(pool.docs as Array<Record<string, unknown>>).slice(0, SAMPLE_COUNT)
    if (picked.length === 0) { await sendText(phone, `No questions for ${subjectName} yet. Try another subject, or start free at ${SITE_URL}`); return }
    const queue: QItem[] = picked.map((q) => ({
      id: q.id as number,
      q: String(q.questionText ?? ''),
      options: shuffle(((q.options as Array<{ text?: string }>) ?? []).map((o) => String(o.text ?? '')).filter(Boolean)),
      correct: String(q.correctAnswer ?? ''),
    }))
    await sendText(phone, `${data.examName} · ${subjectName}\n${queue.length} quick questions — reply with your answer. Let’s go! 👇`)
    await sendQuestion(phone, queue[0], 0, queue.length)
    await saveSession(payload, phone, name, 'await_answer', { ...data, subjectId, subjectName, queue, idx: 0, correct: 0 }, sess?.id)
    return
  }

  // ── Answer to the current question ────────────────────────────────────────
  if (replyId?.startsWith('ans:') && step === 'await_answer' && Array.isArray(data.queue)) {
    const queue = data.queue
    const idx = data.idx ?? 0
    const item = queue[idx]
    if (!item) { await startExam(payload, phone, name, sess?.id); return }
    const chosen = item.options[Number(replyId.slice(4))] ?? ''
    const right = isCorrectAnswer(chosen, item.correct)
    const correct = (data.correct ?? 0) + (right ? 1 : 0)
    await sendText(phone, right ? '✅ Correct!' : `❌ Not quite — the answer is *${item.correct}*.`)

    const nextIdx = idx + 1
    if (nextIdx < queue.length) {
      await sendQuestion(phone, queue[nextIdx], nextIdx, queue.length)
      await saveSession(payload, phone, name, 'await_answer', { ...data, idx: nextIdx, correct }, sess?.id)
      return
    }

    // Finished the sample → score card + conversion.
    const total = queue.length
    const pct = Math.round((correct / total) * 100)
    const card = `${SITE_URL}/api/share/result?name=${enc(name ?? 'You')}&pct=${pct}&score=${correct}&total=${total}&exam=${enc(data.examName ?? 'Exam')}&subject=${enc(data.subjectName ?? '')}`
    await sendImage(phone, card, `You scored ${correct}/${total} (${pct}%) on ${data.examName} ${data.subjectName}.`)
    await sendText(phone, `That’s just a taster. Get the *full ${data.examName} ${data.subjectName} paper*, timed CBT mocks and an AI tutor that explains every question — free to start:\n\n👉 ${SITE_URL}/signup\n\nSend *menu* to try another subject.`)
    await saveSession(payload, phone, name, 'done', { name }, sess?.id)
    return
  }

  // Fallback — re-prompt from the top.
  return startExam(payload, phone, name, sess?.id)
}
