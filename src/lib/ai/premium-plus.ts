/**
 * Premium Plus AI features: Snap & Solve (vision) and Voice/Ask (text Q&A).
 * These call Claude directly but still run through the same operational guards
 * (kill switch + monthly budget) and record cost into the usage counters, so the
 * finance/AI controls still apply. Gating + per-user daily caps live in the routes.
 */
import Anthropic from '@anthropic-ai/sdk'
import type { Payload } from 'payload'
import { getControls, getUsage, isOverBudget, recordUsage } from './usage'
import { estimateCostUsd, roundUsd, type TokenUsage } from './pricing'
import { AIError } from './types'

const SNAP_MODEL = process.env.AI_SNAP_MODEL ?? 'claude-haiku-4-5'
const ASK_MODEL = process.env.AI_ASK_MODEL ?? 'claude-haiku-4-5'

export type SnapMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new AIError('ANTHROPIC_API_KEY is not set.', 'not_configured')
  if (!_client) _client = new Anthropic()
  return _client
}

function usageFrom(u: Anthropic.Usage): TokenUsage {
  const cached = u.cache_read_input_tokens ?? 0
  return { inputTokens: (u.input_tokens ?? 0) + cached, outputTokens: u.output_tokens ?? 0, cachedInputTokens: cached }
}
function extractText(content: Anthropic.ContentBlock[]): string {
  return content.filter((b): b is Anthropic.TextBlock => b.type === 'text').map((b) => b.text).join('').trim()
}

async function guard(payload: Payload): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) throw new AIError('AI provider is not configured.', 'not_configured')
  const [controls, usage] = await Promise.all([getControls(payload), getUsage(payload)])
  if (controls.paused) throw new AIError('AI is temporarily paused by an administrator.', 'paused')
  if (isOverBudget(controls, usage)) throw new AIError('AI monthly budget reached.', 'budget_exceeded')
}

const SNAP_SYSTEM =
  'You are an expert tutor for African exams (JAMB/UTME, WAEC/WASSCE, NECO and similar). A student has sent a PHOTO of one exam question. Read it carefully, including options, diagrams and any maths. Reply with: (1) the correct answer stated clearly, then (2) a concise step-by-step explanation they can learn from. If the photo is unclear or is not an exam question, say so briefly and ask for a clearer photo. Keep under ~200 words, plain text (no markdown headers).'

const ASK_SYSTEM =
  'You are a friendly, rigorous tutor for African exams (JAMB/UTME, WAEC/WASSCE, NECO and similar). Answer the student’s question clearly and concisely, with a short worked explanation where relevant. Stay focused on study help. Under ~200 words, plain text.'

export interface PPTextOutcome { text: string; model: string; costUsd: number }

export async function solveImage(
  payload: Payload,
  args: { imageBase64: string; mediaType: SnapMediaType; note?: string },
): Promise<PPTextOutcome> {
  await guard(payload)
  const note = args.note?.trim()
  const res = await client().messages.create({
    model: SNAP_MODEL,
    max_tokens: 900,
    temperature: 0.2,
    system: [{ type: 'text', text: SNAP_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: args.mediaType, data: args.imageBase64 } },
          { type: 'text', text: note ? `The student adds: "${note}". Solve the question in the image.` : 'Solve the question in the image.' },
        ],
      },
    ],
  })
  const text = extractText(res.content)
  const costUsd = roundUsd(estimateCostUsd(SNAP_MODEL, usageFrom(res.usage)))
  await recordUsage(payload, { kind: 'explain', costUsd })
  return { text, model: SNAP_MODEL, costUsd }
}

export async function tutorAsk(payload: Payload, args: { question: string }): Promise<PPTextOutcome> {
  await guard(payload)
  const res = await client().messages.create({
    model: ASK_MODEL,
    max_tokens: 700,
    temperature: 0.4,
    system: [{ type: 'text', text: ASK_SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: args.question.slice(0, 2000) }],
  })
  const text = extractText(res.content)
  const costUsd = roundUsd(estimateCostUsd(ASK_MODEL, usageFrom(res.usage)))
  await recordUsage(payload, { kind: 'followup', costUsd })
  return { text, model: ASK_MODEL, costUsd }
}
