/**
 * Google Gemini provider — STUB.
 *
 * Kept behind the same `AIProvider` interface so switching to it (for its
 * genuine free tier on the high-volume explain path) is a config change:
 *   1. Add GOOGLE_API_KEY to the environment.
 *   2. `pnpm add @google/genai`.
 *   3. Implement the three methods below with `new GoogleGenAI(...).models.generateContent`,
 *      mapping usageMetadata.{promptTokenCount,candidatesTokenCount,cachedContentTokenCount}
 *      into TokenUsage, and using a responseSchema for `mark()` (Gemini's equivalent
 *      of a forced tool call).
 *   4. Set AI_PROVIDER=gemini (and AI_EXPLAIN_MODEL=gemini-2.5-flash-lite).
 *
 * Until then `isConfigured()` returns false, so the orchestrator treats Gemini as
 * unavailable and the app degrades gracefully (stored explanations still serve).
 */

import {
  AIError,
  type AIProvider,
  type ExplainInput,
  type FollowUpInput,
  type MarkInput,
  type ProviderMarkResult,
  type ProviderTextResult,
} from '../types'

const NOT_IMPLEMENTED = new AIError(
  'Gemini provider is not implemented yet. See src/lib/ai/providers/gemini.ts for the steps to finish it.',
  'not_configured',
)

export const geminiProvider: AIProvider = {
  name: 'gemini',

  // Deliberately false until the methods below are implemented, even if a key is
  // present — this prevents selecting a non-functional provider by accident.
  isConfigured() {
    return false
  },

  async explain(_input: ExplainInput): Promise<ProviderTextResult> {
    throw NOT_IMPLEMENTED
  },
  async followUp(_input: FollowUpInput): Promise<ProviderTextResult> {
    throw NOT_IMPLEMENTED
  },
  async mark(_input: MarkInput): Promise<ProviderMarkResult> {
    throw NOT_IMPLEMENTED
  },
}
