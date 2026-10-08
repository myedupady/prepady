/**
 * Shared types for the Prepady AI layer.
 *
 * The whole AI feature set is expressed through one small provider interface
 * (`AIProvider`) with three capabilities — explain, follow-up, mark — so that
 * swapping Anthropic ⇆ Gemini (or adding another) is a config change, never a
 * rewrite of the routes, hooks, or CLI that consume it.
 */

import type { TokenUsage } from './pricing'

export type AIProviderName = 'anthropic' | 'gemini'

/** What the model is being asked to do — used for metering and logging. */
export type AICallKind = 'explain' | 'followup' | 'mark'

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface ExplainInput {
  exam: string
  subject?: string | null
  topic?: string | null
  questionText: string
  options?: string[]
  correctAnswer?: string | null
  /** The option the student picked, if any — lets the model address their mistake. */
  givenAnswer?: string | null
}

export interface FollowUpInput extends ExplainInput {
  /** The explanation already shown to the student (stored or previously generated). */
  priorExplanation: string
  /** The student's follow-up, e.g. "explain it more simply" or "where did the 3 come from?". */
  message: string
}

export interface MarkInput {
  exam: string
  subject?: string | null
  topic?: string | null
  questionText: string
  /** The marking guide / model answer the grade must be justified against. */
  markingScheme: string
  maxMarks: number
  /** The student's submitted answer. */
  answer: string
}

// ── Outputs ──────────────────────────────────────────────────────────────────

/** Structured, deterministic marking result — never a free-form grade. */
export interface MarkResult {
  score: number
  maxMarks: number
  /** One of a fixed set, derived from score/maxMarks for consistent UI. */
  verdict: 'excellent' | 'good' | 'fair' | 'weak'
  strengths: string[]
  improvements: string[]
  /** 1–2 sentence overall summary addressed to the student. */
  summary: string
}

/** Low-level result returned by a provider for a text call (explain / followup). */
export interface ProviderTextResult {
  text: string
  model: string
  usage: TokenUsage
}

/** Low-level result returned by a provider for a marking call. */
export interface ProviderMarkResult {
  result: MarkResult
  model: string
  usage: TokenUsage
}

/**
 * A provider implements these three capabilities. `isConfigured()` reports
 * whether the required API key is present so callers can degrade gracefully
 * (e.g. fall back to a stored explanation) instead of throwing.
 */
export interface AIProvider {
  readonly name: AIProviderName
  isConfigured(): boolean
  explain(input: ExplainInput): Promise<ProviderTextResult>
  followUp(input: FollowUpInput): Promise<ProviderTextResult>
  mark(input: MarkInput): Promise<ProviderMarkResult>
}

// ── Errors (typed so routes can map them to the right HTTP status) ────────────

export class AIError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'not_configured'
      | 'paused'
      | 'budget_exceeded'
      | 'invalid_output'
      | 'provider_error',
  ) {
    super(message)
    this.name = 'AIError'
  }
}

export const isAIError = (e: unknown): e is AIError => e instanceof AIError
