/**
 * Claude-powered AI layer for Prepady.
 *
 * MODEL CHOICE IS A DELIBERATE COST DECISION (see README → unit economics):
 * the high-volume "explain this" path defaults to the cheapest capable model,
 * Claude Haiku 4.5 (~$1/$5 per 1M tokens), keeping per-explanation cost around
 * ₦4 so it sits comfortably under a freemium subscription. Override per-feature
 * with the env vars below — bump to Sonnet 4.6 or Opus 4.8 for higher quality.
 *
 *   AI_EXPLAIN_MODEL  — "explain this" / step-by-step working   (default: claude-haiku-4-5)
 *   AI_MARKING_MODEL  — essay/theory marking (Phase 3)          (default: claude-sonnet-4-6)
 */

import Anthropic from '@anthropic-ai/sdk'

// Reads ANTHROPIC_API_KEY from the environment.
const client = new Anthropic()

const EXPLAIN_MODEL = process.env.AI_EXPLAIN_MODEL ?? 'claude-haiku-4-5'

const EXPLAIN_SYSTEM = `You are a patient Nigerian exam-prep tutor for WAEC, NECO, JAMB, Post-UTME, IGCSE and A-Level students.
Explain clearly and concisely at the level of a secondary-school student.
- For maths/sciences: show the working step by step, one step per line.
- State WHY the correct option is right and, when the student picked a wrong option, why theirs is wrong.
- Keep it short (a few sentences or a short numbered list). Plain text only — no markdown headings, no LaTeX, use / for division and ^ for powers.
- Do not invent facts beyond the question. If the question is ambiguous, say so briefly.`

export interface ExplainParams {
  exam: string
  subject?: string | null
  topic?: string | null
  questionText: string
  options?: string[]
  correctAnswer?: string | null
  givenAnswer?: string | null
}

/**
 * Generate a student-facing explanation for a question. Returns plain text.
 * Throws on API error — the caller decides how to surface it.
 */
export async function explainQuestion(params: ExplainParams): Promise<string> {
  const { exam, subject, topic, questionText, options, correctAnswer, givenAnswer } = params

  const lines: string[] = [
    `Exam: ${exam}${subject ? ` · Subject: ${subject}` : ''}${topic ? ` · Topic: ${topic}` : ''}`,
    '',
    `Question: ${questionText}`,
  ]
  if (options?.length) {
    lines.push('Options:')
    options.forEach((o, i) => lines.push(`${String.fromCharCode(65 + i)}. ${o}`))
  }
  if (correctAnswer) lines.push(`Correct answer: ${correctAnswer}`)
  if (givenAnswer) lines.push(`The student answered: ${givenAnswer}`)
  lines.push('', 'Explain this to me.')

  const response = await client.messages.create({
    model: EXPLAIN_MODEL,
    max_tokens: 800,
    system: EXPLAIN_SYSTEM,
    messages: [{ role: 'user', content: lines.join('\n') }],
  })

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim()
}
