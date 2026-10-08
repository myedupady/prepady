/**
 * AI orchestrator — the single entry point used by API routes, the Payload hook,
 * and the CLI. It:
 *   1. selects the configured provider,
 *   2. enforces the operational guards (kill switch + monthly budget),
 *   3. runs the call, and
 *   4. records cost + usage.
 *
 * Callers get back the text/result plus the measured USD cost. Guards throw a
 * typed `AIError` so routes can map them to the right HTTP status and fall back
 * to a stored explanation where one exists.
 */

import type { Payload } from 'payload'
import { estimateCostUsd, roundUsd } from './pricing'
import { anthropicProvider } from './providers/anthropic'
import { geminiProvider } from './providers/gemini'
import {
  AIError,
  type AICallKind,
  type AIProvider,
  type ExplainInput,
  type FollowUpInput,
  type MarkInput,
  type MarkResult,
} from './types'
import {
  type AIControls,
  type AIUsageSnapshot,
  getControls,
  getUsage,
  isOverBudget,
  recordUsage,
} from './usage'

export * from './types'
export { estimateCostUsd, priceFor, MODEL_PRICES } from './pricing'
export {
  getControls,
  getUsage,
  isOverBudget,
  DEFAULT_CONTROLS,
  type AIControls,
  type AIUsageSnapshot,
} from './usage'
export { ANTHROPIC_MODELS } from './providers/anthropic'

const PROVIDERS: Record<string, AIProvider> = {
  anthropic: anthropicProvider,
  gemini: geminiProvider,
}

/**
 * Resolve the provider to use: the one named in controls, falling back to
 * Anthropic when the named one is not configured. Throws if none is configured.
 */
export function resolveProvider(controls: Pick<AIControls, 'provider'>): AIProvider {
  const chosen = PROVIDERS[controls.provider] ?? anthropicProvider
  if (chosen.isConfigured()) return chosen
  if (anthropicProvider.isConfigured()) return anthropicProvider
  if (geminiProvider.isConfigured()) return geminiProvider
  throw new AIError('No AI provider is configured (set ANTHROPIC_API_KEY).', 'not_configured')
}

/**
 * Pure guard — throws when live AI must not run. Extracted for unit testing.
 */
export function guardLiveAI(args: {
  controls: AIControls
  usage: AIUsageSnapshot
  providerConfigured: boolean
}): void {
  if (!args.providerConfigured) {
    throw new AIError('AI provider is not configured.', 'not_configured')
  }
  if (args.controls.paused) {
    throw new AIError('AI is temporarily paused by an administrator.', 'paused')
  }
  if (isOverBudget(args.controls, args.usage)) {
    throw new AIError('AI monthly budget reached.', 'budget_exceeded')
  }
}

/** Is any provider ready to serve live calls right now? */
export function isAIConfigured(): boolean {
  return anthropicProvider.isConfigured() || geminiProvider.isConfigured()
}

async function preflight(payload: Payload): Promise<{ provider: AIProvider; controls: AIControls }> {
  const [controls, usage] = await Promise.all([getControls(payload), getUsage(payload)])
  const provider = resolveProvider(controls)
  guardLiveAI({ controls, usage, providerConfigured: provider.isConfigured() })
  return { provider, controls }
}

export interface TextOutcome {
  text: string
  model: string
  costUsd: number
}

export interface MarkOutcome {
  result: MarkResult
  model: string
  costUsd: number
}

/**
 * Generate a question explanation. `meterKind` distinguishes an on-publish/CLI
 * auto-generation ('autogen') from an on-demand student generation ('explain')
 * purely for the usage counters; both cost the same.
 */
export async function generateExplanation(
  payload: Payload,
  input: ExplainInput,
  opts: { meterKind?: 'explain' | 'autogen' } = {},
): Promise<TextOutcome> {
  const { provider } = await preflight(payload)
  const out = await provider.explain(input)
  const costUsd = roundUsd(estimateCostUsd(out.model, out.usage))
  await recordUsage(payload, { kind: opts.meterKind ?? 'explain', costUsd })
  return { text: out.text, model: out.model, costUsd }
}

/** Answer a student's follow-up about a question they've already seen explained. */
export async function answerFollowUp(payload: Payload, input: FollowUpInput): Promise<TextOutcome> {
  const { provider } = await preflight(payload)
  const out = await provider.followUp(input)
  const costUsd = roundUsd(estimateCostUsd(out.model, out.usage))
  await recordUsage(payload, { kind: 'followup', costUsd })
  return { text: out.text, model: out.model, costUsd }
}

/** Mark a theory/essay answer against its scheme. */
export async function markEssay(payload: Payload, input: MarkInput): Promise<MarkOutcome> {
  const { provider } = await preflight(payload)
  const out = await provider.mark(input)
  const costUsd = roundUsd(estimateCostUsd(out.model, out.usage))
  await recordUsage(payload, { kind: 'mark' as AICallKind, costUsd })
  return { result: out.result, model: out.model, costUsd }
}
